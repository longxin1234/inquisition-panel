export type ScriptTaskGroup = "routine" | "operations" | "resources" | "base"

export type ScriptTaskDefinition = {
  id: string
  label: string
  description: string
  group: ScriptTaskGroup
  defaultEnabled: boolean
}

export const SCRIPT_TASKS: ScriptTaskDefinition[] = [
  { id: "credit_shopping", label: "信用商店", description: "按刷新轮次购买信用商品", group: "routine", defaultEnabled: false },
  { id: "visit_friends", label: "拜访好友", description: "访问好友并完成可领取项目", group: "routine", defaultEnabled: true },
  { id: "simple_crafting", label: "简易制作", description: "进入制作页完成简易制作", group: "routine", defaultEnabled: true },
  { id: "gear_assembly", label: "制作装备", description: "进入总控并完成装备制作", group: "routine", defaultEnabled: true },
  { id: "mail_claim", label: "邮箱领取", description: "领取邮箱内可领取奖励", group: "routine", defaultEnabled: true },
  { id: "daily_tasks", label: "每日领取", description: "领取日常任务奖励", group: "routine", defaultEnabled: true },
  { id: "protocol_pass", label: "领通行证", description: "领取通行证可领取奖励", group: "routine", defaultEnabled: true },
  { id: "event_signin", label: "签到活动", description: "处理当前活动签到奖励", group: "routine", defaultEnabled: true },
  { id: "skland_signin", label: "森空岛签到", description: "纯网络签到，不启动游戏", group: "routine", defaultEnabled: false },
  { id: "depot_claim", label: "仓储节点", description: "处理四号谷地与武陵仓储任务", group: "operations", defaultEnabled: false },
  { id: "material_dispatch", label: "物资售卖", description: "扫描库存并按价格策略出售", group: "operations", defaultEnabled: false },
  { id: "outpost_trade", label: "据点交易", description: "自动派驻、选品与出售", group: "operations", defaultEnabled: false },
  { id: "stamina_clear", label: "刷体力", description: "按关卡队列消耗理智", group: "resources", defaultEnabled: false },
  { id: "voucher_spend", label: "调度券消费", description: "按星期与地区购买物资", group: "resources", defaultEnabled: false },
  { id: "shift_rotation", label: "基建任务", description: "完整帝江号收菜、线索与换班流程", group: "base", defaultEnabled: true },
]

export type ScriptSelection = Record<string, boolean>
export type ScriptAdvancedConfig = Record<string, any>
export type EndfieldScriptConfig = { schemaVersion: number; selection: ScriptSelection; advancedConfig: ScriptAdvancedConfig }
export const SCRIPT_SCHEMA_VERSION = 1

const LEGACY_TASK_KEYS: Record<string, string> = {
  credit_shopping: "credit", visit_friends: "friend", mail_claim: "mail",
  daily_tasks: "task", event_signin: "activity",
}

const DEFAULT_ADVANCED: ScriptAdvancedConfig = {
  depot_areas: { area_4: true, wuling: true },
  material_dispatch: {
    valley_iv: true, wuling: true, price_mode: "per_category", global_price: 4600,
    moderate_price: 4600, large_price: 5000, massive_price: 5300,
    ticket_overflow_valley_iv: 30000000, ticket_overflow_wuling: 30000000,
  },
  outpost_trade: { valley_iv: true, wuling: true, selection_strategy: "rarity", operator_auto_switch: true },
  voucher_weekdays: [false, false, false, false, true, true, true],
  voucher_areas: { area_4: true, wuling: true },
  voucher_price_mode: "maa",
  voucher_max_spend: 30000000,
  stamina_clear: {
    stage_items: [{ stage_type: "干员经验", stage_name: "干员经验", stage_level: null, max_runs: 99, enabled: true, order: 1 }],
    stage_name: "干员经验", max_runs: 99, use_potion: true, energy_enter_attempts: 3,
  },
  stamina_potion: { expire_within_days: 3, use_count: 99, max_sanity: 9999 },
  dijiang: { recovery_emotion: true, clue_keep_count: 2, send_max: 3, send_direct: true },
  schedule: { enabled: false, times_text: "4:00 12:00 20:00", cross_point_restart: true },
  game_watchdog: { game_restart_interval_s: 900, full_restart_interval_s: 3600, disable_full_restart: false },
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function object(value: unknown): Record<string, any> { return value && typeof value === "object" ? value as Record<string, any> : {} }
function bounded(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback
}

function mergeAdvanced(source: Record<string, any>): ScriptAdvancedConfig {
  // Start with the stored object so fields introduced by a newer script stay intact.
  const merged = { ...clone(source), ...clone(DEFAULT_ADVANCED) }
  for (const key of Object.keys(merged)) {
    if (Array.isArray(merged[key]) && Array.isArray(source[key])) merged[key] = source[key].map(Boolean).slice(0, 7)
    else if (typeof merged[key] === "object" && !Array.isArray(merged[key])) merged[key] = { ...merged[key], ...object(source[key]) }
    else if (source[key] !== undefined) merged[key] = source[key]
  }
  const prices = merged.material_dispatch
  prices.global_price = bounded(prices.global_price, 4600, 100, 1_000_000_000)
  prices.moderate_price = bounded(prices.moderate_price, 4600, 100, 1_000_000_000)
  prices.large_price = bounded(prices.large_price, 5000, 100, 1_000_000_000)
  prices.massive_price = bounded(prices.massive_price, 5300, 100, 1_000_000_000)
  merged.voucher_max_spend = bounded(merged.voucher_max_spend, 30000000, 0, 1_000_000_000)
  merged.dijiang.clue_keep_count = bounded(merged.dijiang.clue_keep_count, 2, 1, 2)
  merged.dijiang.send_max = bounded(merged.dijiang.send_max, 3, 0, 99)
  return merged
}

export function createScriptConfig(accountConfig: unknown): EndfieldScriptConfig {
  const root = object(accountConfig)
  const stored = object(root.script)
  const storedSelection = object(stored.selection)
  const daily = object(root.daily)
  const selection: ScriptSelection = {}
  for (const task of SCRIPT_TASKS) {
    const legacyKey = LEGACY_TASK_KEYS[task.id]
    const legacyValue = legacyKey ? daily[legacyKey] : undefined
    selection[task.id] = storedSelection[task.id] === undefined
      ? (legacyValue === undefined ? task.defaultEnabled : Boolean(legacyValue))
      : Boolean(storedSelection[task.id])
  }
  const advanced = object(stored.advancedConfig ?? stored.advanced_config)
  return { schemaVersion: SCRIPT_SCHEMA_VERSION, selection, advancedConfig: mergeAdvanced(advanced) }
}

export function scriptConfigToAccountConfig(accountConfig: unknown, script: EndfieldScriptConfig): Record<string, any> {
  const root = clone(object(accountConfig))
  const selection = { ...script.selection }
  selection.material_sell = Boolean(selection.material_dispatch)
  selection.material_stockpile = Boolean(selection.material_dispatch)
  root.script = { schemaVersion: SCRIPT_SCHEMA_VERSION, selection, advanced_config: mergeAdvanced(script.advancedConfig) }
  root.daily = {
    ...object(root.daily),
    mail: Boolean(selection.mail_claim),
    friend: Boolean(selection.visit_friends),
    credit: Boolean(selection.credit_shopping),
    task: Boolean(selection.daily_tasks),
    activity: Boolean(selection.event_signin),
  }
  return root
}

export function summarizeScriptTasks(selection: ScriptSelection): { enabled: number; total: number } {
  return { enabled: SCRIPT_TASKS.filter((task) => selection[task.id]).length, total: SCRIPT_TASKS.length }
}
