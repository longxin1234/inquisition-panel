"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileClock,
  Lock,
  Megaphone,
  Play,
  RefreshCw,
  Server,
  Settings2,
  ShieldAlert,
  Square,
  Unlock,
  UserRound,
  WifiOff,
  Zap,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"

type ActionName = "start" | "stop" | "freeze" | null

function formatDate(value?: string) {
  if (!value) return "未设置"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN")
}

function statusTone(status?: string) {
  const normalized = String(status || "").toLowerCase()
  if (/异常|失败|error|failed/.test(normalized)) return "destructive" as const
  if (/运行|执行|进行|running|working|busy/.test(normalized)) return "default" as const
  return "secondary" as const
}

export default function UserDashboard() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [userStatus, setUserStatus] = useState<any>(null)
  const [userAccount, setUserAccount] = useState<any>(null)
  const [sanity, setSanity] = useState("")
  const [announcement, setAnnouncement] = useState<any>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<ActionName>(null)
  const [online, setOnline] = useState(true)

  const getToken = useCallback(() => contextToken || getStoredToken(), [contextToken])

  const fetchAnnouncement = useCallback(async () => {
    try {
      const result = await apiRequestWithAuth("/getAnnouncement", "", { method: "GET" })
      if (result.code === 200) setAnnouncement(result.data)
    } catch {
      // 公告不是主路径，失败时不阻断工作台。
    }
  }, [])

  const fetchUserData = useCallback(async (background = false) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      setInitialLoading(false)
      setError("登录状态已失效，请重新登录")
      return
    }

    if (background) setRefreshing(true)
    else setInitialLoading(true)

    try {
      const [statusResult, accountResult, sanityResult] = await Promise.all([
        apiRequestWithAuth("/showMyStatus", token, { method: "GET" }),
        apiRequestWithAuth("/showMyAccount", token, { method: "GET" }),
        apiRequestWithAuth("/showMySan", token, { method: "GET" }),
      ])

      const failed = [statusResult, accountResult, sanityResult].find((result) => result.code !== 200)
      if (failed) throw new Error(failed.msg || "无法读取完整账号状态")

      setUserStatus(statusResult.data)
      setUserAccount(accountResult.data)
      setSanity(String(sanityResult.data ?? ""))
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "无法连接到服务器")
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [getToken])

  useEffect(() => {
    void fetchUserData()
    void fetchAnnouncement()
  }, [fetchAnnouncement, fetchUserData])

  useEffect(() => {
    const updateOnlineState = () => setOnline(navigator.onLine)
    updateOnlineState()
    window.addEventListener("online", updateOnlineState)
    window.addEventListener("offline", updateOnlineState)
    return () => {
      window.removeEventListener("online", updateOnlineState)
      window.removeEventListener("offline", updateOnlineState)
    }
  }, [])

  const runAction = async (name: Exclude<ActionName, null>, endpoint: string, successMessage: string) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setAction(name)
    try {
      const result = await apiRequestWithAuth(endpoint, token, { method: "POST" })
      if (result.code !== 200) throw new Error(result.msg || "操作未完成")
      toast({ variant: "success", title: "操作已提交", description: successMessage })
      await fetchUserData(true)
    } catch (requestError) {
      toast({
        variant: "destructive",
        title: "操作失败",
        description: requestError instanceof Error ? requestError.message : "请稍后重试",
      })
    } finally {
      setAction(null)
    }
  }

  const statusText = String(userStatus?.status || "等待状态")
  const isRunning = useMemo(
    () => /运行|执行|进行|running|working|busy/i.test(statusText),
    [statusText],
  )
  const isFrozen = Boolean(userAccount?.freeze)
  const busy = action !== null

  if (initialLoading) {
    return (
      <DashboardLayout contentClassName="max-w-[1440px]">
        <UserDashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (error && !userAccount) {
    return (
      <DashboardLayout contentClassName="max-w-[1440px]">
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">个人工作台暂时不可用</h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => void fetchUserData()}>重新加载</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout contentClassName="max-w-[1440px]">
      <main className="space-y-5">
        {!online && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground" role="status">
            <WifiOff className="h-4 w-4 shrink-0 text-destructive" />
            当前处于离线状态。已显示最后一次读取的数据，恢复网络后请刷新。
          </div>
        )}

        {error && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground" role="status">
            <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
            <span className="min-w-0 flex-1">刷新失败，当前显示上一次数据：{error}</span>
            <Button size="sm" variant="outline" onClick={() => void fetchUserData(true)}>重试</Button>
          </div>
        )}

        <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">PERSONAL WORKSPACE</p>
              <Badge variant={isFrozen ? "destructive" : "secondary"}>{isFrozen ? "账号已冻结" : "账号可用"}</Badge>
            </div>
            <h1 className="mt-2 truncate text-3xl font-semibold tracking-[-0.04em]">{userAccount?.name || "我的工作台"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Server className="h-3.5 w-3.5" />{userAccount?.server === 0 ? "官服" : "B服"}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />有效期至 {formatDate(userAccount?.expireTime)}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchUserData(true)} disabled={refreshing} className="self-start sm:self-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "刷新中" : "刷新状态"}
          </Button>
        </header>

        {announcement && (
          <section className="grid gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)]" aria-label="公告">
            <Megaphone className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">{announcement.title || "公告"}</h2>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{announcement.context}</p>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.75fr)]">
            <div className="border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusTone(statusText)}>{statusText}</Badge>
                <span className="text-xs text-muted-foreground">任务类型：{userAccount?.taskType || "日常任务"}</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">
                {isFrozen ? "先解冻账号，再继续运行任务" : isRunning ? "任务正在执行，等待最新进度" : "当前可以开始下一轮任务"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isFrozen
                  ? "冻结期间不会进入新的调度。解冻后可立即执行，或等待系统按计划调度。"
                  : isRunning
                    ? "任务状态会在执行过程中更新。需要中止时请使用强制停止，并在运行记录中确认结果。"
                    : "开始前可先检查任务配置。提交后可在运行记录中查看执行阶段、错误和截图。"}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {!isFrozen && !isRunning && (
                  <Button size="lg" onClick={() => void runAction("start", "/startNow", "任务已进入调度队列")} disabled={busy || !online}>
                    <Play className="mr-2 h-4 w-4" />{action === "start" ? "提交中" : "立即执行"}
                  </Button>
                )}
                {!isFrozen && isRunning && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="lg" variant="destructive" disabled={busy || !online}><Square className="mr-2 h-4 w-4" />强制停止</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认强制停止当前任务？</AlertDialogTitle>
                        <AlertDialogDescription>这会中断正在执行的任务，当前步骤可能不会保存。停止后请到运行记录确认最终状态。</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>继续运行</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void runAction("stop", "/forceHalt", "已请求停止当前任务")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认停止</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button asChild size="lg" variant="outline"><Link href="/user/config"><Settings2 className="mr-2 h-4 w-4" />检查任务配置</Link></Button>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 lg:grid-cols-2">
              <StatusMetric icon={Zap} label="当前理智" value={sanity || "-"} />
              <StatusMetric icon={RefreshCw} label="剩余刷新" value={String(userAccount?.refresh ?? "-")} />
              <StatusMetric icon={Clock3} label="任务状态" value={statusText} />
              <StatusMetric icon={Activity} label="调度模式" value={userAccount?.taskType || "日常"} />
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Settings2 className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-sm font-semibold">接下来可以做什么</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">按使用频率排列的常用入口</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              <ActionRow href="/user/config" icon={Settings2} title="调整任务配置" description={`当前使用 ${userAccount?.taskType || "日常任务"}，可修改任务开关、顺序和运行参数。`} />
              <ActionRow href="/user/logs" icon={FileClock} title="查看运行记录" description="确认最近任务是否完成，查看执行阶段、错误原因和截图。" />
              <ActionRow href="/user/account" icon={UserRound} title="账号与通知" description="维护通知方式、日程和账号相关设置。" />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <UserRound className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">账号摘要</h2>
            </div>
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="游戏账号" value={userAccount?.account || "未设置"} />
              <InfoRow label="服务器" value={userAccount?.server === 0 ? "官服" : "B服"} />
              <InfoRow label="创建时间" value={formatDate(userAccount?.createTime)} />
              <InfoRow label="到期时间" value={formatDate(userAccount?.expireTime)} />
            </dl>
            <div className="border-t border-border bg-muted/35 p-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground" disabled={busy || !online}>
                    <span className="inline-flex items-center gap-2">{isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{isFrozen ? "解冻账号" : "冻结账号"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{isFrozen ? "确认解冻账号？" : "确认冻结账号？"}</AlertDialogTitle>
                    <AlertDialogDescription>{isFrozen ? "解冻后账号将重新参与调度，也可以手动立即执行。" : "冻结后不会开始新任务，正在运行的任务不会在此操作中自动停止。"}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void runAction("freeze", isFrozen ? "/unfreezeMyAccount" : "/freezeMyAccount", isFrozen ? "账号已解冻" : "账号已冻结")}>{isFrozen ? "确认解冻" : "确认冻结"}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </div>
      </main>
    </DashboardLayout>
  )
}

function StatusMetric({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="min-h-28 p-4">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <div className="mt-4 text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 line-clamp-2 font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function ActionRow({ href, icon: Icon, title, description }: { href: string; icon: typeof Settings2; title: string; description: string }) {
  return (
    <Link href={href} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 px-5 py-3.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  )
}

function UserDashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="正在加载个人工作台">
      <div className="space-y-3 border-b border-border pb-5"><Skeleton className="h-4 w-36" /><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-80 max-w-full" /></div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>
    </div>
  )
}
