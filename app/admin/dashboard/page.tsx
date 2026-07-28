"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Clock3, RefreshCw } from "lucide-react"

import { AccountProgress } from "@/components/admin-dashboard/account-progress"
import { AlertStrip } from "@/components/admin-dashboard/alert-strip"
import { BusinessSummary } from "@/components/admin-dashboard/business-summary"
import { DeviceSnapshot } from "@/components/admin-dashboard/device-snapshot"
import { OverviewMetrics } from "@/components/admin-dashboard/overview-metrics"
import { ScheduledTaskHealth } from "@/components/admin-dashboard/scheduled-task-health"
import { TaskSnapshot } from "@/components/admin-dashboard/task-snapshot"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import {
  type AdminDashboardOverview,
  formatDashboardTime,
  formatGameDay,
  getDashboardAuthState,
  getOverallStatusMeta,
  isCurrentDashboardRequest,
  shouldStartDashboardRefresh,
} from "@/lib/admin-dashboard"
import { apiRequestWithAuth, isTokenValid } from "@/lib/api-config"

const REFRESH_INTERVAL_MS = 15_000

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="正在加载总览">
      <div className="flex min-h-14 items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-md" />)}
      </div>
      <Skeleton className="h-11 rounded-md" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Skeleton className="h-80 rounded-md" />
        <Skeleton className="h-80 rounded-md" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-md" />
        <Skeleton className="h-80 rounded-md" />
      </div>
      <Skeleton className="h-20 rounded-md" />
    </div>
  )
}

export default function AdminDashboard() {
  const { token, isLoading: authLoading } = useAuth()
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stale, setStale] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const hasSnapshotRef = useRef(false)
  const mountedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const authState = getDashboardAuthState({ authLoading, tokenValid: isTokenValid(token) })

  const fetchOverview = useCallback(async (background: boolean) => {
    if (authLoading) return
    if (!token || !isTokenValid(token)) {
      if (mountedRef.current) {
        setError("登录状态已失效")
        setLoading(false)
      }
      return
    }
    const visible = typeof document === "undefined" || !document.hidden
    if (!shouldStartDashboardRefresh({ visible, inFlight: inFlightRef.current })) return

    inFlightRef.current = true
    if (background || hasSnapshotRef.current) setRefreshing(true)
    else setLoading(true)
    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    abortRef.current = controller
    try {
      const result = await apiRequestWithAuth<AdminDashboardOverview>("/getDashboardOverview", token, {
        method: "GET",
        signal: controller.signal,
      })
      if (result.code !== 200 || !result.data) {
        throw new Error(result.msg || "获取总览失败")
      }
      if (!isCurrentDashboardRequest({
        mounted: mountedRef.current,
        aborted: controller.signal.aborted,
        requestId,
        currentRequestId: requestIdRef.current,
      })) return
      hasSnapshotRef.current = true
      setOverview(result.data)
      setLastSuccessAt(result.data.generatedAt)
      setStale(false)
      setError(null)
    } catch (requestError) {
      if (!isCurrentDashboardRequest({
        mounted: mountedRef.current,
        aborted: controller.signal.aborted,
        requestId,
        currentRequestId: requestIdRef.current,
      })) return
      const message = requestError instanceof Error ? requestError.message : "无法连接到后端"
      if (hasSnapshotRef.current) setStale(true)
      else setError(message)
    } finally {
      if (requestId !== requestIdRef.current) return
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
      if (abortRef.current === controller) abortRef.current = null
      inFlightRef.current = false
    }
  }, [authLoading, token])

  useEffect(() => {
    if (authState !== "ready") return
    mountedRef.current = true
    void fetchOverview(false)
    const timer = window.setInterval(() => {
      if (!document.hidden) void fetchOverview(true)
    }, REFRESH_INTERVAL_MS)
    const handleVisibilityChange = () => {
      if (!document.hidden) void fetchOverview(true)
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      mountedRef.current = false
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      requestIdRef.current += 1
      inFlightRef.current = false
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [authState, fetchOverview])

  if (authState === "loading") {
    return (
      <DashboardLayout contentClassName="max-w-[1600px]">
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (authState === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-gray-600 dark:text-gray-400">请先登录</div>
          <Button onClick={() => (window.location.href = "/")}>返回登录</Button>
        </div>
      </div>
    )
  }

  if (loading && !overview) {
    return (
      <DashboardLayout contentClassName="max-w-[1600px]">
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (!overview) {
    return (
      <DashboardLayout contentClassName="max-w-[1600px]">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-950 dark:text-white">总览加载失败</h1>
            <p className="mt-2 max-w-lg break-words text-sm text-gray-500 dark:text-gray-400">{error || "无法获取数据"}</p>
          </div>
          <Button onClick={() => void fetchOverview(false)}>重试</Button>
        </div>
      </DashboardLayout>
    )
  }

  const statusMeta = getOverallStatusMeta(overview.overallStatus)

  return (
    <DashboardLayout contentClassName="max-w-[1600px]">
      <main className="space-y-5">
        <header className="flex min-h-14 flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-950 dark:text-white">管理员总览</h1>
              <span className={`rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
              {stale && (
                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  数据已过期
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>游戏日 {formatGameDay(overview.gameDay)} · 04:00 起</span>
              <span className="flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                更新 {formatDashboardTime(lastSuccessAt || overview.generatedAt)}
              </span>
              {refreshing && <span className="text-blue-700 dark:text-blue-300">刷新中</span>}
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0 self-end sm:self-auto"
            onClick={() => void fetchOverview(true)}
            disabled={refreshing}
            title="刷新总览"
            aria-label="刷新总览"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </header>

        <OverviewMetrics overview={overview} />
        <AlertStrip alerts={overview.alerts} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <TaskSnapshot tasks={overview.tasks} />
          <DeviceSnapshot devices={overview.devices} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <AccountProgress accounts={overview.accounts} />
          <ScheduledTaskHealth scheduledTasks={overview.scheduledTasks} />
        </div>

        <BusinessSummary business={overview.business} />
      </main>
    </DashboardLayout>
  )
}
