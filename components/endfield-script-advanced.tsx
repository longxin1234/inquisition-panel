"use client"

import { Clock3, Factory, MapPinned, PackageSearch, TicketCheck, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ScriptAdvancedConfig } from "@/lib/endfield-script-config"

export type SettingsPanel = "operations" | "resources" | "base" | "system"

const DAYS = ["一", "二", "三", "四", "五", "六", "日"]
const STAMINA_TYPES = ["干员经验", "干员进阶", "钱币收集", "技能提升", "武器经验", "武器进阶", "危境预演", "能量淤积点"]

function SettingRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"><span className="text-sm text-foreground">{label}</span><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>
}

function NumberField({ id, label, value, min = 0, max = 1_000_000_000, onChange }: { id: string; label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return <div className="space-y-1.5"><Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label><Input id={id} type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-9 bg-background" /></div>
}

export function EndfieldScriptAdvanced({ panel, value, onChange }: { panel: SettingsPanel; value: ScriptAdvancedConfig; onChange: (value: ScriptAdvancedConfig) => void }) {
  const patch = (key: string, next: Record<string, unknown>) => onChange({ ...value, [key]: { ...(value[key] || {}), ...next } })

  if (panel === "operations") {
    const depot = value.depot_areas || {}
    const material = value.material_dispatch || {}
    const outpost = value.outpost_trade || {}
    return <div className="divide-y divide-border">
      <section className="py-5 first:pt-0"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><MapPinned className="h-4 w-4 text-primary" />仓储节点</h3><SettingRow label="四号谷地" checked={depot.area_4 !== false} onCheckedChange={(area_4) => patch("depot_areas", { area_4 })} /><SettingRow label="武陵" checked={depot.wuling !== false} onCheckedChange={(wuling) => patch("depot_areas", { wuling })} /></section>
      <section className="py-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><PackageSearch className="h-4 w-4 text-primary" />物资售卖</h3><div className="grid grid-cols-2 gap-x-4"><SettingRow label="四号谷地" checked={material.valley_iv !== false} onCheckedChange={(valley_iv) => patch("material_dispatch", { valley_iv })} /><SettingRow label="武陵" checked={material.wuling !== false} onCheckedChange={(wuling) => patch("material_dispatch", { wuling })} /></div><div className="mt-4 space-y-1.5"><Label className="text-xs text-muted-foreground">价格策略</Label><Select value={material.price_mode || "per_category"} onValueChange={(price_mode) => patch("material_dispatch", { price_mode })}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="per_category">按波动等级</SelectItem><SelectItem value="global">统一价格</SelectItem></SelectContent></Select></div><div className="mt-4 grid grid-cols-2 gap-3">{material.price_mode === "global" ? <NumberField id="global-price" label="统一出售阈值" value={material.global_price ?? 4600} min={100} onChange={(global_price) => patch("material_dispatch", { global_price })} /> : <><NumberField id="moderate-price" label="普通波动" value={material.moderate_price ?? 4600} min={100} onChange={(moderate_price) => patch("material_dispatch", { moderate_price })} /><NumberField id="large-price" label="大幅波动" value={material.large_price ?? 5000} min={100} onChange={(large_price) => patch("material_dispatch", { large_price })} /><NumberField id="massive-price" label="剧烈波动" value={material.massive_price ?? 5300} min={100} onChange={(massive_price) => patch("material_dispatch", { massive_price })} /></>}</div></section>
      <section className="py-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Factory className="h-4 w-4 text-primary" />据点交易</h3><div className="grid grid-cols-2 gap-x-4"><SettingRow label="四号谷地" checked={outpost.valley_iv !== false} onCheckedChange={(valley_iv) => patch("outpost_trade", { valley_iv })} /><SettingRow label="武陵" checked={outpost.wuling !== false} onCheckedChange={(wuling) => patch("outpost_trade", { wuling })} /></div><div className="mt-4 space-y-1.5"><Label className="text-xs text-muted-foreground">选品策略</Label><Select value={outpost.selection_strategy || "rarity"} onValueChange={(selection_strategy) => patch("outpost_trade", { selection_strategy })}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rarity">品质优先</SelectItem><SelectItem value="price">价格优先</SelectItem></SelectContent></Select></div><SettingRow label="自动切换干员" checked={outpost.operator_auto_switch !== false} onCheckedChange={(operator_auto_switch) => patch("outpost_trade", { operator_auto_switch })} /></section>
    </div>
  }

  if (panel === "resources") {
    const stamina = value.stamina_clear || {}
    const potion = value.stamina_potion || {}
    const item = stamina.stage_items?.[0] || { stage_type: "干员经验", max_runs: 99, enabled: true, order: 1 }
    const areas = value.voucher_areas || {}
    const weekdays = Array.isArray(value.voucher_weekdays) ? value.voucher_weekdays : []
    const updateStamina = (next: Record<string, unknown>) => {
      const updated = { ...item, ...next }
      patch("stamina_clear", { ...next, stage_name: updated.stage_type, stage_items: [updated], entries: [updated] })
    }
    return <div className="divide-y divide-border">
      <section className="pb-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Zap className="h-4 w-4 text-primary" />刷体力</h3><div className="space-y-1.5"><Label className="text-xs text-muted-foreground">副本类型</Label><Select value={item.stage_type || "干员经验"} onValueChange={(stage_type) => updateStamina({ stage_type, stage_name: stage_type })}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent>{STAMINA_TYPES.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div><div className="mt-3 grid grid-cols-2 gap-3"><NumberField id="stamina-runs" label="最大次数" value={item.max_runs ?? 99} min={1} max={999} onChange={(max_runs) => updateStamina({ max_runs })} /><NumberField id="energy-attempts" label="进入重试次数" value={stamina.energy_enter_attempts ?? 3} min={1} max={5} onChange={(energy_enter_attempts) => patch("stamina_clear", { energy_enter_attempts })} /></div><SettingRow label="允许使用恢复道具" checked={stamina.use_potion !== false} onCheckedChange={(use_potion) => patch("stamina_clear", { use_potion })} /><div className="mt-3 grid grid-cols-3 gap-2"><NumberField id="potion-days" label="到期天数" value={potion.expire_within_days ?? 3} min={0} max={365} onChange={(expire_within_days) => patch("stamina_potion", { expire_within_days })} /><NumberField id="potion-count" label="最多使用" value={potion.use_count ?? 99} min={1} max={99} onChange={(use_count) => patch("stamina_potion", { use_count })} /><NumberField id="potion-sanity" label="理智上限" value={potion.max_sanity ?? 9999} min={1} max={9999} onChange={(max_sanity) => patch("stamina_potion", { max_sanity })} /></div></section>
      <section className="py-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><TicketCheck className="h-4 w-4 text-primary" />调度券消费</h3><div className="mb-4 flex flex-wrap gap-1.5">{DAYS.map((day, index) => <button type="button" key={day} onClick={() => { const next = [...weekdays]; next[index] = !next[index]; onChange({ ...value, voucher_weekdays: next }) }} className={`flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium transition-colors ${weekdays[index] ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-foreground/30"}`} aria-label={`星期${day}`}>{day}</button>)}</div><div className="grid grid-cols-2 gap-x-4"><SettingRow label="四号谷地" checked={areas.area_4 !== false} onCheckedChange={(area_4) => patch("voucher_areas", { area_4 })} /><SettingRow label="武陵" checked={areas.wuling !== false} onCheckedChange={(wuling) => patch("voucher_areas", { wuling })} /></div><div className="mt-3"><NumberField id="voucher-max" label="单轮消费上限" value={value.voucher_max_spend ?? 30000000} onChange={(voucher_max_spend) => onChange({ ...value, voucher_max_spend })} /></div></section>
    </div>
  }

  if (panel === "base") {
    const dijiang = value.dijiang || {}
    return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Factory className="h-4 w-4 text-primary" />帝江号</h3><div className="grid grid-cols-2 gap-3"><NumberField id="clue-keep" label="线索保留数量" value={dijiang.clue_keep_count ?? 2} min={1} max={2} onChange={(clue_keep_count) => patch("dijiang", { clue_keep_count })} /><NumberField id="clue-send" label="最多赠予线索" value={dijiang.send_max ?? 3} min={0} max={99} onChange={(send_max) => patch("dijiang", { send_max })} /></div><SettingRow label="直接赠予线索" checked={dijiang.send_direct !== false} onCheckedChange={(send_direct) => patch("dijiang", { send_direct })} /><SettingRow label="执行心情恢复与换班" checked={dijiang.recovery_emotion !== false} onCheckedChange={(recovery_emotion) => patch("dijiang", { recovery_emotion })} /></section>
  }

  const schedule = value.schedule || {}
  const watchdog = value.game_watchdog || {}
  return <div className="divide-y divide-border"><section className="pb-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-primary" />定时执行</h3><SettingRow label="启用定时调度" checked={schedule.enabled === true} onCheckedChange={(enabled) => patch("schedule", { enabled })} /><div className="mt-3 space-y-1.5"><Label htmlFor="schedule-times" className="text-xs text-muted-foreground">执行时间</Label><Input id="schedule-times" value={schedule.times_text || "4:00 12:00 20:00"} onChange={(event) => patch("schedule", { times_text: event.target.value })} className="bg-background" /></div><SettingRow label="跨时间点重启" checked={schedule.cross_point_restart !== false} onCheckedChange={(cross_point_restart) => patch("schedule", { cross_point_restart })} /></section><section className="pt-5"><h3 className="mb-3 text-sm font-semibold">运行保护</h3><div className="grid grid-cols-2 gap-3"><NumberField id="game-restart" label="游戏重启间隔（秒）" value={watchdog.game_restart_interval_s ?? 900} min={60} max={86400} onChange={(game_restart_interval_s) => patch("game_watchdog", { game_restart_interval_s })} /><NumberField id="full-restart" label="完整重启间隔（秒）" value={watchdog.full_restart_interval_s ?? 3600} min={60} max={86400} onChange={(full_restart_interval_s) => patch("game_watchdog", { full_restart_interval_s })} /></div><SettingRow label="禁用完整重启" checked={watchdog.disable_full_restart === true} onCheckedChange={(disable_full_restart) => patch("game_watchdog", { disable_full_restart })} /></section></div>
}
