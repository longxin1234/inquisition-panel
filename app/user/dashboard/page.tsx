"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  CalendarClock,
  Copy,
  FileClock,
  Info,
  Lock,
  MessageSquare,
  Server,
  Settings2,
  ShieldAlert,
  Square,
  Unlock,
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

function formatDateTime(value?: string) {
  if (!value) return "等待调度"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function taskTypeLabel(value?: string) {
  const labels: Record<string, string> = {
    daily: "日常任务",
    rogue: "肉鸽任务",
    rogue2: "肉鸽任务",
    sand_fire: "生息演算",
  }
  return labels[value || ""] || value || "日常任务"
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
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<ActionName>(null)
  const [online, setOnline] = useState(true)
  const [copied, setCopied] = useState(false)

  const getToken = useCallback(() => contextToken || getStoredToken(), [contextToken])

  const fetchUserData = useCallback(async (background = false) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      setInitialLoading(false)
      setError("登录状态已失效，请重新登录")
      return
    }

    if (!background) setInitialLoading(true)

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
    }
  }, [getToken])

  useEffect(() => {
    void fetchUserData()
  }, [fetchUserData])

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
  const accountNumber = String(userAccount?.account || "")
  const isExpired = Boolean(userAccount?.expireTime && new Date(userAccount.expireTime).getTime() < Date.now())
  const nextRun = userStatus?.nextRunAt || userStatus?.nextLoginAt || userStatus?.scheduledAt
  const nextRunLabel = nextRun ? formatDateTime(nextRun) : userStatus?.detail || "等待调度"

  const copyAccount = async () => {
    if (!accountNumber) return
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      toast({ variant: "success", title: "已复制游戏账号" })
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast({ variant: "destructive", title: "复制失败", description: "请手动选择并复制账号" })
    }
  }

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
      <main className="mx-auto max-w-3xl space-y-4 pb-6">
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

        <header className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.14em] text-sky-700 dark:text-sky-300">个人工作台</p>
              <Badge variant={isFrozen || isExpired ? "destructive" : "secondary"} className={!isFrozen && !isExpired ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200" : undefined}>
                {isFrozen ? "账号已冻结" : isExpired ? "账号已到期" : "账号可用"}
              </Badge>
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{userAccount?.gameName || userAccount?.name || "我的工作台"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Server className="h-3.5 w-3.5" />{userAccount?.server === 0 ? "官服" : "B服"}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />有效期至 {formatDate(userAccount?.expireTime)}</span>
            </div>
          </div>
          <div className="grid min-w-[15rem] grid-cols-2 gap-x-5 gap-y-2 border-l-2 border-sky-200 pl-4 text-left text-xs dark:border-sky-800 sm:self-auto">
            <div>
              <p className="text-muted-foreground">有效期至</p>
              <p className={`mt-0.5 font-semibold ${isExpired ? "text-destructive" : "text-foreground"}`}>{formatDate(userAccount?.expireTime)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">剩余刷新</p>
              <p className="mt-0.5 font-semibold text-sky-700 dark:text-sky-300">{String(userAccount?.refresh ?? "-")} 次</p>
            </div>
            <div>
              <p className="text-muted-foreground">下次上号</p>
              <p className="mt-0.5 font-semibold text-foreground">{nextRunLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">账号限制</p>
              <p className={`mt-0.5 font-semibold ${isFrozen || isExpired ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>{isFrozen ? "已冻结" : isExpired ? "已到期" : "正常"}</p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-sky-200 bg-sky-600 text-white shadow-sm dark:border-sky-800 dark:bg-sky-800" aria-labelledby="quick-actions-title">
          <div className="px-4 pb-2 pt-4 sm:px-5">
            <h2 id="quick-actions-title" className="text-sm font-semibold">快速操作</h2>
            <p className="mt-1 text-xs text-sky-100">常用动作都放在这里，执行结果会在运行记录中保留。</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-sky-500/70 sm:grid-cols-4 sm:divide-y-0">
            {!isFrozen && !isRunning ? (
              <QuickActionButton icon={Zap} label={action === "start" ? "提交中" : "立即执行"} onClick={() => void runAction("start", "/startNow", "任务已进入调度队列")} disabled={busy || !online} />
            ) : !isFrozen && isRunning ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <QuickActionButton icon={Square} label="强制停止" disabled={busy || !online} danger />
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
            ) : (
              <QuickActionButton icon={Unlock} label="账号已冻结" disabled />
            )}
            <QuickActionLink href="/user/logs" icon={FileClock} label="任务日志" />
            <QuickActionLink href="/user/config" icon={Settings2} label="任务配置" />
            <QuickActionLink href="/user/feedback" icon={MessageSquare} label="工单反馈" />
          </div>
        </section>

        <section className="surface-lift-3d overflow-hidden rounded-[1.25rem]" aria-labelledby="account-info-title">
          <span className="halftone-wave" aria-hidden="true" />
          <div className="relative z-10 flex items-start gap-3 px-4 pb-1 pt-5 sm:px-6">
            <div>
              <h2 id="account-info-title" className="text-lg font-semibold tracking-[-0.01em]">账号信息</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">当前账号的实时状态与任务安排</p>
            </div>
            <span title="账号实时数据，刷新页面自动更新" className="ml-auto mt-1 shrink-0 text-slate-500/80 dark:text-slate-400/80"><Info className="h-4 w-4" aria-hidden="true" /></span>
          </div>
          <dl className="relative z-10 pb-3 text-sm">
            <InfoRow label="游戏账号" value={accountNumber || "未设置"} action={accountNumber ? <button type="button" className={`press-raised grid h-8 w-8 shrink-0 place-items-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${copied ? "text-sky-600 dark:text-sky-400" : "text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"}`} onClick={() => void copyAccount()} aria-label="复制游戏账号" title={copied ? "已复制" : "复制游戏账号"}><Copy className="h-4 w-4" /></button> : undefined} suffix={userAccount?.server === 0 ? "官服" : "B服"} />
            <InfoRow label="当前理智" value={sanity || "未同步"} valueClassName="text-emerald-600 dark:text-emerald-400" />
            <InfoRow label="任务状态" value={statusText} valueClassName={isRunning ? "text-sky-600 dark:text-sky-400" : statusTone(statusText) === "destructive" ? "text-destructive" : undefined} />
            <InfoRow label="预计下次上号" value={nextRunLabel} valueClassName="text-sky-600 dark:text-sky-400" />
            <InfoRow dashed label="到期时间" value={formatDate(userAccount?.expireTime)} valueClassName={isExpired ? "text-destructive" : undefined} />
            <InfoRow label="任务类型" value={taskTypeLabel(userAccount?.taskType)} />
            <InfoRow label="剩余刷新" value={String(userAccount?.refresh ?? "-")} valueClassName="text-sky-600 dark:text-sky-400" />
          </dl>
        </section>

        <section className="overflow-hidden rounded-2xl border border-destructive/70 bg-card" aria-label="冻结账号">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="h-12 w-full justify-center gap-2 rounded-none text-destructive hover:bg-destructive/5 hover:text-destructive" disabled={busy || !online}>
                {isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {isFrozen ? "解冻账号" : "冻结账号"}
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
        </section>
      </main>
    </DashboardLayout>
  )
}

function QuickActionButton({ icon: Icon, label, onClick, disabled, danger = false }: { icon: typeof Zap; label: string; onClick?: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`group flex min-h-[5.75rem] flex-col items-center justify-center gap-2 px-3 py-3 text-center transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-55 ${danger ? "text-rose-50" : "text-white"}`}>
      <span className={`grid h-10 w-10 place-items-center rounded-xl shadow-sm transition-transform group-hover:-translate-y-0.5 ${danger ? "bg-rose-500/80" : "bg-sky-800/45"}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}

function QuickActionLink({ href, icon: Icon, label }: { href: string; icon: typeof Settings2; label: string }) {
  return <Link href={href} className="group flex min-h-[5.75rem] flex-col items-center justify-center gap-2 px-3 py-3 text-center text-white transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-800/45 shadow-sm transition-transform group-hover:-translate-y-0.5"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="text-xs font-semibold">{label}</span></Link>
}

function InfoRow({ label, value, valueClassName, action, suffix, dashed = false }: { label: string; value: string; valueClassName?: string; action?: ReactNode; suffix?: string; dashed?: boolean }) {
  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:px-6">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-left font-medium">
        <span className={`min-w-0 truncate tabular-nums ${dashed ? "dashed-underline" : ""} ${valueClassName || ""}`}>{value}</span>
        {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
        {action}
      </dd>
    </div>
  )
}

function UserDashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="正在加载个人工作台">
      <div className="space-y-3 border-b border-border pb-5"><Skeleton className="h-4 w-36" /><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-80 max-w-full" /></div>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-[27rem] w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  )
}
