"use client"

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarClock,
  Check,
  CheckCheck,
  CheckCircle2,
  Coins,
  Copy,
  Factory,
  FileClock,
  Flame,
  GripVertical,
  Hammer,
  Info,
  ListX,
  Lock,
  Mail,
  MessageSquare,
  PackageSearch,
  Plus,
  RefreshCw,
  RotateCw,
  Save,
  Server,
  Settings2,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Square,
  Store,
  TicketCheck,
  Trash2,
  Unlock,
  Users,
  WifiOff,
  Wrench,
  Zap,
} from "lucide-react"
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

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
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { EndfieldScriptAdvanced, type SettingsPanel } from "@/components/endfield-script-advanced"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"
import { isDemoToken } from "@/lib/demo-mode"
import {
  SCRIPT_TASKS,
  createScriptConfig,
  scriptConfigToAccountConfig,
  summarizeScriptTasks,
  SCRIPT_SCHEMA_VERSION,
  STAMINA_TYPES,
  STAMINA_LEVELS,
  STAMINA_CARD_LIMIT,
  type EndfieldScriptConfig,
} from "@/lib/endfield-script-config"

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

const TASK_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  credit_shopping: ShoppingBag, visit_friends: Users, simple_crafting: Hammer,
  gear_assembly: Wrench, mail_claim: Mail, daily_tasks: CheckCircle2,
  protocol_pass: TicketCheck, event_signin: CheckCircle2, skland_signin: CheckCircle2,
  depot_claim: Store, material_dispatch: PackageSearch, outpost_trade: Store,
  stamina_clear: Zap, voucher_spend: TicketCheck, stable_stockpile: Store, shift_rotation: Factory,
}

const STAMINA_TYPE_THEMES: Record<string, { bg: string; text: string; border: string; icon: ComponentType<{ className?: string }> }> = {
  "钱币收集": { bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/25 dark:border-amber-500/30", icon: Coins },
  "干员经验": { bg: "bg-sky-500/10 dark:bg-sky-500/15", text: "text-sky-700 dark:text-sky-300", border: "border-sky-500/25 dark:border-sky-500/30", icon: Zap },
  "干员进阶": { bg: "bg-indigo-500/10 dark:bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-500/25 dark:border-indigo-500/30", icon: Sparkles },
  "技能提升": { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/25 dark:border-emerald-500/30", icon: BookOpen },
  "武器经验": { bg: "bg-cyan-500/10 dark:bg-cyan-500/15", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-500/25 dark:border-cyan-500/30", icon: Wrench },
  "武器进阶": { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-300", border: "border-blue-500/25 dark:border-blue-500/30", icon: ShieldAlert },
  "危境预演": { bg: "bg-purple-500/10 dark:bg-purple-500/15", text: "text-purple-700 dark:text-purple-300", border: "border-purple-500/25 dark:border-purple-500/30", icon: Flame },
  "能量淤积点": { bg: "bg-rose-500/10 dark:bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/25 dark:border-rose-500/30", icon: Flame },
}

const ADVANCED_SECTIONS: Array<{ value: string; title: string; description: string; panel: SettingsPanel }> = [
  { value: "depot", title: "仓储", description: "脚本仓储页：地区、装箱、仓储地点与装箱物品", panel: "depot" },
  { value: "credit", title: "信用", description: "脚本信用页：四轮刷新成本与保留信用", panel: "credit" },
  { value: "login", title: "上号", description: "脚本上号页：每周执行日", panel: "login" },
  { value: "base", title: "基建", description: "脚本基建页：培养舱种子与帝江号线索", panel: "base" },
  { value: "outpost", title: "据点交易", description: "脚本据点交易页：策略、优先货品与物品保留", panel: "outpost" },
  { value: "sell", title: "售卖", description: "脚本售卖页：地区、出售价格与券溢出", panel: "sell" },
  { value: "voucher", title: "购买弹性物资", description: "脚本弹性购买页：执行周期、地区与阈值", panel: "voucher" },
  { value: "stable", title: "购买稳定物资", description: "脚本稳定购买页：地区目录、上限与折扣", panel: "stable" },
]

function UserDashboardContent() {
  const { userType, token: contextToken } = useAuth()
  const { toast } = useToast()
  const [userStatus, setUserStatus] = useState<any>(null)
  const [userAccount, setUserAccount] = useState<any>(null)
  const [sanity, setSanity] = useState("")
  const [script, setScript] = useState<EndfieldScriptConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState("")
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<ActionName>(null)
  const [online, setOnline] = useState(true)
  const [copied, setCopied] = useState(false)
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false)
  const [stopDialogOpen, setStopDialogOpen] = useState(false)

  const getToken = useCallback(() => contextToken || getStoredToken(), [contextToken])

  const fetchUserData = useCallback(async (background = false) => {
    if (userType === "admin") {
      setInitialLoading(false)
      return
    }

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
      const nextScript = createScriptConfig((accountResult.data as any)?.config)
      setScript(nextScript)
      setSavedSnapshot(JSON.stringify(nextScript))
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "无法连接到服务器")
    } finally {
      setInitialLoading(false)
    }
  }, [getToken, userType])

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

  const summary = useMemo(
    () => (script ? summarizeScriptTasks(script.selection) : { enabled: 0, total: SCRIPT_TASKS.length }),
    [script],
  )
  const dirty = useMemo(
    () => Boolean(script) && JSON.stringify(script) !== savedSnapshot,
    [savedSnapshot, script],
  )

  const updateTask = (id: string, enabled: boolean) =>
    setScript((current) => (current ? { ...current, selection: { ...current.selection, [id]: enabled } } : current))

  const setAllTasks = (enabled: boolean) =>
    setScript((current) =>
      current ? { ...current, selection: Object.fromEntries(SCRIPT_TASKS.map((task) => [task.id, enabled])) } : current,
    )

  const saveConfig = async () => {
    const token = getToken()
    if (!token || !userAccount || !script) return
    setSaving(true)
    try {
      const config = scriptConfigToAccountConfig(userAccount.config, script)
      const result = await apiRequestWithAuth("/updateMyAccount", token, {
        method: "POST",
        body: JSON.stringify({ config, active: userAccount.active ?? 1 }),
        headers: { "Content-Type": "application/json" },
      })
      if (result.code !== 200) throw new Error(result.msg || "保存失败")
      let savedAccount = { ...userAccount, config }
      let savedScript = createScriptConfig(config)
      if (!isDemoToken(token)) {
        const verification = await apiRequestWithAuth("/showMyAccount", token, { method: "GET" })
        if (verification.code !== 200) throw new Error(verification.msg || "保存后校验失败")
        savedAccount = verification.data as any
        savedScript = createScriptConfig(savedAccount?.config)
        if (JSON.stringify(savedScript) !== JSON.stringify(createScriptConfig(config))) {
          throw new Error("后端未完整保存任务配置，请稍后重试")
        }
      }
      setUserAccount(savedAccount)
      setScript(savedScript)
      setSavedSnapshot(JSON.stringify(savedScript))
      toast({ variant: "success", title: "已保存", description: `${summary.enabled} 项任务已同步` })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: err instanceof Error ? err.message : "网络错误",
      })
    } finally {
      setSaving(false)
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

  if (userType === "admin") {
    return (
      <DashboardLayout contentClassName="max-w-[1440px]">
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">当前已登录管理员账号</h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              用户端用于管理普通玩家的游戏账号与任务配置。您可以直接返回管理工作台，或切换登录普通用户。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/admin/dashboard">返回管理工作台</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">切换登录账号</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (initialLoading) {
    return (
      <DashboardLayout contentClassName="max-w-[1440px]">
        <UserDashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (error && !userAccount) {
    const isAuthExpired = error.includes("登录已过期") || error.includes("未授权") || error.includes("401")
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
          <div className="flex gap-2">
            {isAuthExpired && (
              <Button onClick={() => (window.location.href = "/")}>返回登录</Button>
            )}
            <Button variant={isAuthExpired ? "outline" : "default"} onClick={() => void fetchUserData()}>
              重新加载
            </Button>
          </div>
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

        <section className="tc-card overflow-hidden" aria-labelledby="account-info-title">
          <span className="tc-wave-bg" aria-hidden="true" />
          <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 sm:px-6">
            <h2 id="account-info-title" className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">
              账号信息
            </h2>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" aria-label="提示说明">
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">账号与任务实时数据，刷新页面自动更新</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <dl className="relative z-10 py-1">
            <InfoRow
              label="游戏账号"
              value={accountNumber || "未设置"}
              suffix={userAccount?.server === 0 ? "官服" : "B服"}
              action={
                accountNumber ? (
                  <button
                    type="button"
                    onClick={() => void copyAccount()}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    title={copied ? "已复制" : "复制游戏账号"}
                    aria-label="复制游戏账号"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                ) : undefined
              }
            />
            <InfoRow label="当前理智" value={sanity || "未同步"} valueClassName="text-emerald-600 dark:text-emerald-400 font-medium" />
            <InfoRow
              label="任务状态"
              value={statusText}
              valueClassName={isRunning ? "text-blue-600 dark:text-blue-400" : statusTone(statusText) === "destructive" ? "text-rose-600" : undefined}
            />
            <InfoRow label="下次上号" value={nextRunLabel} valueClassName="text-blue-600 dark:text-blue-400" />
            <InfoRow dashed label="到期时间" value={formatDate(userAccount?.expireTime)} valueClassName={isExpired ? "text-rose-600" : undefined} />
            <InfoRow label="任务类型" value={taskTypeLabel(userAccount?.taskType)} />
            <InfoRow label="立刻作战次数" value={String(userAccount?.refresh ?? "-")} valueClassName="text-blue-600 dark:text-blue-400 font-medium" />
          </dl>
          <div className="relative z-10 flex items-center justify-between border-t border-[#f2f3f5] bg-white px-5 py-2.5 dark:border-slate-800/80 dark:bg-[#1a1d2d] sm:px-6">
            <div className="flex items-center text-[13px]">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={() => void runAction("start", "/startNow", "任务已进入调度队列")}
                  disabled={busy || !online || isFrozen}
                  className="font-normal text-slate-800 transition-colors hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-200 dark:hover:text-blue-400"
                >
                  {action === "start" ? "提交中..." : "立即执行"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStopDialogOpen(true)}
                  disabled={busy || !online}
                  className="font-medium text-rose-600 transition-colors hover:text-rose-700 disabled:opacity-50"
                >
                  强制停止
                </button>
              )}
              <span className="mx-2.5 select-none text-[#e5e6eb] dark:text-slate-700">|</span>
              <Link href="/user/logs" className="font-normal text-slate-800 transition-colors hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400">
                任务日志
              </Link>
              <span className="mx-2.5 select-none text-[#e5e6eb] dark:text-slate-700">|</span>
              <div
                className="inline-flex cursor-pointer items-center gap-2 select-none"
                onClick={() => {
                  if (isFrozen) {
                    void runAction("freeze", "/unfreezeMyAccount", "账号已解冻")
                  } else {
                    setFreezeDialogOpen(true)
                  }
                }}
              >
                <span className="font-normal text-slate-800 transition-colors hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400">
                  冻结账户
                </span>
                <Switch
                  checked={isFrozen}
                  disabled={busy || !online}
                  className="pointer-events-none h-5 w-9 data-[state=checked]:bg-[#0052d9] [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
                />
              </div>
            </div>
          </div>
        </section>

        <TaskConfigurationSection
          script={script}
          saving={saving}
          dirty={dirty}
          summary={summary}
          updateTask={updateTask}
          setAllTasks={setAllTasks}
          setScript={setScript}
          saveConfig={saveConfig}
        />

        <AlertDialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认冻结账号？</AlertDialogTitle>
              <AlertDialogDescription>冻结后不会开始新任务，正在运行的任务不会在此操作中自动停止。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => void runAction("freeze", "/freezeMyAccount", "账号已冻结")}>
                确认冻结
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认强制停止当前任务？</AlertDialogTitle>
              <AlertDialogDescription>这会中断正在执行的任务，当前步骤可能不会保存。停止后请到运行记录确认最终状态。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>继续运行</AlertDialogCancel>
              <AlertDialogAction onClick={() => void runAction("stop", "/forceHalt", "已请求停止当前任务")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                确认停止
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </DashboardLayout>
  )
}

class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[UserDashboard Render Error Caught]:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <DashboardLayout contentClassName="max-w-[1440px]">
          <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">个人工作台加载异常</h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                检测到页面渲染异常，已启动自动熔断保护。您可以重试或重新登录。
              </p>
              {this.state.error?.message && (
                <div className="mt-3 max-w-md mx-auto rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive font-mono break-all text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => this.setState({ hasError: false, error: null })}>
                重新尝试
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                返回登录
              </Button>
            </div>
          </div>
        </DashboardLayout>
      )
    }
    return this.props.children
  }
}

export default function UserDashboard() {
  return (
    <DashboardErrorBoundary>
      <UserDashboardContent />
    </DashboardErrorBoundary>
  )
}

function InfoRow({ label, value, valueClassName, action, suffix, dashed = false }: { label: string; value: string; valueClassName?: string; action?: ReactNode; suffix?: string; dashed?: boolean }) {
  return (
    <div className="flex items-center text-[13px] leading-5 px-5 sm:px-6 py-1">
      <dt className="w-[5.75rem] shrink-0 text-slate-500 dark:text-slate-400 font-normal">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1.5 text-left font-normal text-slate-800 dark:text-slate-100">
        <span className={`min-w-0 truncate tabular-nums text-slate-800 dark:text-slate-100 ${dashed ? "dashed-underline" : ""} ${valueClassName || ""}`}>{value}</span>
        {suffix && <span className="shrink-0 text-xs text-slate-400 dark:text-slate-400">{suffix}</span>}
        {action}
      </dd>
    </div>
  )
}

function UserDashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="正在加载个人工作台">
      <Skeleton className="h-[21rem] w-full rounded-2xl" />
      <Skeleton className="h-[24rem] w-full rounded-2xl" />
    </div>
  )
}

function SortableStaminaRow({
  id,
  item,
  index,
  isExpanded,
  saving,
  totalItems,
  onToggleExpand,
  onMove,
  onRemove,
  children,
}: {
  id: string
  item: any
  index: number
  isExpanded: boolean
  saving: boolean
  totalItems: number
  onToggleExpand: () => void
  onMove: (dir: -1 | 1, e: React.MouseEvent) => void
  onRemove: (e: React.MouseEvent) => void
  children: ReactNode
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const type = item.stage_type || item.stage_name || "未知"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "rounded-xl",
        isDragging && "z-20 shadow-md ring-2 ring-sky-400 opacity-90",
        isExpanded
          ? "border-2 border-yellow-400 bg-amber-50/15 dark:border-yellow-500 dark:bg-amber-950/20 p-3.5 shadow-sm"
          : "border border-border bg-card px-3 py-2.5 shadow-2xs hover:border-sky-200 dark:hover:border-sky-800"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label="拖动排序"
            className="flex h-7 w-7 shrink-0 touch-none cursor-grab active:cursor-grabbing items-center justify-center rounded-md border border-dashed border-border/80 text-muted-foreground transition hover:bg-muted hover:text-sky-600"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
            onClick={onToggleExpand}
          >
            <span className="inline-flex items-center shrink-0 rounded-md px-2 py-0.5 text-xs font-medium border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300">
              <span>{type}</span>
            </span>
            <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${item.stage_level ? "text-slate-900 dark:text-slate-100" : "text-muted-foreground"}`}>
              {item.stage_level || "未选择"}
            </span>
            <span className="text-xs text-slate-400 font-normal shrink-0">
              ×{item.max_runs ?? 99}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 text-slate-400">
          <button
            type="button"
            onClick={(e) => onMove(-1, e)}
            disabled={index === 0 || saving}
            className="p-1 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="上移"
            aria-label="上移"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => onMove(1, e)}
            disabled={index === totalItems - 1 || saving}
            className="p-1 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="下移"
            aria-label="下移"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={saving}
            className="p-1 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            title="删除"
            aria-label="删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

function StaminaConfigCard({
  script,
  saving,
  setScript,
}: {
  script: EndfieldScriptConfig
  saving: boolean
  setScript: React.Dispatch<React.SetStateAction<EndfieldScriptConfig | null>>
}) {
  const staminaClear = script.advancedConfig?.stamina_clear || {}
  const itemKeyMap = useRef(new WeakMap<object, string>())
  const idCounter = useRef(1)

  const getStableId = useCallback((item: any, fallbackIdx: number) => {
    if (item && typeof item === "object") {
      if (item.id) return String(item.id)
      let existing = itemKeyMap.current.get(item)
      if (!existing) {
        existing = `stamina-card-${fallbackIdx + 1}-${idCounter.current++}`
        itemKeyMap.current.set(item, existing)
      }
      return existing
    }
    return `stamina-card-${fallbackIdx + 1}`
  }, [])

  const rawItems: any[] = Array.isArray(staminaClear.stage_items) ? staminaClear.stage_items : []
  const stageItems = useMemo(() => {
    return rawItems.map((item, idx) => ({
      ...item,
      id: getStableId(item, idx),
    }))
  }, [rawItems, getStableId])

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const fromIndex = stageItems.findIndex((item) => item.id === active.id)
    const toIndex = stageItems.findIndex((item) => item.id === over.id)
    if (fromIndex < 0 || toIndex < 0) return
    const next = arrayMove(stageItems, fromIndex, toIndex)
    updateStaminaItems(next.map((item, idx) => ({ ...item, order: idx + 1 })))
  }

  const updateStaminaItems = (nextItems: any[]) => {
    setScript((current) => {
      if (!current) return current
      const advanced = { ...current.advancedConfig }
      const stamina = {
        ...(advanced.stamina_clear || {}),
        stage_items: nextItems,
        entries: nextItems,
        stage_name: nextItems[0]?.stage_name || null,
      }
      return { ...current, advancedConfig: { ...advanced, stamina_clear: stamina } }
    })
  }

  const updateItem = (index: number, patch: Record<string, any>) => {
    const next = stageItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    updateStaminaItems(next)
  }

  const moveCard = (index: number, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = index + direction
    if (target < 0 || target >= stageItems.length) return
    const reordered = arrayMove(stageItems, index, target)
    updateStaminaItems(reordered.map((item, idx) => ({ ...item, order: idx + 1 })))
  }

  const removeCard = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const removed = stageItems[index]
    const remaining = stageItems.filter((_, idx) => idx !== index)
    updateStaminaItems(remaining.map((item, idx) => ({ ...item, order: idx + 1 })))
    if (removed && expandedId === removed.id) setExpandedId(null)
  }

  const handleAddNew = () => {
    const id = `stamina-card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const newCard = {
      id,
      stage_type: "干员经验",
      stage_name: "干员经验",
      stage_level: null,
      max_runs: 99,
      enabled: true,
      order: stageItems.length + 1,
    }
    const next = [...stageItems, newCard]
    updateStaminaItems(next)
    setExpandedId(id)
  }

  return (
    <section id="stamina-config" className="overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="stamina-selection-title">
      <div className="flex items-center justify-between mb-3.5">
        <h2 id="stamina-selection-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">体力清理配置</h2>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stageItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {stageItems.map((item, index) => {
              const type = item.stage_type || item.stage_name || "未知"
              const isExpanded = expandedId === item.id
              return (
                <SortableStaminaRow
                  key={item.id}
                  id={item.id}
                  item={item}
                  index={index}
                  isExpanded={isExpanded}
                  saving={saving}
                  totalItems={stageItems.length}
                  onToggleExpand={() => setExpandedId(isExpanded ? null : item.id)}
                  onMove={(dir, e) => moveCard(index, dir, e)}
                  onRemove={(e) => removeCard(index, e)}
                >
            {isExpanded && (
              <div className="mt-3.5 space-y-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-3">
                  <span className="w-10 text-xs sm:text-sm text-slate-500 dark:text-slate-400 shrink-0">类型</span>
                  <select
                    value={type}
                    onChange={(e) => updateItem(index, { stage_type: e.target.value, stage_name: e.target.value, stage_level: null })}
                    className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                  >
                    {STAMINA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-xs sm:text-sm text-slate-500 dark:text-slate-400 shrink-0">关卡</span>
                  <select
                    value={item.stage_level || ""}
                    onChange={(e) => updateItem(index, { stage_level: e.target.value || null })}
                    className={`flex-1 h-9 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-400 ${!item.stage_level ? "text-muted-foreground" : ""}`}
                  >
                    <option value="">选择关卡</option>
                    {(STAMINA_LEVELS[type] || []).map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-xs sm:text-sm text-slate-500 dark:text-slate-400 shrink-0">次数</span>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={item.max_runs ?? 99}
                    onChange={(e) => updateItem(index, { max_runs: Number(e.target.value) || 1 })}
                    className="w-24 h-9 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}
                </SortableStaminaRow>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
      <div className="pt-3 text-center">
        <button
          type="button"
          onClick={handleAddNew}
          disabled={saving || stageItems.length >= STAMINA_CARD_LIMIT}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>添加配置项</span>
        </button>
      </div>
    </section>
  )
}


function TaskConfigurationSection({
  script,
  saving,
  dirty,
  summary,
  updateTask,
  setAllTasks,
  setScript,
  saveConfig,
}: {
  script: EndfieldScriptConfig | null
  saving: boolean
  dirty: boolean
  summary: { enabled: number; total: number }
  updateTask: (id: string, enabled: boolean) => void
  setAllTasks: (enabled: boolean) => void
  setScript: React.Dispatch<React.SetStateAction<EndfieldScriptConfig | null>>
  saveConfig: () => Promise<void>
}) {
  if (!script) return null

  return (
    <div className="space-y-4 pt-1">
      <section id="task-config" className="overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="task-selection-title">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <h2 id="task-selection-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">终末地任务配置</h2>
            {dirty && <Badge className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200 text-xs">未保存</Badge>}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setAllTasks(true)} disabled={saving} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">全选</button>
            <button type="button" onClick={() => setAllTasks(false)} disabled={saving} className="text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">取消</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-2 sm:gap-x-6 gap-y-3.5 sm:gap-y-4">
          {SCRIPT_TASKS.map((task) => {
            const enabled = Boolean(script.selection[task.id])
            return (
              <div
                key={task.id}
                onClick={() => !saving && updateTask(task.id, !enabled)}
                role="checkbox"
                aria-checked={enabled}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault()
                    if (!saving) updateTask(task.id, !enabled)
                  }
                }}
                className="group flex items-center gap-2.5 cursor-pointer select-none py-1 transition-opacity hover:opacity-80 min-w-0"
              >
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    enabled
                      ? "bg-blue-600 text-white"
                      : "border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500"
                  }`}
                >
                  {enabled && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {task.label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <StaminaConfigCard script={script} saving={saving} setScript={setScript} />

      <AccordionPrimitive.Root type="multiple" defaultValue={["depot"]} className="space-y-3">
        {ADVANCED_SECTIONS.map((section) => (
          <AccordionItem key={section.value} value={section.value} className="overflow-hidden rounded-2xl border border-border bg-card px-5 data-[state=open]:border-sky-200 dark:data-[state=open]:border-sky-900">
            <AccordionTrigger className="py-4 hover:no-underline"><span className="flex min-w-0 items-center gap-3 text-left"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200"><Settings2 className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{section.title}</span><span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{section.description}</span></span></span></AccordionTrigger>
            <AccordionContent className="border-t border-border pt-4"><EndfieldScriptAdvanced panel={section.panel} value={script.advancedConfig} onChange={(advancedConfig) => setScript((current) => current ? ({ ...current, advancedConfig }) : current)} /></AccordionContent>
          </AccordionItem>
        ))}
      </AccordionPrimitive.Root>

      <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm dark:border-sky-900 dark:bg-sky-950/25">
        <span className="text-sky-800 dark:text-sky-200">修改后记得保存，新的任务队列会在下一次调度时生效。</span>
        <Button size="sm" onClick={saveConfig} disabled={saving || !dirty} className="bg-sky-600 text-white hover:bg-sky-700"><Save className="mr-1.5 h-4 w-4" />保存配置</Button>
      </div>
    </div>
  )
}
