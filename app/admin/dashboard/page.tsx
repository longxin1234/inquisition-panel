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
import {
  getAdminDashboardOverviewSnapshot,
  loadAdminDashboardOverview,
} from "@/lib/admin-dashboard-resource"
import { isTokenValid } from "@/lib/api-config"

const REFRESH_INTERVAL_MS = 15_000

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="正在加载总览" aria-busy="true">
      <div className="flex min-h-14 items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-64 max-w-[70vw]" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-none border-b border-r border-border md:h-28" />)}
      </div>
      <Skeleton className="h-14 rounded-lg" />
      <div className="grid items-start gap-5 xl:grid-cols-12">
        <Skeleton className="h-80 rounded-lg xl:col-span-8" />
        <Skeleton className="h-80 rounded-lg xl:col-span-4" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-12">
        <Skeleton className="h-80 rounded-lg xl:col-span-7" />
        <Skeleton className="h-80 rounded-lg xl:col-span-5" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
    </div>
  )
}

export default function AdminDashboard() {
  const { token, isLoading: authLoading } = useAuth()
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(() =>
    token && isTokenValid(token) ? getAdminDashboardOverviewSnapshot(token) : null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stale, setStale] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(() => overview?.generatedAt || null)
  const inFlightRef = useRef(false)
  const hasSnapshotRef = useRef(Boolean(overview))
  const mountedRef = useRef(false)
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
    const requestId = ++requestIdRef.current
    try {
      const result = await loadAdminDashboardOverview(token, { force: background })
      if (!isCurrentDashboardRequest({
        mounted: mountedRef.current,
        aborted: false,
        requestId,
        currentRequestId: requestIdRef.current,
      })) return
      hasSnapshotRef.current = true
      setOverview(result)
      setLastSuccessAt(result.generatedAt)
      setStale(false)
      setError(null)
    } catch (requestError) {
      if (!isCurrentDashboardRequest({
        mounted: mountedRef.current,
        aborted: false,
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
      inFlightRef.current = false
    }
  }, [authLoading, token])

  useEffect(() => {
    if (authState !== "ready") return
    mountedRef.current = true
    if (token) {
      const cached = getAdminDashboardOverviewSnapshot(token)
      if (cached && !hasSnapshotRef.current) {
        hasSnapshotRef.current = true
        setOverview(cached)
        setLastSuccessAt(cached.generatedAt)
        setLoading(false)
      }
    }
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
    }
  }, [authState, fetchOverview, token])

  if (authState === "loading") {
    return (
      <DashboardLayout contentClassName="max-w-[1600px]">
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (authState === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-muted-foreground">请先登录</div>
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
            <h1 className="text-xl font-semibold text-foreground">总览加载失败</h1>
            <p className="mt-2 max-w-lg break-words text-sm text-muted-foreground">{error || "无法获取数据"}</p>
          </div>
          <Button onClick={() => void fetchOverview(false)}>重试</Button>
        </div>
      </DashboardLayout>
    )
  }

  const statusMeta = getOverallStatusMeta(overview.overallStatus)

  return (
    <DashboardLayout contentClassName="max-w-[1600px]">
      <div className="space-y-5">
        <header className="flex min-h-16 flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">管理员总览</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {statusMeta.label}
              </span>
              {stale && (
                <span className="rounded-full border border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] px-2.5 py-1 text-xs font-medium text-[hsl(var(--status-warning))]">
                  数据已过期
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>游戏日 {formatGameDay(overview.gameDay)} · 04:00 起</span>
              <span className="flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                更新 {formatDashboardTime(lastSuccessAt || overview.generatedAt)}
              </span>
              {refreshing && <span className="text-foreground">刷新中</span>}
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

        <div className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <TaskSnapshot tasks={overview.tasks} />
          </div>
          <div className="xl:col-span-4">
            <DeviceSnapshot devices={overview.devices} />
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <AccountProgress accounts={overview.accounts} />
          </div>
          <div className="xl:col-span-5">
            <ScheduledTaskHealth scheduledTasks={overview.scheduledTasks} />
          </div>
        </div>

        <BusinessSummary business={overview.business} />
      </div>
    </DashboardLayout>
  )
}
