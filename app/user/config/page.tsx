"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import {
  BatteryCharging, CalendarCheck, CheckCircle2, Factory, Hammer, Mail,
  PackageSearch, RefreshCw, Save, ShoppingBag, Store, TicketCheck, Users, Wrench,
} from "lucide-react"
import { EndfieldScriptAdvanced, type SettingsPanel } from "@/components/endfield-script-advanced"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"
import {
  SCRIPT_TASKS, createScriptConfig, scriptConfigToAccountConfig,
  summarizeScriptTasks, SCRIPT_SCHEMA_VERSION, type EndfieldScriptConfig, type ScriptTaskGroup,
} from "@/lib/endfield-script-config"
import { serverLabel } from "@/lib/user-config"
import { useToast } from "@/hooks/use-toast"

const GROUPS: Array<{ id: ScriptTaskGroup; label: string }> = [
  { id: "routine", label: "日常" }, { id: "operations", label: "经营" },
  { id: "resources", label: "资源" }, { id: "base", label: "基建" },
]
const SETTINGS: Array<{ id: SettingsPanel; label: string }> = [
  { id: "operations", label: "经营" }, { id: "resources", label: "资源" },
  { id: "base", label: "基建" }, { id: "system", label: "定时" },
]
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  credit_shopping: ShoppingBag, visit_friends: Users, simple_crafting: Hammer,
  gear_assembly: Wrench, mail_claim: Mail, daily_tasks: CheckCircle2,
  protocol_pass: TicketCheck, event_signin: CalendarCheck, skland_signin: CalendarCheck,
  depot_claim: Store, material_dispatch: PackageSearch, outpost_trade: Store,
  stamina_clear: BatteryCharging, voucher_spend: TicketCheck, shift_rotation: Factory,
}

export default function UserConfigPage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const token = contextToken || getStoredToken()
  const [account, setAccount] = useState<any>(null)
  const [script, setScript] = useState<EndfieldScriptConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState("")
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !isTokenValid(token)) { setLoading(false); return }
    apiRequestWithAuth("/showMyAccount", token, { method: "GET" })
      .then((result) => {
        if (result.code !== 200) throw new Error(result.msg || "加载失败")
        const nextScript = createScriptConfig((result.data as any)?.config)
        setAccount(result.data)
        setScript(nextScript)
        setSavedSnapshot(JSON.stringify(nextScript))
        setLoadError(null)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "无法获取任务配置"
        setLoadError(message)
        toast({ variant: "destructive", title: "加载失败", description: message })
      })
      .finally(() => setLoading(false))
  }, [token, toast])

  const summary = useMemo(() => script ? summarizeScriptTasks(script.selection) : { enabled: 0, total: SCRIPT_TASKS.length }, [script])
  const dirty = useMemo(() => Boolean(script) && JSON.stringify(script) !== savedSnapshot, [savedSnapshot, script])
  const updateTask = (id: string, enabled: boolean) => setScript((current) => current ? ({ ...current, selection: { ...current.selection, [id]: enabled } }) : current)

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", guard)
    return () => window.removeEventListener("beforeunload", guard)
  }, [dirty])

  const save = async () => {
    if (!token || !account || !script) return
    setSaving(true)
    try {
      const config = scriptConfigToAccountConfig(account.config, script)
      const result = await apiRequestWithAuth("/updateMyAccount", token, {
        method: "POST", body: JSON.stringify({ config, active: account.active }),
      })
      if (result.code !== 200) throw new Error(result.msg || "保存失败")
      setAccount((current: any) => ({ ...current, config }))
      setSavedSnapshot(JSON.stringify(script))
      toast({ variant: "success", title: "已保存", description: `${summary.enabled} 项任务已同步` })
    } catch (error) {
      toast({ variant: "destructive", title: "保存失败", description: error instanceof Error ? error.message : "网络错误" })
    } finally { setSaving(false) }
  }

  if (loading) return <DashboardLayout><div className="py-20 text-center text-sm text-muted-foreground">正在读取任务配置...</div></DashboardLayout>
  if (!token || !isTokenValid(token)) return <DashboardLayout><div className="py-20 text-center text-sm text-muted-foreground">请先登录</div></DashboardLayout>
  if (!script) return <DashboardLayout><div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"><h1 className="text-lg font-semibold">配置暂不可用</h1><p className="mt-2 text-sm text-muted-foreground">{loadError || "无法读取当前账号的任务配置"}</p><Button className="mt-5" onClick={() => window.location.reload()}>重新加载</Button></div></DashboardLayout>

  return (
    <DashboardLayout contentClassName="max-w-6xl">
      <div className="pb-16">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="outline">CONFIG SCHEMA V{SCRIPT_SCHEMA_VERSION}</Badge><span className="text-xs text-muted-foreground">15 项可调度任务</span>{dirty && <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-200">未保存</Badge>}</div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">终末地任务编排</h1>
            <p className="mt-2 text-sm text-muted-foreground">{account?.account} · {serverLabel(account?.server)} · 按实际执行顺序组织任务和参数</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setScript(createScriptConfig(account?.config))} disabled={saving || !dirty} title="恢复已保存配置"><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={save} disabled={saving || !dirty}><Save className="mr-2 h-4 w-4" />{saving ? "保存中" : dirty ? "保存配置" : "已保存"}</Button>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-[1fr_1fr_2fr]">
          <div className="border-r border-border px-4 py-4"><p className="text-xs text-muted-foreground">已启用</p><p className="mt-1 text-xl font-semibold tabular-nums">{summary.enabled}<span className="text-sm font-normal text-muted-foreground"> / {summary.total}</span></p></div>
          <div className="px-4 py-4 sm:border-r sm:border-border"><p className="text-xs text-muted-foreground">服务器</p><p className="mt-1 text-sm font-medium">{serverLabel(account?.server)}</p></div>
          <div className="col-span-2 border-t border-border px-4 py-4 sm:col-span-1 sm:border-t-0"><p className="text-xs text-muted-foreground">执行链</p><p className="mt-1 text-sm font-medium leading-5 sm:truncate">预检世界页 → 已选任务 → 最终回世界页</p></div>
        </section>

        <main className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">任务队列</h2><p className="mt-1 text-xs text-muted-foreground">顺序与脚本 Dispatcher 保持一致</p></div>
            <Tabs defaultValue="routine">
              <TabsList className="m-4 grid h-10 grid-cols-4 bg-muted p-1">{GROUPS.map((group) => <TabsTrigger key={group.id} value={group.id} className="text-xs">{group.label}</TabsTrigger>)}</TabsList>
              {GROUPS.map((group) => <TabsContent key={group.id} value={group.id} className="m-0">
                <div className="divide-y divide-border">{SCRIPT_TASKS.filter((task) => task.group === group.id).map((task, index) => {
                  const Icon = ICONS[task.id]
                  const enabled = Boolean(script.selection[task.id])
                  return <div key={task.id} className={`grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4 transition-colors ${enabled ? "bg-card" : "bg-muted/35"}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${enabled ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>{Icon && <Icon className="h-4 w-4" />}</div>
                    <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-medium">{task.label}</span><span className="text-[10px] tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span></div><p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p></div>
                    <Switch checked={enabled} onCheckedChange={(value) => updateTask(task.id, value)} aria-label={`${task.label}开关`} />
                  </div>
                })}</div>
              </TabsContent>)}
            </Tabs>
          </section>

          <aside className="self-start overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-4">
            <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">运行参数</h2><p className="mt-1 text-xs text-muted-foreground">字段直接对应 advanced_config</p></div>
            <Tabs defaultValue="operations">
              <TabsList className="m-4 grid h-10 grid-cols-4 bg-muted p-1">{SETTINGS.map((item) => <TabsTrigger key={item.id} value={item.id} className="px-1 text-xs">{item.label}</TabsTrigger>)}</TabsList>
              {SETTINGS.map((item) => <TabsContent key={item.id} value={item.id} className="m-0 px-5 pb-5"><EndfieldScriptAdvanced panel={item.id} value={script.advancedConfig} onChange={(advancedConfig) => setScript({ ...script, advancedConfig })} /></TabsContent>)}
            </Tabs>
          </aside>
        </main>
      </div>
    </DashboardLayout>
  )
}
