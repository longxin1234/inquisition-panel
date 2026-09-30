"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { CheckCheck, CheckCircle2, ChevronDown, Factory, Hammer, ListX, Mail, PackageSearch, RefreshCw, Save, Settings2, ShoppingBag, Store, TicketCheck, Users, Wrench, Zap } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EndfieldScriptAdvanced, type SettingsPanel } from "@/components/endfield-script-advanced"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"
import { SCRIPT_TASKS, createScriptConfig, scriptConfigToAccountConfig, summarizeScriptTasks, SCRIPT_SCHEMA_VERSION, type EndfieldScriptConfig } from "@/lib/endfield-script-config"
import { serverLabel } from "@/lib/user-config"

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  credit_shopping: ShoppingBag, visit_friends: Users, simple_crafting: Hammer,
  gear_assembly: Wrench, mail_claim: Mail, daily_tasks: CheckCircle2,
  protocol_pass: TicketCheck, event_signin: CheckCircle2, skland_signin: CheckCircle2,
  depot_claim: Store, material_dispatch: PackageSearch, outpost_trade: Store,
  stamina_clear: Zap, voucher_spend: TicketCheck, shift_rotation: Factory,
}

const ADVANCED_SECTIONS: Array<{ value: string; title: string; description: string; panel: SettingsPanel }> = [
  { value: "resources", title: "体力清理配置", description: "副本、恢复道具和调度券消费", panel: "resources" },
  { value: "operations", title: "仓储与交易配置", description: "仓储节点、物资售卖和据点交易", panel: "operations" },
  { value: "base", title: "基建配置", description: "帝江号、线索和心情恢复", panel: "base" },
  { value: "system", title: "调度与运行保护", description: "定时执行、重启和运行保护", panel: "system" },
]

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
  const setAllTasks = (enabled: boolean) => setScript((current) => current ? ({ ...current, selection: Object.fromEntries(SCRIPT_TASKS.map((task) => [task.id, enabled])) }) : current)

  const save = async () => {
    if (!token || !account || !script) return
    setSaving(true)
    try {
      const config = scriptConfigToAccountConfig(account.config, script)
      const result = await apiRequestWithAuth("/updateMyAccount", token, { method: "POST", body: JSON.stringify({ config, active: account.active }), headers: { "Content-Type": "application/json" } })
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
    <DashboardLayout contentClassName="max-w-3xl">
      <main className="mx-auto space-y-4 pb-12">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-300">任务配置 V{SCRIPT_SCHEMA_VERSION}</Badge><span className="text-xs text-muted-foreground">{summary.enabled}/{summary.total} 项已启用</span>{dirty && <Badge className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200">未保存</Badge>}</div><h1 className="text-3xl font-semibold tracking-[-0.04em]">终末地任务配置</h1><p className="mt-2 text-sm text-muted-foreground">{account?.account} · {serverLabel(account?.server)} · 按实际执行顺序管理任务</p></div>
          <div className="flex shrink-0 items-center gap-2"><Button variant="outline" size="icon" onClick={() => setScript(createScriptConfig(account?.config))} disabled={saving || !dirty} title="恢复已保存配置"><RefreshCw className="h-4 w-4" /></Button><Button onClick={save} disabled={saving || !dirty} className="bg-sky-600 text-white hover:bg-sky-700">{saving ? "保存中" : dirty ? "保存配置" : "已保存"}<Save className="ml-2 h-4 w-4" /></Button></div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="task-selection-title">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="task-selection-title" className="font-semibold">任务队列</h2><p className="mt-1 text-xs text-muted-foreground">勾选的任务会按列表顺序执行，未勾选的任务不会进入本轮调度。</p></div><div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => setAllTasks(true)} disabled={saving}><CheckCheck className="mr-1.5 h-4 w-4" />全选</Button><Button variant="ghost" size="sm" onClick={() => setAllTasks(false)} disabled={saving}><ListX className="mr-1.5 h-4 w-4" />取消</Button></div></div>
          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">{SCRIPT_TASKS.map((task) => { const Icon = ICONS[task.id]; const enabled = Boolean(script.selection[task.id]); return <label key={task.id} className={`group flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${enabled ? "border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/25" : "border-border bg-background hover:border-sky-200 dark:hover:border-sky-900"}`}><Checkbox checked={enabled} onCheckedChange={(checked) => updateTask(task.id, checked === true)} disabled={saving} className="border-sky-500 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white" /><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${enabled ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200" : "bg-muted text-muted-foreground"}`}>{Icon && <Icon className="h-4 w-4" aria-hidden="true" />}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{task.label}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{task.description}</span></span></label> })}</div>
        </section>

        <AccordionPrimitive.Root type="multiple" defaultValue={["resources"]} className="space-y-3">
          {ADVANCED_SECTIONS.map((section) => <AccordionItem key={section.value} value={section.value} className="overflow-hidden rounded-2xl border border-border bg-card px-5 data-[state=open]:border-sky-200 dark:data-[state=open]:border-sky-900"><AccordionTrigger className="py-4 hover:no-underline"><span className="flex min-w-0 items-center gap-3 text-left"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200"><Settings2 className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold">{section.title}</span><span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{section.description}</span></span></span></AccordionTrigger><AccordionContent className="border-t border-border pt-4"><EndfieldScriptAdvanced panel={section.panel} value={script.advancedConfig} onChange={(advancedConfig) => setScript({ ...script, advancedConfig })} /></AccordionContent></AccordionItem>)}
        </AccordionPrimitive.Root>

        <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm dark:border-sky-900 dark:bg-sky-950/25"><span className="text-sky-800 dark:text-sky-200">修改后记得保存，新的任务队列会在下一次调度时生效。</span><Button size="sm" onClick={save} disabled={saving || !dirty} className="bg-sky-600 text-white hover:bg-sky-700"><Save className="mr-1.5 h-4 w-4" />保存</Button></div>
      </main>
    </DashboardLayout>
  )
}
