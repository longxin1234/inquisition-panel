"use client"

import { Factory, Leaf, MapPinned, PackageSearch, ShoppingBag, Store, TicketCheck, Users, Warehouse, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  CREDIT_REFRESH_COSTS, CREDIT_ROUND_MODES, OUTPOST_PRIORITY_OPTIONS_BY_AREA,
  OUTPOST_RESERVE_ITEM_IDS, OUTPOST_RESERVE_ITEM_OPTIONS, OUTPOST_RESERVE_MODES,
  STABLE_CATALOG, STABLE_DISCOUNT_TIERS, STAMINA_CARD_LIMIT, STAMINA_LEVELS,
  STAMINA_TYPES, STAMINA_TYPE_NONE, type ScriptAdvancedConfig,
} from "@/lib/endfield-script-config"

// 面板一一对应脚本主窗的 Tab（core/task_ui.lua）：
// 1 任务（本页顶部任务队列）/ 2 仓储 / 3 信用 / 4 上号 / 5 体力清理 / 6 基建
// 7 据点交易 / 8 售卖 / 9 购买弹性物资 / 13 购买稳定物资
export type SettingsPanel = "depot" | "credit" | "login" | "stamina" | "base" | "outpost" | "sell" | "voucher" | "stable"

const DAYS = ["一", "二", "三", "四", "五", "六", "日"]
const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
const DEPOT_LOCATIONS: Array<[string, string]> = [
  ["originium_science_park", "四号谷地 源石研究园"],
  ["origin_lodespring", "四号谷地 矿脉源区"],
  ["power_plateau", "四号谷地 供能高地"],
  ["wuling_city", "武陵城区"],
  ["test_area", "试验园区"],
]
const STABLE_LIMITS: Array<[string, string]> = [
  ["engraving_permit", "刻写券上限"],
  ["food_buff", "食物与增益上限"],
  ["detector_compass", "探测器与罗盘上限"],
  ["artificing_catalyst", "精锻助剂上限"],
  ["gifts", "礼物上限"],
]
const POTION_EXPIRY = ["全部", "1", "3", "7", "10"]
type IconType = typeof Warehouse

function SectionTitle({ icon: Icon, children }: { icon: IconType; children: React.ReactNode }) {
  return <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-sky-600 dark:text-sky-300" />{children}</h3>
}

function SettingRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"><span className="text-sm text-foreground">{label}</span><Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600" /></div>
}

function NumberField({ id, label, value, min = 0, max = 1_000_000_000, onChange }: { id: string; label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return <div className="space-y-1.5"><Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label><Input id={id} type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-9 bg-background" /></div>
}

function TextField({ id, label, value, placeholder, hint, onChange }: { id: string; label: string; value: string; placeholder?: string; hint?: string; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label><Input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-9 bg-background" />{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>
}

function SelectField({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger id={id} className="h-9 bg-background"><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
}

function DayPicker({ value, onChange }: { value: boolean[]; onChange: (value: boolean[]) => void }) {
  return <div className="flex flex-wrap gap-1.5">{DAYS.map((day, index) => <button type="button" key={day} aria-label={WEEKDAY_LABELS[index]} onClick={() => { const next = [...value]; next[index] = !next[index]; onChange(next) }} className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${value[index] ? "border-sky-500 bg-sky-600 text-white" : "border-border bg-background text-muted-foreground hover:border-sky-300"}`}>周{day}</button>)}</div>
}

export function EndfieldScriptAdvanced({ panel, value, onChange }: { panel: SettingsPanel; value: ScriptAdvancedConfig; onChange: (value: ScriptAdvancedConfig) => void }) {
  const patch = (key: string, next: Record<string, unknown>) => onChange({ ...value, [key]: { ...(value[key] || {}), ...next } })
  const setValue = (key: string, next: unknown) => onChange({ ...value, [key]: next })

  if (panel === "depot") {
    const areas = value.depot_areas || {}
    const locations = value.depot_locations || {}
    return <div className="space-y-5">
      <div><SectionTitle icon={Warehouse}>仓储节点地区</SectionTitle><div className="grid grid-cols-2 gap-x-4"><SettingRow label="四号谷地" checked={areas.area_4 !== false} onCheckedChange={(area_4) => patch("depot_areas", { area_4 })} /><SettingRow label="武陵" checked={areas.wuling !== false} onCheckedChange={(wuling) => patch("depot_areas", { wuling })} /></div></div>
      <div><SectionTitle icon={PackageSearch}>装箱与接单</SectionTitle><SettingRow label="装箱时选择物品" checked={value.depot_pack_cargo_select_item === true} onCheckedChange={(next) => setValue("depot_pack_cargo_select_item", next)} /><SettingRow label="仅装箱不转交" checked={value.depot_pack_cargo_only === true} onCheckedChange={(next) => setValue("depot_pack_cargo_only", next)} /><SettingRow label="仅接取送货任务" checked={value.depot_accept_job_only === true} onCheckedChange={(next) => setValue("depot_accept_job_only", next)} /></div>
      <div><SectionTitle icon={MapPinned}>仓储地点</SectionTitle><div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">{DEPOT_LOCATIONS.map(([key, label]) => <SettingRow key={key} label={label} checked={locations[key] !== false} onCheckedChange={(next) => setValue("depot_locations", { ...locations, [key]: next })} />)}</div></div>
      <div><SectionTitle icon={PackageSearch}>装箱物品</SectionTitle><div className="grid grid-cols-2 gap-3"><TextField id="depot-item-valley" label="四号谷地装箱物品 ID" value={String(value.depot_pack_item_valley ?? "sandleaf_powder")} onChange={(next) => setValue("depot_pack_item_valley", next)} /><TextField id="depot-item-wuling" label="武陵装箱物品 ID" value={String(value.depot_pack_item_wuling ?? "sandleaf_powder")} onChange={(next) => setValue("depot_pack_item_wuling", next)} /></div></div>
    </div>
  }

  if (panel === "credit") {
    const rounds = Array.isArray(value.credit_refresh_rounds) ? value.credit_refresh_rounds : []
    const setMode = (index: number, mode: string) => {
      const next = CREDIT_REFRESH_COSTS.map((cost, round) => ({ cost, mode: round === index ? mode : (rounds[round]?.mode || (round === 2 ? "fallback" : "off")) }))
      setValue("credit_refresh_rounds", next)
    }
    return <div className="space-y-5">
      <div><SectionTitle icon={ShoppingBag}>刷新轮次</SectionTitle>{CREDIT_REFRESH_COSTS.map((cost, index) => <div key={cost} className="mb-3">
        <p className="mb-1.5 text-xs text-muted-foreground">第 {index + 1} 轮 · 代价 {cost} 信用</p>
        <div className="grid grid-cols-4 gap-1.5">{CREDIT_ROUND_MODES.map((mode) => <button type="button" key={mode.value} onClick={() => setMode(index, mode.value)} className={`h-9 rounded-md border text-xs font-medium transition-colors ${rounds[index]?.mode === mode.value ? "border-sky-500 bg-sky-600 text-white" : "border-border bg-background text-muted-foreground hover:border-sky-300"}`}>{mode.label}</button>)}</div>
      </div>)}<p className="text-[11px] text-muted-foreground">95 折/75 折=刷新后按该折扣购买；兜底=前两轮未命中时无条件买入；不刷新=该轮不再刷新。</p></div>
      <div><SectionTitle icon={TicketCheck}>保留信用</SectionTitle><NumberField id="credit-reserve" label="刷新保留信用（低于此值不再刷新，0=花到不能刷）" value={Number(value.credit_reserve ?? 150)} min={0} onChange={(next) => setValue("credit_reserve", next)} /></div>
    </div>
  }

  if (panel === "login") {
    const weekdays = Array.isArray(value.login_weekdays) ? value.login_weekdays : []
    return <div className="space-y-5">
      <div><SectionTitle icon={Users}>上号时间</SectionTitle><p className="mb-3 text-xs text-muted-foreground">只在勾选的星期启动每日任务，与脚本「上号」页一致。</p><DayPicker value={weekdays} onChange={(next) => setValue("login_weekdays", next)} /></div>
    </div>
  }

  if (panel === "stamina") {
    const stamina = value.stamina_clear || {}
    const potion = value.stamina_potion || {}
    const items = Array.isArray(stamina.stage_items) ? stamina.stage_items : []
    const updateCard = (index: number, next: Record<string, unknown>) => {
      const cards = items.map((card: any, cardIndex: number) => {
        if (cardIndex !== index) return card
        const merged: Record<string, unknown> = { ...card, ...next, order: cardIndex + 1 }
        if (next.stage_type !== undefined) {
          merged.stage_type = next.stage_type
          merged.stage_name = next.stage_type === STAMINA_TYPE_NONE ? String(card.stage_name || card.stage_type || "") : String(next.stage_type)
          merged.enabled = next.stage_type !== STAMINA_TYPE_NONE
        }
        return merged
      })
      patch("stamina_clear", { stage_items: cards, entries: cards, stage_name: cards[0]?.stage_name || null })
    }
    const addCard = () => {
      const card = { stage_type: STAMINA_TYPE_NONE, stage_name: STAMINA_TYPE_NONE, stage_level: null, max_runs: 99, enabled: false, order: items.length + 1 }
      patch("stamina_clear", { stage_items: [...items, card], entries: [...items, card] })
    }
    const removeCard = (index: number) => {
      const cards = items.filter((_: any, cardIndex: number) => cardIndex !== index)
      patch("stamina_clear", { stage_items: cards, entries: cards })
    }
    return <div className="space-y-5">
      <div><SectionTitle icon={Zap}>关卡队列</SectionTitle><SettingRow label="体力不足时用体力药" checked={stamina.use_potion !== false} onCheckedChange={(next) => patch("stamina_clear", { use_potion: next })} />
        <div className="mt-3 space-y-2">{items.map((item: any, index: number) => {
          const stageType = String(item.stage_type || item.stage_name || STAMINA_TYPE_NONE)
          const levels = STAMINA_LEVELS[stageType] || ["自动选关"]
          return <div key={index} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">第 {index + 1} 张卡{stageType === STAMINA_TYPE_NONE ? "（未启用）" : ""}</span>{items.length > 1 && <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => removeCard(index)}>删除</button>}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <SelectField id={`stamina-type-${index}`} label="类型" value={stageType} options={[STAMINA_TYPE_NONE, ...STAMINA_TYPES]} onChange={(next) => updateCard(index, { stage_type: next, stage_level: null })} />
              <SelectField id={`stamina-level-${index}`} label="关卡" value={item.stage_level ? String(item.stage_level) : "自动选关"} options={levels} onChange={(next) => updateCard(index, { stage_level: next === "自动选关" ? null : next })} />
              <NumberField id={`stamina-runs-${index}`} label="次数" value={Number(item.max_runs ?? 99)} min={1} max={9999} onChange={(next) => updateCard(index, { max_runs: next })} />
            </div>
          </div>
        })}</div>
        <button type="button" className="mt-3 h-9 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:border-sky-300 disabled:opacity-50" onClick={addCard} disabled={items.length >= STAMINA_CARD_LIMIT}>+ 添加配置项（最多 {STAMINA_CARD_LIMIT} 张）</button>
      </div>
      <div><SectionTitle icon={TicketCheck}>体力药</SectionTitle><div className="grid grid-cols-3 gap-2">
        <SelectField id="potion-expire" label="有效期" value={potion.expire_within_days === "all" ? "全部" : String(potion.expire_within_days ?? 3)} options={POTION_EXPIRY} onChange={(next) => patch("stamina_potion", { expire_within_days: next === "全部" ? "all" : Number(next) })} />
        <NumberField id="potion-count" label="最多使用" value={Number(potion.use_count ?? 99)} min={1} max={99} onChange={(next) => patch("stamina_potion", { use_count: next })} />
        <NumberField id="potion-sanity" label="理智上限" value={Number(potion.max_sanity ?? 9999)} min={1} max={9999} onChange={(next) => patch("stamina_potion", { max_sanity: next })} />
      </div><div className="mt-3"><NumberField id="energy-attempts" label="能量淤积点进入重试次数" value={Number(stamina.energy_enter_attempts ?? 5)} min={1} max={5} onChange={(next) => patch("stamina_clear", { energy_enter_attempts: next })} /></div></div>
    </div>
  }

  if (panel === "base") {
    const growth = value.growth || {}
    const dijiang = value.dijiang || {}
    return <div className="space-y-5">
      <div><SectionTitle icon={Leaf}>培养舱种子偏好</SectionTitle><div className="space-y-3">
        <TextField id="growth-prefer" label="优先种子" value={Array.isArray(growth.prefer_targets) ? growth.prefer_targets.join(" ") : ""} placeholder="名字用空格分隔" hint="优先种子排在最前，可留空" onChange={(next) => patch("growth", { prefer_targets: next.split(/[\s,，、]+/).filter(Boolean) })} />
        <TextField id="growth-block" label="禁止种子" value={Array.isArray(growth.block_targets) ? growth.block_targets.join(" ") : ""} placeholder="名字用空格分隔" hint="禁止种子永不培养" onChange={(next) => patch("growth", { block_targets: next.split(/[\s,，、]+/).filter(Boolean) })} />
      </div><SettingRow label="缺料时前往提取基核（不勾则扫色跳过缺料项）" checked={growth.auto_extract_seed === true} onCheckedChange={(next) => patch("growth", { auto_extract_seed: next })} /></div>
      <div><SectionTitle icon={Factory}>帝江号线索与换班</SectionTitle><div className="grid grid-cols-2 gap-3">
        <NumberField id="clue-keep" label="每种线索保留数量" value={Number(dijiang.clue_keep_count ?? 2)} min={1} max={2} onChange={(next) => patch("dijiang", { clue_keep_count: next })} />
        <NumberField id="clue-send" label="最多赠予线索" value={Number(dijiang.send_max ?? 3)} min={0} max={99} onChange={(next) => patch("dijiang", { send_max: next })} />
      </div><SettingRow label="直接赠予线索" checked={dijiang.send_direct !== false} onCheckedChange={(next) => patch("dijiang", { send_direct: next })} /><SettingRow label="执行心情恢复与换班" checked={dijiang.recovery_emotion !== false} onCheckedChange={(next) => patch("dijiang", { recovery_emotion: next })} /></div>
    </div>
  }

  if (panel === "outpost") {
    const outpost = value.outpost_trade || {}
    const reserveRules = outpost.reserve_rules || {}
    const reserveEntries = Object.entries(reserveRules)
    const reserveRows = Array.from({ length: 6 }, (_, index) => {
      const [itemId, rawValue] = reserveEntries[index] || ["", 100]
      const label = Object.entries(OUTPOST_RESERVE_ITEM_IDS).find(([, id]) => id === itemId)?.[0] || "无"
      const numericValue = typeof rawValue === "number" && rawValue >= 0 ? rawValue : 100
      return { item: label, mode: rawValue === -1 ? "永不售出" : "保留数量", value: numericValue }
    })
    const updateReserve = (index: number, next: Record<string, unknown>) => {
      const rules: Record<string, number> = {}
      reserveRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...next } : row)).forEach((row) => {
        const itemId = OUTPOST_RESERVE_ITEM_IDS[String(row.item)]
        if (itemId) rules[itemId] = row.mode === "永不售出" ? -1 : Math.max(0, Number(row.value) || 0)
      })
      patch("outpost_trade", { reserve_rules: rules })
    }
    const priorityKey = (area: "valley_iv" | "wuling") => (area === "valley_iv" ? "priority_valley_iv" : "priority_wuling")
    const priority = (area: "valley_iv" | "wuling"): string[] => {
      const stored = outpost[priorityKey(area)]
      return Array.isArray(stored) ? stored.slice(0, 6) : ["无", "无", "无", "无", "无", "无"]
    }
    const setSlot = (area: "valley_iv" | "wuling", slot: number, item: string) => {
      const next = [...priority(area)]
      next[slot] = item
      patch("outpost_trade", { [priorityKey(area)]: next })
    }
    return <div className="space-y-5">
      <div><SectionTitle icon={Store}>地区与策略</SectionTitle><div className="grid grid-cols-2 gap-x-4">
        <SettingRow label="据点交易 四号谷地" checked={outpost.valley_iv !== false} onCheckedChange={(next) => patch("outpost_trade", { valley_iv: next })} />
        <SettingRow label="据点交易 武陵" checked={outpost.wuling !== false} onCheckedChange={(next) => patch("outpost_trade", { wuling: next })} />
      </div><SettingRow label="按单价优先（不勾=品质优先）" checked={outpost.selection_strategy === "price"} onCheckedChange={(next) => patch("outpost_trade", { selection_strategy: next ? "price" : "rarity" })} /><SettingRow label="自动切换联络干员" checked={outpost.operator_auto_switch !== false} onCheckedChange={(next) => patch("outpost_trade", { operator_auto_switch: next })} /></div>
      <div><SectionTitle icon={PackageSearch}>优先货品</SectionTitle><SettingRow label="启用优先货品" checked={outpost.priority_enabled === true} onCheckedChange={(next) => patch("outpost_trade", { priority_enabled: next })} /><SettingRow label="只售优先货品" checked={outpost.only_preferred === true} onCheckedChange={(next) => patch("outpost_trade", { only_preferred: next })} />
        <div className="mt-3 space-y-3">{(["valley_iv", "wuling"] as const).map((area) => <div key={area}><p className="mb-1.5 text-xs font-medium text-muted-foreground">{area === "valley_iv" ? "四号谷地槽位" : "武陵槽位"}</p><div className="grid grid-cols-2 gap-2">{priority(area).map((slot: string, index: number) => <SelectField key={index} id={`priority-${area}-${index}`} label={`槽位 ${index + 1}`} value={String(slot || "无")} options={OUTPOST_PRIORITY_OPTIONS_BY_AREA[area]} onChange={(next) => setSlot(area, index, next)} />)}</div></div>)}</div>
      </div>
      <div><SectionTitle icon={TicketCheck}>物品保留</SectionTitle>
        <p className="text-[11px] text-muted-foreground">保留数量=库存低于该数量不再卖；永不售出=整件保留。全部选「无」即不启用物品保留（与脚本一致）。</p>
        <div className="mt-3 space-y-2">{reserveRows.map((row, index) => <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SelectField id={`reserve-item-${index}`} label={`物品 ${index + 1}`} value={row.item} options={OUTPOST_RESERVE_ITEM_OPTIONS} onChange={(next) => updateReserve(index, { item: next })} />
          <SelectField id={`reserve-mode-${index}`} label="方式" value={row.mode} options={OUTPOST_RESERVE_MODES} onChange={(next) => updateReserve(index, { mode: next })} />
          <NumberField id={`reserve-value-${index}`} label="保留数量" value={row.value} min={0} max={1_000_000_000} onChange={(next) => updateReserve(index, { value: next })} />
        </div>)}</div>
      </div>
    </div>
  }

  if (panel === "sell") {
    const material = value.material_dispatch || {}
    return <div className="space-y-5">
      <div><SectionTitle icon={Store}>售卖地区</SectionTitle><div className="grid grid-cols-2 gap-x-4">
        <SettingRow label="弹性售卖 四号谷地" checked={material.valley_iv !== false} onCheckedChange={(next) => patch("material_dispatch", { valley_iv: next })} />
        <SettingRow label="弹性售卖 武陵" checked={material.wuling !== false} onCheckedChange={(next) => patch("material_dispatch", { wuling: next })} />
      </div></div>
      <div><SectionTitle icon={TicketCheck}>出售价格</SectionTitle><SettingRow label="统一售价（不勾=按品类分别设置）" checked={material.price_mode === "global"} onCheckedChange={(next) => patch("material_dispatch", { price_mode: next ? "global" : "per_category" })} />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{material.price_mode === "global"
          ? <NumberField id="global-price" label="统一阈值" value={Number(material.global_price ?? 4600)} min={1} onChange={(next) => patch("material_dispatch", { global_price: next })} />
          : <><NumberField id="moderate-price" label="中额" value={Number(material.moderate_price ?? 4600)} min={1} onChange={(next) => patch("material_dispatch", { moderate_price: next })} /><NumberField id="large-price" label="大额" value={Number(material.large_price ?? 5000)} min={1} onChange={(next) => patch("material_dispatch", { large_price: next })} /><NumberField id="massive-price" label="巨额" value={Number(material.massive_price ?? 5300)} min={1} onChange={(next) => patch("material_dispatch", { massive_price: next })} /></>}</div>
      </div>
      <div><SectionTitle icon={PackageSearch}>调度券溢出</SectionTitle><div className="grid grid-cols-2 gap-3">
        <NumberField id="overflow-valley" label="四号谷地券溢出" value={Number(material.ticket_overflow_valley_iv ?? 30000000)} min={1} onChange={(next) => patch("material_dispatch", { ticket_overflow_valley_iv: next })} />
        <NumberField id="overflow-wuling" label="武陵券溢出" value={Number(material.ticket_overflow_wuling ?? 30000000)} min={1} onChange={(next) => patch("material_dispatch", { ticket_overflow_wuling: next })} />
      </div></div>
    </div>
  }

  if (panel === "voucher") {
    const areas = value.voucher_areas || {}
    const material = value.material_dispatch || {}
    const weekdays = Array.isArray(value.voucher_weekdays) ? value.voucher_weekdays : []
    return <div className="space-y-5">
      <div><SectionTitle icon={Users}>执行周期</SectionTitle><p className="mb-3 text-xs text-muted-foreground">仅在勾选的星期执行弹性购买。</p><DayPicker value={weekdays} onChange={(next) => setValue("voucher_weekdays", next)} /></div>
      <div><SectionTitle icon={MapPinned}>购买地区</SectionTitle><div className="grid grid-cols-2 gap-x-4">
        <SettingRow label="四号谷地" checked={areas.area_4 !== false} onCheckedChange={(next) => patch("voucher_areas", { area_4: next })} />
        <SettingRow label="武陵" checked={areas.wuling !== false} onCheckedChange={(next) => patch("voucher_areas", { wuling: next })} />
      </div></div>
      <div><SectionTitle icon={TicketCheck}>购买阈值</SectionTitle><SettingRow label="启用自定义（关闭则按 Maa 默认，含星期修正）" checked={value.voucher_price_mode === "custom"} onCheckedChange={(next) => setValue("voucher_price_mode", next ? "custom" : "maa")} />
        <div className="mt-3"><NumberField id="voucher-max" label="自定义固定单件价格上限" value={Number(value.voucher_max_spend ?? 1000)} min={1} onChange={(next) => setValue("voucher_max_spend", next)} /></div>
      </div>
      <div><SectionTitle icon={PackageSearch}>囤货数据</SectionTitle><div className="grid grid-cols-2 gap-3">
        <NumberField id="server-time" label="服务器 UTC 偏移" value={Number(material.stockpile_server_time ?? 8)} min={-12} max={14} onChange={(next) => patch("material_dispatch", { stockpile_server_time: next })} />
        <div className="flex items-end"><div className="w-full"><SettingRow label="上报价格数据" checked={material.stockpile_allow_data_upload !== false} onCheckedChange={(next) => patch("material_dispatch", { stockpile_allow_data_upload: next })} /></div></div>
      </div></div>
    </div>
  }

  const stable = value.stable_stockpile || {}
  const stableWeekdays = Array.isArray(value.stable_weekdays) ? value.stable_weekdays : []
  return <div className="space-y-5">
    <div><SectionTitle icon={Users}>执行周期</SectionTitle><DayPicker value={stableWeekdays} onChange={(next) => setValue("stable_weekdays", next)} /></div>
    {(Object.keys(STABLE_CATALOG) as Array<keyof typeof STABLE_CATALOG>).map((areaKey) => {
      const area = stable[areaKey] || {}
      const limits = area.limits || {}
      const items = area.items || {}
      const areaLabel = STABLE_CATALOG[areaKey].label
      return <div key={areaKey} className="rounded-lg border border-border p-3">
        <SectionTitle icon={Store}>{areaLabel}稳定购买</SectionTitle>
        <SettingRow label={`启用${areaLabel}`} checked={area.enabled !== false} onCheckedChange={(next) => patch("stable_stockpile", { [areaKey]: { ...area, enabled: next } })} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField id={`stable-reserve-${areaKey}`} label="最低保留（万）" value={Number(area.reserve ?? 24)} min={0} onChange={(next) => patch("stable_stockpile", { [areaKey]: { ...area, reserve: next } })} />
          <SelectField id={`stable-discount-${areaKey}`} label="最低折扣档" value={area.min_discount == null ? "不限" : String(area.min_discount)} options={STABLE_DISCOUNT_TIERS} onChange={(next) => patch("stable_stockpile", { [areaKey]: { ...area, min_discount: next === "不限" ? null : Number(next) } })} />
        </div>
        <div className="mt-2"><SettingRow label="仅购买折扣" checked={area.only_discount !== false} onCheckedChange={(next) => patch("stable_stockpile", { [areaKey]: { ...area, only_discount: next } })} /></div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">分类购买上限</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{STABLE_LIMITS.map(([key, label]) => <NumberField key={key} id={`stable-limit-${areaKey}-${key}`} label={label} value={Number(limits[key] ?? 20)} min={0} onChange={(next) => patch("stable_stockpile", { [areaKey]: { ...area, limits: { ...limits, [key]: next } } })} />)}</div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">商品开关</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">{STABLE_CATALOG[areaKey].items.map(([slug, label]) => <label key={slug} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs"><input type="checkbox" className="h-3.5 w-3.5 accent-sky-600" checked={Boolean(items[slug])} onChange={(event) => patch("stable_stockpile", { [areaKey]: { ...area, items: { ...items, [slug]: event.target.checked } } })} /><span className="truncate">{label}</span></label>)}</div>
      </div>
    })}
  </div>
}
