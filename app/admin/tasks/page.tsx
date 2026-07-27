"use client"

import {useCallback, useEffect, useMemo, useState} from "react"
import {
  AlertTriangle,
  ArrowUp,
  Ban,
  ListChecks,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Snowflake,
  TimerReset,
  XCircle,
  Zap,
} from "lucide-react"

import {DashboardLayout} from "@/components/dashboard-layout"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {useAuth} from "@/contexts/auth-context"
import {useToast} from "@/hooks/use-toast"
import {apiRequestWithAuth, getStoredToken, isTokenValid} from "@/lib/api-config"
import {
  type BoardAccountTask,
  type CooldownTask,
  type RunningTask,
  type TaskBoardSnapshot,
  formatBoardDateTime,
  formatRunningDeviceLabel,
  getBoardRefreshInterval,
  getRunningModeLabel,
  getUrgentStatusMeta,
  shouldShowUrgentSection,
  sortRunningTasks,
} from "@/lib/task-board"

const EMPTY_SUMMARY = {
  urgent: 0,
  pending: 0,
  inProgress: 0,
  coolingDown: 0,
  frozen: 0,
}

const STATUS_CLASSES = {
  warning: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  info: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200",
  danger: "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  muted: "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300",
} as const

function UrgentStatusBadge({status}: {status: string}) {
  const meta = getUrgentStatusMeta(status)
  return <Badge variant="outline" className={STATUS_CLASSES[meta.tone]}>{meta.label}</Badge>
}

function EmptyState({label}: {label: string}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center border-y border-dashed border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
      <ListChecks className="mb-3 h-8 w-8" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

function RunningTaskMode({task}: {task: RunningTask}) {
  const label = getRunningModeLabel(task.taskMode, task.taskType)

  if (!task.urgent) {
    return <span className="whitespace-nowrap font-medium">{label}</span>
  }

  return (
    <div className="flex min-w-[140px] items-center gap-3 whitespace-nowrap">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
        aria-hidden="true"
      >
        <Zap className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <div className="font-semibold text-gray-950 dark:text-white">{label}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-300">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          最高优先级
        </div>
      </div>
    </div>
  )
}

function RunningTaskTable({
  tasks,
  busy,
  onRemove,
}: {
  tasks: RunningTask[]
  busy: boolean
  onRemove: (deviceToken: string) => void
}) {
  return (
    <Table className="min-w-[1020px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-44 min-w-44">任务模式</TableHead>
          <TableHead>账号</TableHead>
          <TableHead>设备</TableHead>
          <TableHead>最近进度</TableHead>
          <TableHead>运行时间</TableHead>
          <TableHead>租约到期</TableHead>
          <TableHead className="w-20 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow
            key={task.assignmentId}
            className={task.urgent ? "border-l-4 border-l-orange-500 bg-orange-50/45 dark:bg-orange-950/15" : ""}
          >
            <TableCell className="w-44 min-w-44">
              <RunningTaskMode task={task} />
            </TableCell>
            <TableCell>
              <div className="font-medium text-gray-950 dark:text-gray-100">{task.name}</div>
              <div className="mt-0.5 text-xs text-gray-500">ID {task.accountId} · {task.account}</div>
            </TableCell>
            <TableCell className="max-w-64 whitespace-nowrap font-mono text-xs">
              {formatRunningDeviceLabel(task.deviceName, task.deviceToken)}
            </TableCell>
            <TableCell>
              <div className="font-medium">{task.lastProgressTitle || (task.urgent ? "等待登录日志" : "等待进度")}</div>
              <div className="mt-0.5 max-w-64 truncate text-xs text-gray-500" title={task.lastProgressDetail || undefined}>
                {task.lastProgressDetail || formatBoardDateTime(task.lastProgressAt)}
              </div>
            </TableCell>
            <TableCell>
              <div>{task.runningMinutes} 分钟</div>
              <div className="mt-0.5 text-xs text-gray-500">{formatBoardDateTime(task.assignedAt)}</div>
            </TableCell>
            <TableCell>{formatBoardDateTime(task.leaseExpiresAt)}</TableCell>
            <TableCell className="text-right">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                onClick={() => onRemove(task.deviceToken)}
                disabled={busy}
                title="结束并重新排队"
                aria-label={`结束 ${task.name} 的当前任务并重新排队`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function TasksPage() {
  const {token: contextToken} = useAuth()
  const {toast} = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [board, setBoard] = useState<TaskBoardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null)

  const getToken = useCallback(() => contextToken || getStoredToken(), [contextToken])

  const fetchBoard = useCallback(async (silent = false) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return
    if (!silent) setLoading(true)
    try {
      const result = await apiRequestWithAuth<TaskBoardSnapshot>("/showTaskBoard", token, {method: "GET"})
      if (result.code !== 200) throw new Error(result.msg || "获取任务看板失败")
      setBoard(result.data)
      setStale(false)
    } catch (error) {
      setStale(true)
      if (!silent) {
        toast({
          variant: "destructive",
          title: "刷新失败",
          description: error instanceof Error ? error.message : "无法连接到服务器",
        })
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [getToken, toast])

  useEffect(() => {
    void fetchBoard(false)
  }, [fetchBoard])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(async () => {
        if (cancelled) return
        await fetchBoard(true)
        if (!cancelled) schedule()
      }, getBoardRefreshInterval(new Date()))
    }
    schedule()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fetchBoard])

  const runAction = useCallback(async (
    key: string,
    endpoint: string,
    successMessage: string,
    body?: unknown,
  ) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return false
    setActionKey(key)
    try {
      const result = await apiRequestWithAuth(endpoint, token, {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (result.code !== 200) throw new Error(result.msg || "操作失败")
      toast({variant: "success", title: "操作成功", description: successMessage})
      await fetchBoard(true)
      return true
    } catch (error) {
      toast({
        variant: "destructive",
        title: "操作失败",
        description: error instanceof Error ? error.message : "网络错误",
      })
      return false
    } finally {
      setActionKey(null)
    }
  }, [fetchBoard, getToken, toast])

  const handleStartCooldown = async (task: CooldownTask) => {
    const cleared = await runAction(`cooldown-clear-${task.id}`, "/clearAccountCooldown", `已解除 ${task.name} 的冷却`, {id: task.id})
    if (cleared) await runAction(`cooldown-start-${task.id}`, "/startAccountByAdmin", `${task.name} 已进入普通队列`, {id: task.id})
  }

  const handleUnfreeze = async (task: BoardAccountTask, start: boolean) => {
    const unfrozen = await runAction(`unfreeze-${task.id}`, "/updateAccount", `已解除 ${task.name} 的冻结`, {id: task.id, freeze: 0})
    if (unfrozen && start) await runAction(`frozen-start-${task.id}`, "/startAccountByAdmin", `${task.name} 已进入普通队列`, {id: task.id})
  }

  const summary = board?.summary || EMPTY_SUMMARY
  const urgentTasks = board?.urgentTasks || []
  const pendingTasks = board?.pendingTasks || []
  const runningTasks = useMemo(() => sortRunningTasks(board?.runningTasks || []), [board?.runningTasks])
  const urgentRunningTasks = runningTasks.filter((task) => task.urgent)
  const normalRunningTasks = runningTasks.filter((task) => !task.urgent)
  const showUrgent = shouldShowUrgentSection(urgentTasks)
  const showUrgentRunning = shouldShowUrgentSection(urgentRunningTasks)
  const busy = actionKey !== null
  const token = getToken()

  if (!token || !isTokenValid(token)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-gray-600 dark:text-gray-400">请先登录</div>
          <Button onClick={() => (window.location.href = "/")}>返回登录</Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <header className="mb-5 flex flex-col gap-3 border-b border-gray-200 pb-4 dark:border-gray-700 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950 dark:text-white">任务管理</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>更新于 {formatBoardDateTime(board?.generatedAt)}</span>
            {stale && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                状态可能已过期
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => void fetchBoard(false)}
            disabled={loading}
            title="刷新任务状态"
            aria-label="刷新任务状态"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void runAction("force-load", "/forceLoadAllTask", "已同步全部普通任务")}
            disabled={busy}
          >
            <RotateCcw className="h-4 w-4" />
            同步普通任务
          </Button>
        </div>
      </header>

      <section className="mb-5 grid grid-cols-2 border-y border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-5">
        {[
          {label: "26点加急", value: summary.urgent, icon: Zap, accent: "text-orange-600 dark:text-orange-400"},
          {label: "普通待处理", value: summary.pending, icon: ListChecks, accent: "text-gray-700 dark:text-gray-200"},
          {label: "进行中", value: summary.inProgress, icon: Play, accent: "text-sky-600 dark:text-sky-400"},
          {label: "冷却", value: summary.coolingDown, icon: TimerReset, accent: "text-amber-600 dark:text-amber-400"},
          {label: "冻结", value: summary.frozen, icon: Snowflake, accent: "text-cyan-700 dark:text-cyan-300"},
        ].map((item) => (
          <div key={item.label} className="flex min-h-20 items-center gap-3 border-b border-r border-gray-100 px-4 last:border-r-0 dark:border-gray-700 sm:border-b-0">
            <item.icon className={`h-5 w-5 ${item.accent}`} />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
              <div className="mt-0.5 text-xl font-semibold text-gray-950 dark:text-white">{item.value}</div>
            </div>
          </div>
        ))}
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-5 grid h-11 w-full grid-cols-3 rounded-md">
          <TabsTrigger value="pending">待处理 ({summary.urgent + summary.pending})</TabsTrigger>
          <TabsTrigger value="inProgress">进行中 ({summary.inProgress})</TabsTrigger>
          <TabsTrigger value="coolingDown">冷却/冻结 ({summary.coolingDown + summary.frozen})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-0">
          {loading && !board ? (
            <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div>
              {showUrgent && (
                <>
                  <section className="border-l-4 border-orange-500 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-orange-200 px-4 py-3 dark:border-orange-900/70">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <h2 className="text-sm font-semibold text-gray-950 dark:text-white">最高优先级 · 26点强制登录</h2>
                        <Badge className="bg-orange-600 text-white hover:bg-orange-600">{urgentTasks.length}</Badge>
                      </div>
                    </div>
                    <Table className="min-w-[900px]">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-16">顺位</TableHead>
                          <TableHead>账号</TableHead>
                          <TableHead>游戏日</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>尝试</TableHead>
                          <TableHead>下次重试 / 最近错误</TableHead>
                          <TableHead className="w-24 text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {urgentTasks.map((task, index) => (
                          <TableRow key={task.id} className="bg-orange-50/35 dark:bg-orange-950/10">
                            <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-950 dark:text-white">{task.name}</div>
                              <div className="mt-0.5 text-xs text-gray-500">ID {task.accountId}{task.account ? ` · ${task.account}` : ""}</div>
                            </TableCell>
                            <TableCell>{task.gameDay}</TableCell>
                            <TableCell><UrgentStatusBadge status={task.status} /></TableCell>
                            <TableCell>{task.attemptCount ?? 0} 次</TableCell>
                            <TableCell>
                              <div>{task.nextRetryAt ? formatBoardDateTime(task.nextRetryAt) : "-"}</div>
                              {task.lastError && <div className="mt-0.5 max-w-64 truncate text-xs text-red-600" title={task.lastError}>{task.lastError}</div>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {(task.status === "RETRY_WAIT" || task.status === "FAILED") && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-950/50"
                                    onClick={() => void runAction(`urgent-retry-${task.id}`, "/retryUrgentTask", `${task.name} 已立即重试`, {id: task.id})}
                                    disabled={busy}
                                    title="立即重试"
                                    aria-label={`立即重试 ${task.name}`}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                      disabled={busy}
                                      title="取消加急"
                                      aria-label={`取消 ${task.name} 的加急任务`}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>取消26点加急任务？</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {task.name} 将退出强制登录，账号仍保留在普通待处理队列。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>返回</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => void runAction(`urgent-cancel-${task.id}`, "/cancelUrgentTask", `${task.name} 已取消加急`, {id: task.id})}
                                      >
                                        取消加急
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                  <div className="my-6 border-t border-gray-300 dark:border-gray-600" />
                </>
              )}

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">普通任务</h2>
                  <span className="text-xs text-gray-500">{pendingTasks.length}</span>
                </div>
                {pendingTasks.length === 0 ? (
                  <EmptyState label="暂无普通待处理任务" />
                ) : (
                  <div className="border-y border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-16">顺位</TableHead>
                          <TableHead>账号</TableHead>
                          <TableHead>任务类型</TableHead>
                          <TableHead>队列状态</TableHead>
                          <TableHead className="w-24 text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTasks.map((task, index) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-950 dark:text-white">{task.name}</div>
                              <div className="mt-0.5 text-xs text-gray-500">ID {task.id} · {task.account}</div>
                            </TableCell>
                            <TableCell>{getRunningModeLabel("NORMAL", task.taskType)}</TableCell>
                            <TableCell>
                              {task.returnedFromUrgent ? (
                                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                                  补登完成，待执行日常
                                </Badge>
                              ) : <span className="text-gray-500">等待分配</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40"
                                  onClick={() => void runAction(`insert-${task.id}`, "/tempInsertTask", `${task.name} 已移动到普通队列首位`, {id: task.id})}
                                  disabled={busy}
                                  title="普通队列插队"
                                  aria-label={`将 ${task.name} 移到普通队列首位`}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  onClick={() => void runAction(`remove-${task.id}`, "/tempRemoveTask", `${task.name} 已移出普通队列`, {id: task.id})}
                                  disabled={busy}
                                  title="移出普通队列"
                                  aria-label={`将 ${task.name} 移出普通队列`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inProgress" className="mt-0">
          <div className="mb-3 flex items-center justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={busy || runningTasks.length === 0}>
                  <XCircle className="h-4 w-4" />
                  结束全部并重新排队
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>结束全部进行中任务？</AlertDialogTitle>
                  <AlertDialogDescription>所有当前分配都会停止并重新进入对应队列。</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>返回</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={() => void runAction("unlock-all", "/forceUnlockTaskList", "全部进行中任务已结束并重新排队")}
                  >
                    确认结束
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {runningTasks.length === 0 ? (
            <EmptyState label="暂无进行中任务" />
          ) : (
            <div>
              {showUrgentRunning && (
                <>
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <h2 className="text-sm font-semibold">加急任务</h2>
                      <Badge className="bg-orange-600 text-white hover:bg-orange-600">{urgentRunningTasks.length}</Badge>
                    </div>
                    <div className="border-y border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                      <RunningTaskTable
                        tasks={urgentRunningTasks}
                        busy={busy}
                        onRemove={(deviceToken) => void runAction(`unlock-${deviceToken}`, "/forceUnlockOneTask", "任务已结束并重新排队", {token: deviceToken})}
                      />
                    </div>
                  </section>
                  {normalRunningTasks.length > 0 && <div className="my-6 border-t border-gray-300 dark:border-gray-600" />}
                </>
              )}
              {normalRunningTasks.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-sm font-semibold">普通任务</h2>
                    <span className="text-xs text-gray-500">{normalRunningTasks.length}</span>
                  </div>
                  <div className="border-y border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <RunningTaskTable
                      tasks={normalRunningTasks}
                      busy={busy}
                      onRemove={(deviceToken) => void runAction(`unlock-${deviceToken}`, "/forceUnlockOneTask", "任务已结束并重新排队", {token: deviceToken})}
                    />
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coolingDown" className="mt-0">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <TimerReset className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold">临时冷却</h2>
              <span className="text-xs text-gray-500">{board?.cooldownTasks.length || 0}</span>
            </div>
            {!board?.cooldownTasks.length ? (
              <EmptyState label="暂无临时冷却账号" />
            ) : (
              <div className="border-y border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>账号</TableHead>
                      <TableHead>冷却到</TableHead>
                      <TableHead>原因</TableHead>
                      <TableHead className="w-32 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {board.cooldownTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.name}</div>
                          <div className="mt-0.5 text-xs text-gray-500">ID {task.id} · {task.account}</div>
                        </TableCell>
                        <TableCell>{formatBoardDateTime(task.until)}</TableCell>
                        <TableCell>
                          <div>{task.message}</div>
                          <div className="mt-0.5 text-xs text-gray-500">{task.reason}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                              onClick={() => void handleStartCooldown(task)}
                              disabled={busy}
                              title="解除冷却并进入普通队列"
                              aria-label={`解除 ${task.name} 的冷却并进入普通队列`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => void runAction(`cooldown-clear-${task.id}`, "/clearAccountCooldown", `已解除 ${task.name} 的冷却`, {id: task.id})}
                              disabled={busy}
                              title="仅解除冷却"
                              aria-label={`仅解除 ${task.name} 的冷却`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <div className="my-6 border-t border-gray-300 dark:border-gray-600" />

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              <h2 className="text-sm font-semibold">数据库冻结</h2>
              <span className="text-xs text-gray-500">{board?.frozenTasks.length || 0}</span>
            </div>
            {!board?.frozenTasks.length ? (
              <EmptyState label="暂无数据库冻结账号" />
            ) : (
              <div className="border-y border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>账号</TableHead>
                      <TableHead>任务类型</TableHead>
                      <TableHead>账号到期</TableHead>
                      <TableHead className="w-32 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {board.frozenTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.name}</div>
                          <div className="mt-0.5 text-xs text-gray-500">ID {task.id} · {task.account}</div>
                        </TableCell>
                        <TableCell>{getRunningModeLabel("NORMAL", task.taskType)}</TableCell>
                        <TableCell>{formatBoardDateTime(task.expireTime)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                              onClick={() => void handleUnfreeze(task, true)}
                              disabled={busy}
                              title="解冻并进入普通队列"
                              aria-label={`解冻 ${task.name} 并进入普通队列`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => void handleUnfreeze(task, false)}
                              disabled={busy}
                              title="仅解冻"
                              aria-label={`仅解冻 ${task.name}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
