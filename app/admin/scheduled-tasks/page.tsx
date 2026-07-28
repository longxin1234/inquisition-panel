"use client"

import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock3,
  Loader2,
  PauseCircle,
  RefreshCw,
  TimerOff,
  XCircle,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"
import { cn } from "@/lib/utils"
import { parseScheduledTaskFilter, replaceSearchParam } from "@/lib/admin-dashboard"
import {
  filterScheduledTasks,
  formatDuration,
  formatTaskDateTime,
  getTaskStatusMeta,
  type ScheduledTaskFilter,
  type ScheduledTaskOverview,
  type ScheduledTaskStatus,
} from "@/lib/scheduled-task"

const FILTERS: Array<{ key: ScheduledTaskFilter; label: string }> = [
  { key: "ALL", label: "全部" },
  { key: "ABNORMAL", label: "异常" },
  { key: "RUNNING", label: "运行中" },
  { key: "DISABLED", label: "已停用" },
]

const TONE_CLASSES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  muted: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

function StatusIcon({ status, className }: { status: string; className?: string }) {
  const props = { className: cn("h-3.5 w-3.5 shrink-0", className), "aria-hidden": true }
  if (status === "HEALTHY") return <CheckCircle2 {...props} />
  if (status === "RUNNING") return <Loader2 {...props} className={cn(props.className, "animate-spin")} />
  if (status === "FAILED") return <XCircle {...props} />
  if (status === "MISSED") return <TimerOff {...props} />
  if (status === "STALLED") return <AlertCircle {...props} />
  if (status === "WAITING") return <CircleDashed {...props} />
  if (status === "DISABLED") return <PauseCircle {...props} />
  return <AlertCircle {...props} />
}

function StatusBadge({ status }: { status: string }) {
  const meta = getTaskStatusMeta(status)
  return (
    <Badge variant="outline" className={cn("gap-1 whitespace-nowrap font-medium", TONE_CLASSES[meta.tone])}>
      <StatusIcon status={status} />
      {meta.label}
    </Badge>
  )
}

function TaskDetails({ task }: { task: ScheduledTaskStatus }) {
  return (
    <div className="grid gap-4 px-1 py-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
      <div className="min-w-0 xl:col-span-2">
        <div className="text-xs text-muted-foreground">任务说明</div>
        <div className="mt-1 break-words text-foreground">{task.description || "-"}</div>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">任务标识</div>
        <div className="mt-1 break-all font-mono text-xs text-foreground">{task.key}</div>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">Cron / 时区</div>
        <div className="mt-1 break-all font-mono text-xs text-foreground">{task.cron}</div>
        <div className="mt-1 text-xs text-muted-foreground">{task.timeZone}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">最近触发来源</div>
        <div className="mt-1 text-foreground">
          {task.lastTriggerSource === "STARTUP_RECOVERY" ? "启动补偿" : task.lastTriggerSource || "-"}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">执行次数</div>
        <div className="mt-1 text-foreground">{task.runCount}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">连续失败</div>
        <div className="mt-1 text-foreground">{task.consecutiveFailures}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">状态更新时间</div>
        <div className="mt-1 text-foreground">{formatTaskDateTime(task.updatedAt)}</div>
      </div>
      {task.lastError && (
        <div className="min-w-0 sm:col-span-2 xl:col-span-4">
          <div className="text-xs text-red-600 dark:text-red-400">最近错误</div>
          <div className="mt-1 break-words rounded-md border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {task.lastError}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScheduledTasksPage() {
  return (
    <Suspense fallback={null}>
      <ScheduledTasksPageContent />
    </Suspense>
  )
}

function ScheduledTasksPageContent() {
  const { token: contextToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlFilter = parseScheduledTaskFilter(searchParams.get("filter"))
  const [overview, setOverview] = useState<ScheduledTaskOverview | null>(null)
  const [filter, setFilter] = useState<ScheduledTaskFilter>(urlFilter)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getToken = useCallback(() => contextToken || getStoredToken(), [contextToken])

  const fetchTasks = useCallback(
    async (background = false) => {
      const token = getToken()
      if (!token || !isTokenValid(token)) {
        setError("登录状态已失效")
        setLoading(false)
        return
      }
      if (background) setRefreshing(true)
      else setLoading(true)
      try {
        const result = await apiRequestWithAuth<ScheduledTaskOverview>("/showScheduledTaskList", token, {
          method: "GET",
        })
        if (result.code !== 200 || !result.data) {
          throw new Error(result.msg || "获取脚本任务失败")
        }
        setOverview(result.data)
        setError(null)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "无法连接到后端")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [getToken],
  )

  useEffect(() => {
    void fetchTasks(false)
    const timer = window.setInterval(() => void fetchTasks(true), 30_000)
    return () => window.clearInterval(timer)
  }, [fetchTasks])

  useEffect(() => {
    setFilter(urlFilter)
  }, [urlFilter])

  const handleFilterChange = (nextFilter: ScheduledTaskFilter) => {
    setFilter(nextFilter)
    const query = replaceSearchParam(new URLSearchParams(searchParams.toString()), "filter", nextFilter, "ALL")
    router.replace(query ? `/admin/scheduled-tasks?${query}` : "/admin/scheduled-tasks", { scroll: false })
  }

  const visibleTasks = useMemo(
    () => filterScheduledTasks(overview?.tasks || [], filter),
    [filter, overview?.tasks],
  )

  const summaryItems = overview
    ? [
        { label: "全部", value: overview.totalCount, icon: CalendarClock, className: "text-gray-700 dark:text-gray-200" },
        { label: "正常", value: overview.healthyCount, icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
        { label: "运行中", value: overview.runningCount, icon: Loader2, className: "text-blue-600 dark:text-blue-400" },
        { label: "异常", value: overview.abnormalCount, icon: AlertCircle, className: "text-red-600 dark:text-red-400" },
        { label: "等待", value: overview.waitingCount, icon: CircleDashed, className: "text-amber-600 dark:text-amber-400" },
        { label: "停用", value: overview.disabledCount, icon: PauseCircle, className: "text-gray-500 dark:text-gray-400" },
      ]
    : []

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">脚本任务</h1>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {overview ? `服务器时间 ${formatTaskDateTime(overview.serverTime)}` : ""}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => void fetchTasks(true)}
              disabled={refreshing}
              aria-label="刷新脚本任务"
              title="刷新"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{overview ? "状态可能已过期" : "加载失败"}</AlertTitle>
            <AlertDescription className="break-words">{error}</AlertDescription>
          </Alert>
        )}

        {loading && !overview ? (
          <div className="space-y-4" aria-label="正在加载脚本任务">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : overview ? (
          <>
            <section className="grid grid-cols-2 overflow-hidden rounded-md border bg-white dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-3 xl:grid-cols-6" aria-label="任务状态汇总">
              {summaryItems.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex min-h-20 items-center gap-3 px-4 py-3",
                    index % 2 !== 0 && "border-l sm:border-l-0",
                    index >= 2 && "border-t sm:border-t-0",
                    index > 0 && "sm:border-l",
                    "dark:border-gray-700",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", item.className, item.label === "运行中" && refreshing && "animate-spin")} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{item.value}</div>
                  </div>
                </div>
              ))}
            </section>

            <div className="flex flex-wrap items-center gap-2" aria-label="任务状态筛选">
              {FILTERS.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={filter === item.key ? "default" : "outline"}
                  className="h-8"
                  onClick={() => handleFilterChange(item.key)}
                  aria-pressed={filter === item.key}
                >
                  {item.label}
                </Button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">{visibleTasks.length} 项</span>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed text-center text-muted-foreground">
                <Clock3 className="mb-3 h-7 w-7" aria-hidden="true" />
                <div className="text-sm">当前筛选下没有任务</div>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-md border bg-white dark:border-gray-700 dark:bg-gray-800 md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-36">状态</TableHead>
                        <TableHead>任务</TableHead>
                        <TableHead className="w-36">周期</TableHead>
                        <TableHead className="w-40">上次执行</TableHead>
                        <TableHead className="w-28">耗时</TableHead>
                        <TableHead className="w-40">下次执行</TableHead>
                        <TableHead className="w-12"><span className="sr-only">详情</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleTasks.map((task) => {
                        const expanded = expandedKey === task.key
                        return (
                          <Fragment key={task.key}>
                            <TableRow>
                              <TableCell><StatusBadge status={task.status} /></TableCell>
                              <TableCell className="min-w-52">
                                <div className="font-medium text-gray-900 dark:text-white">{task.name}</div>
                                <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{task.description}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">{task.scheduleText}</TableCell>
                              <TableCell className="whitespace-nowrap tabular-nums">{formatTaskDateTime(task.lastFinishedAt || task.lastStartedAt)}</TableCell>
                              <TableCell className="whitespace-nowrap tabular-nums">{formatDuration(task.lastDurationMs)}</TableCell>
                              <TableCell className="whitespace-nowrap tabular-nums">{formatTaskDateTime(task.nextRunAt)}</TableCell>
                              <TableCell className="px-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setExpandedKey(expanded ? null : task.key)}
                                  aria-label={`${expanded ? "收起" : "展开"}${task.name}`}
                                  aria-expanded={expanded}
                                >
                                  <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expanded && (
                              <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableCell colSpan={7} className="px-4 py-3"><TaskDetails task={task} /></TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="divide-y overflow-hidden rounded-md border bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800 md:hidden">
                  {visibleTasks.map((task) => {
                    const expanded = expandedKey === task.key
                    return (
                      <div key={task.key}>
                        <button
                          type="button"
                          className="w-full px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                          onClick={() => setExpandedKey(expanded ? null : task.key)}
                          aria-expanded={expanded}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="break-words font-medium text-gray-900 dark:text-white">{task.name}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{task.scheduleText}</div>
                            </div>
                            <StatusBadge status={task.status} />
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="text-muted-foreground">上次执行</div>
                              <div className="mt-1 tabular-nums text-foreground">{formatTaskDateTime(task.lastFinishedAt || task.lastStartedAt)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">下次执行</div>
                              <div className="mt-1 tabular-nums text-foreground">{formatTaskDateTime(task.nextRunAt)}</div>
                            </div>
                          </div>
                        </button>
                        {expanded && <div className="border-t bg-muted/30 px-4 py-3 dark:border-gray-700"><TaskDetails task={task} /></div>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
