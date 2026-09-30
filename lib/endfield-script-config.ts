export type ScriptTaskGroup = "routine" | "operations" | "resources" | "base"

export type ScriptTaskDefinition = {
  id: string
  label: string
  description: string
  group: ScriptTaskGroup
  defaultEnabled: boolean
}

// 任务队列对齐脚本 Tab1「任务」页 TASKS 列表（core/task_ui.lua）。
export const SCRIPT_TASKS: ScriptTaskDefinition[] = [
  { id: "credit_shopping", label: "信用商店", description: "按刷新轮次购买信用商品", group: "routine", defaultEnabled: false },
  { id: "visit_friends", label: "拜访好友", description: "访问好友并完成可领取项目", group: "routine", defaultEnabled: true },
  { id: "simple_crafting", label: "简易制作", description: "进入制作页完成简易制作", group: "routine", defaultEnabled: true },
  { id: "gear_assembly", label: "制作装备", description: "进入总控并完成装备制作", group: "routine", defaultEnabled: true },
  { id: "mail_claim", label: "邮箱领取", description: "领取邮箱内可领取奖励", group: "routine", defaultEnabled: true },
  { id: "daily_tasks", label: "每日领取", description: "领取日常任务奖励", group: "routine", defaultEnabled: true },
  { id: "depot_claim", label: "仓储节点", description: "处理四号谷地与武陵仓储", group: "operations", defaultEnabled: false },
  { id: "material_dispatch", label: "弹性售卖", description: "扫描库存并按价格策略出售", group: "operations", defaultEnabled: false },
  { id: "outpost_trade", label: "据点交易", description: "自动派驻、选品与出售", group: "operations", defaultEnabled: false },
  { id: "protocol_pass", label: "领通行证", description: "领取通行证可领取奖励", group: "routine", defaultEnabled: true },
  { id: "event_signin", label: "签到活动", description: "处理当前活动签到奖励", group: "routine", defaultEnabled: true },
  { id: "skland_signin", label: "森空岛签到", description: "纯网络签到，不启动游戏", group: "routine", defaultEnabled: false },
  { id: "stamina_clear", label: "刷体力", description: "按关卡队列消耗理智", group: "resources", defaultEnabled: false },
  { id: "voucher_spend", label: "弹性购买", description: "按星期与地区购买物资", group: "resources", defaultEnabled: false },
  { id: "stable_stockpile", label: "稳定购买", description: "购买稳定需求物资", group: "resources", defaultEnabled: false },
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

// ===== 脚本白名单目录（与 core/task_ui.lua、tasks/purchase_stable.lua 对齐） =====

export const STAMINA_TYPE_NONE = "（不启用）"
export const STAMINA_TYPES = ["干员经验", "干员进阶", "钱币收集", "技能提升", "武器经验", "武器进阶", "危境预演", "能量淤积点"]
export const STAMINA_CARD_LIMIT = 8
export const STAMINA_LEVELS: Record<string, string[]> = {
  "干员经验": ["自动选关", "作战记录3A", "作战记录3B", "作战记录4A", "作战记录4B", "作战记录5A", "作战记录5B", "作战记录54321A", "作战记录54321B"],
  "干员进阶": ["自动选关", "协议圆盘3A", "协议圆盘3B", "协议圆盘4A", "协议圆盘4B", "协议圆盘5A", "协议圆盘5B", "协议圆盘54321A", "协议圆盘54321B"],
  "钱币收集": ["自动选关", "折金券1", "折金券2", "折金券3", "折金券4", "折金券5", "折金券54321"],
  "技能提升": ["自动选关", "协议棱柱3A", "协议棱柱3B", "协议棱柱4A", "协议棱柱5A", "协议棱柱5B", "协议棱柱54321A", "协议棱柱54321B"],
  "武器经验": ["自动选关", "武器检查1", "武器检查2", "武器检查3", "武器检查4", "武器检查5", "武器检查54321"],
  "武器进阶": ["自动选关", "强固模组3A", "强固模组3B", "强固模组4A", "强固模组4B", "强固模组5A", "强固模组5B", "强固模组54321A", "强固模组54321B"],
  "危境预演": ["自动选关", "高阶培养1", "高阶培养2", "高阶培养3", "高阶培养4", "高阶培养5", "高阶培养54321"],
  "能量淤积点": ["自动选关", "枢纽区", "清波寨"],
}

export const STABLE_CATALOG = {
  valley_iv: {
    label: "四号谷地",
    items: [
      ["valley_engraving_permit", "谷地刻写券", false], ["kunst_tube", "附术铁瓶", false], ["jakubs_legacy", "雅各布的遗产", false],
      ["pulled_slug_meat", "手撕虫肉", false], ["hazefyre_blossom", "雾火之花", false], ["cartilage_tack", "软骨饼干", false],
      ["cosmo_melto_jelly", "星融果冻", false], ["keen_valley_detector", "新锐谷地探物器", true], ["keen_valley_compass", "新锐谷地罗盘", true],
      ["breeze_of_kjersch", "耶尔什微风", false], ["tidestone_specimen", "浪潮海石", false], ["simonch_shawl", "塞梦珂披巾", false],
      ["frontiers_watch", "《前沿瞭望》", false], ["aurylene_camera", "醚质相机", false], ["cosmic_gate_puzzle", "星门锁", false], ["surfing_festival_ticket", "冲浪大赛门票", false],
    ],
  },
  wuling: {
    label: "武陵",
    items: [
      ["wuling_engraving_permit", "武陵刻写券", false], ["fortifying_infusion", "正本补元汤剂", false], ["garden_fried_rice", "锦素炒饭", false],
      ["master_pans_egg_pudding", "潘师傅蛋羹", false], ["echoing_remedy", "回响秘剂", false], ["rind_flavored_sprouts", "陈皮拌笋", false],
      ["stonehold_remedy", "蓄石秘剂", false], ["ruin_purger_remedy", "洗灾秘剂", false], ["sear_toasted_liver", "香焗兽肝", false],
      ["wuling_artificing_catalyst", "武陵精锻助剂", true], ["keen_wuling_detector", "新锐武陵探物器", true], ["keen_wuling_compass", "新锐武陵罗盘", true],
      ["wuling_talosite_probe", "武陵塔晶探针", false], ["eureka_teabox", "岳研茶盒", false], ["yinglung_dumbbells", "应龙哑铃", false],
      ["woven_aggelos", "草编天使", false], ["scrimshaw_of_the_pack", "狼群骨雕", false], ["fin_n_chips", "炸鳞薯条", false],
      ["bizarro_cupcake", "怪味纸杯蛋糕", false], ["chubby_lung_fangxing_memorabilia", "龙泡泡·方兴纪念", false], ["fowlbeast_paper_kite", "羽兽剪纸风筝", false],
      ["swinging_gentleman_classical_album", "《摇摆绅士古典特辑》", false], ["myrkwood_berry_preserve", "黑森林浆果酱", false], ["miracle_cake", "奇迹蛋糕", false],
    ],
  },
} as const

export const OUTPOST_PRIORITY_OPTIONS_BY_AREA = {
  valley_iv: ["无", "精选柑实罐头", "精选荞愈胶囊", "高容谷地电池", "中容谷地电池", "优质柑实罐头", "优质荞愈胶囊", "低容谷地电池", "柑实罐头", "荞愈胶囊", "钢制零件", "紫晶质瓶", "铁制零件", "晶体外壳", "紫晶零件"],
  wuling: ["无", "灼铜零件", "中容武陵电池", "赫铜零件", "低容武陵电池", "优质锦草软饮", "优质芽针针剂", "重息壤", "锦草软饮", "芽针针剂", "赤铜零件", "分离芯", "息壤"],
} as const

export const OUTPOST_RESERVE_ITEM_OPTIONS = [
  "无", "精选柑实罐头", "精选荞愈胶囊", "高容谷地电池", "灼铜零件",
  "中容武陵电池", "赫铜零件", "低容武陵电池", "优质锦草软饮", "优质芽针针剂",
  "中容谷地电池", "优质柑实罐头", "优质荞愈胶囊", "重息壤", "低容谷地电池",
  "锦草软饮", "芽针针剂", "柑实罐头", "荞愈胶囊", "钢制零件", "赤铜零件",
  "分离芯", "紫晶质瓶", "铁制零件", "晶体外壳", "紫晶零件", "息壤",
]

export const OUTPOST_RESERVE_MODES = ["保留数量", "永不售出"]

export const OUTPOST_RESERVE_ITEM_IDS: Record<string, string> = {
  "精选柑实罐头": "item_bottled_food_3", "精选荞愈胶囊": "item_bottled_rec_hp_3", "高容谷地电池": "item_proc_battery_3", "灼铜零件": "item_copper_enr2_cmpt",
  "中容武陵电池": "item_proc_battery_5", "赫铜零件": "item_copper_enr_cmpt", "低容武陵电池": "item_proc_battery_4", "优质锦草软饮": "item_bottled_food_5",
  "优质芽针针剂": "item_bottled_rec_hp_5", "中容谷地电池": "item_proc_battery_2", "优质柑实罐头": "item_bottled_food_2", "优质荞愈胶囊": "item_bottled_rec_hp_2",
  "重息壤": "item_xiranite_enr_powder", "低容谷地电池": "item_proc_battery_1", "锦草软饮": "item_bottled_food_4", "芽针针剂": "item_bottled_rec_hp_4",
  "柑实罐头": "item_bottled_food_1", "荞愈胶囊": "item_bottled_rec_hp_1", "钢制零件": "item_iron_enr_cmpt", "赤铜零件": "item_copper_cmpt",
  "分离芯": "item_filter_core", "紫晶质瓶": "item_glass_bottle", "铁制零件": "item_iron_cmpt", "晶体外壳": "item_crystal_shell",
  "紫晶零件": "item_glass_cmpt", "息壤": "item_xiranite_powder",
}

export const CREDIT_REFRESH_COSTS = [80, 120, 160, 200]
export const CREDIT_ROUND_MODES = [
  { value: "off", label: "不刷新" },
  { value: "95", label: "95折" },
  { value: "75", label: "75折" },
  { value: "fallback", label: "兜底" },
]
export const STABLE_DISCOUNT_TIERS = ["不限", "95", "90", "85", "80", "75", "70", "65", "50"]

const WEEKDAY_KEYS = ["login_weekdays", "voucher_weekdays", "stable_weekdays"]
const ALL_WEEKDAYS = [true, true, true, true, true, true, true]
const VOUCHER_DEFAULT_WEEKDAYS = [false, false, false, false, true, true, true]

function defaultStableArea(key: keyof typeof STABLE_CATALOG) {
  const items: Record<string, boolean> = {}
  for (const [slug, , enabled] of STABLE_CATALOG[key].items) items[slug] = enabled
  return { enabled: true, reserve: 24, only_discount: true, min_discount: null, limits: { engraving_permit: 20, food_buff: 20, detector_compass: 20, artificing_catalyst: 20, gifts: 20 }, items }
}

const DEFAULT_ADVANCED: ScriptAdvancedConfig = {
  login_weekdays: [...ALL_WEEKDAYS],
  depot_areas: { area_4: true, wuling: true },
  depot_pack_cargo_select_item: false,
  depot_pack_cargo_only: false,
  depot_accept_job_only: false,
  depot_locations: { originium_science_park: true, origin_lodespring: true, power_plateau: true, wuling_city: true, test_area: true },
  depot_pack_item_valley: "sandleaf_powder",
  depot_pack_item_wuling: "sandleaf_powder",
  credit_refresh_rounds: CREDIT_REFRESH_COSTS.map((cost, index) => ({ cost, mode: index === 2 ? "fallback" : "off" })),
  credit_reserve: 150,
  stamina_clear: {
    stage_items: [
      { stage_type: "钱币收集", stage_name: "钱币收集", stage_level: "折金券54321", max_runs: 99, enabled: true, order: 1 },
      { stage_type: "干员经验", stage_name: "干员经验", stage_level: "作战记录54321B", max_runs: 99, enabled: true, order: 2 },
      { stage_type: "干员进阶", stage_name: "干员进阶", stage_level: "协议圆盘54321B", max_runs: 99, enabled: true, order: 3 },
      { stage_type: "技能提升", stage_name: "技能提升", stage_level: "协议棱柱54321B", max_runs: 99, enabled: true, order: 4 },
    ],
    stage_name: "钱币收集", max_runs: 99, use_potion: true, energy_enter_attempts: 5,
  },
  stamina_potion: { expire_within_days: 3, use_count: 99, max_sanity: 9999 },
  growth: { prefer_targets: [], block_targets: [], auto_extract_seed: false },
  dijiang: { recovery_emotion: true, clue_keep_count: 2, send_max: 3, send_direct: true },
  outpost_trade: {
    valley_iv: true, wuling: true, selection_strategy: "rarity",
    priority_enabled: false, only_preferred: false, operator_auto_switch: true,
    priority_valley_iv: ["无", "无", "无", "无", "无", "无"],
    priority_wuling: ["无", "无", "无", "无", "无", "无"],
    reserve_rules: {},
  },
  material_dispatch: {
    valley_iv: true, wuling: true, price_mode: "per_category",
    global_price: 4600, moderate_price: 4600, large_price: 5000, massive_price: 5300,
    ticket_overflow_valley_iv: 30000000, ticket_overflow_wuling: 30000000,
    stockpile_server_time: 8, stockpile_allow_data_upload: true,
  },
  voucher_weekdays: [...VOUCHER_DEFAULT_WEEKDAYS],
  voucher_areas: { area_4: true, wuling: true },
  voucher_price_mode: "maa",
  voucher_max_spend: 1000,
  stable_weekdays: [...ALL_WEEKDAYS],
  stable_stockpile: { valley_iv: defaultStableArea("valley_iv"), wuling: defaultStableArea("wuling") },
  // schedule / game_watchdog：脚本仍会读取（config.lua 有同名兜底默认）。
  // 配置页按用户要求不暴露，这里保留默认值随保存下发，执行行为与脚本端一致。
  schedule: { enabled: false, times_text: "4:00 12:00 20:00", cross_point_restart: true },
  game_watchdog: { game_restart_interval_s: 900, full_restart_interval_s: 3600, disable_full_restart: false },
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function object(value: unknown): Record<string, any> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {} }
function bounded(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback
}
function boolArray(value: unknown, fallback: boolean[]): boolean[] {
  return Array.isArray(value) && value.length === 7 ? value.map(Boolean) : [...fallback]
}

function mergeAdvanced(source: Record<string, any>): ScriptAdvancedConfig {
  const defaults = clone(DEFAULT_ADVANCED)
  // 已存配置优先，默认只补空缺，脚本新增字段不会覆盖用户已存值。
  const merged: ScriptAdvancedConfig = { ...defaults, ...clone(object(source)) }
  for (const key of Object.keys(defaults)) {
    if (WEEKDAY_KEYS.includes(key)) merged[key] = boolArray(source[key], defaults[key])
    else if (typeof defaults[key] === "object" && !Array.isArray(defaults[key])) merged[key] = { ...defaults[key], ...object(source[key]) }
    else if (Array.isArray(defaults[key]) && !Array.isArray(source[key])) merged[key] = clone(defaults[key])
    else if (source[key] !== undefined && source[key] !== null) merged[key] = source[key]
  }

  merged.credit_refresh_rounds = [0, 1, 2, 3].map((index) => {
    const stored = (Array.isArray(source.credit_refresh_rounds) && object(source.credit_refresh_rounds[index])) || {}
    const mode = ["off", "95", "75", "fallback"].includes(stored.mode) ? stored.mode : (index === 2 ? "fallback" : "off")
    return { cost: CREDIT_REFRESH_COSTS[index], mode }
  })
  merged.credit_reserve = bounded(source.credit_reserve, 150, 0, 1_000_000_000)

  // 刷体力关卡队列：保留脚本卡片字段（类型/关卡/次数/启用），最多 8 张。
  const storedStamina = object(source.stamina_clear)
  const stamina = { ...clone(DEFAULT_ADVANCED.stamina_clear), ...object(storedStamina) } as any
  const storedItems = Array.isArray(storedStamina.stage_items) ? storedStamina.stage_items : []
  stamina.stage_items = (storedItems.length > 0 ? storedItems : stamina.stage_items).slice(0, STAMINA_CARD_LIMIT).map((item: any, index: number) => {
    const card = object(item)
    const stageType = typeof card.stage_type === "string" && card.stage_type !== "" ? card.stage_type : (typeof card.stage_name === "string" && card.stage_name !== "" ? card.stage_name : "干员经验")
    return {
      stage_type: stageType,
      stage_name: stageType,
      stage_level: typeof card.stage_level === "string" && card.stage_level !== "" ? card.stage_level : null,
      max_runs: bounded(card.max_runs, 99, 1, 9999),
      enabled: (card.enabled === undefined ? true : Boolean(card.enabled)) && stageType !== STAMINA_TYPE_NONE,
      order: index + 1,
    }
  })
  if (stamina.stage_items.length === 0) stamina.stage_items = clone(DEFAULT_ADVANCED.stamina_clear.stage_items)
  stamina.use_potion = stamina.use_potion !== false
  stamina.energy_enter_attempts = bounded(storedStamina.energy_enter_attempts, 5, 1, 5)
  merged.stamina_clear = stamina

  const potion = { ...clone(DEFAULT_ADVANCED.stamina_potion), ...object(source.stamina_potion) }
  const expiry = potion.expire_within_days
  potion.expire_within_days = expiry === "all" || [1, 3, 7, 10].includes(Number(expiry)) ? expiry : 3
  potion.use_count = bounded(potion.use_count, 99, 1, 99)
  potion.max_sanity = bounded(potion.max_sanity, 9999, 1, 9999)
  merged.stamina_potion = potion

  const growth = { ...clone(DEFAULT_ADVANCED.growth), ...object(source.growth) }
  growth.prefer_targets = Array.isArray(growth.prefer_targets) ? growth.prefer_targets.map(String) : []
  growth.block_targets = Array.isArray(growth.block_targets) ? growth.block_targets.map(String) : []
  growth.auto_extract_seed = growth.auto_extract_seed === true
  merged.growth = growth

  const dijiang = { ...clone(DEFAULT_ADVANCED.dijiang), ...object(source.dijiang) }
  dijiang.clue_keep_count = bounded(dijiang.clue_keep_count, 2, 1, 2)
  dijiang.send_max = bounded(dijiang.send_max, 3, 0, 99)
  merged.dijiang = dijiang

  const outpost = { ...clone(DEFAULT_ADVANCED.outpost_trade), ...object(source.outpost_trade) }
  outpost.selection_strategy = outpost.selection_strategy === "price" ? "price" : "rarity"
  for (const area of ["priority_valley_iv", "priority_wuling"] as const) {
    const fallback = clone(DEFAULT_ADVANCED.outpost_trade[area]) as string[]
    const stored = Array.isArray(outpost[area]) ? outpost[area] : null
    outpost[area] = stored
      ? Array.from({ length: 6 }, (_, index) => {
          const value = String(stored[index] ?? "无")
          return value === "" ? "无" : value
        })
      : fallback
  }
  const reserveRules = object(outpost.reserve_rules)
  const cleanedRules: Record<string, number> = {}
  const validReserveItemIds = new Set(Object.values(OUTPOST_RESERVE_ITEM_IDS))
  for (const [itemId, value] of Object.entries(reserveRules)) {
    const numeric = Number(value)
    if (validReserveItemIds.has(itemId) && Number.isFinite(numeric) && (numeric === -1 || numeric >= 0)) cleanedRules[itemId] = numeric
  }
  outpost.reserve_rules = cleanedRules
  merged.outpost_trade = outpost

  const material = { ...clone(DEFAULT_ADVANCED.material_dispatch), ...object(source.material_dispatch) }
  material.price_mode = material.price_mode === "global" ? "global" : "per_category"
  for (const key of ["global_price", "moderate_price", "large_price", "massive_price", "ticket_overflow_valley_iv", "ticket_overflow_wuling"] as const) {
    material[key] = bounded(material[key], DEFAULT_ADVANCED.material_dispatch[key], 1, 1_000_000_000)
  }
  material.stockpile_server_time = bounded(material.stockpile_server_time, 8, -12, 14)
  material.stockpile_allow_data_upload = material.stockpile_allow_data_upload !== false
  merged.material_dispatch = material

  merged.voucher_price_mode = merged.voucher_price_mode === "custom" ? "custom" : "maa"
  merged.voucher_max_spend = bounded(merged.voucher_max_spend, 1000, 1, 1_000_000_000)

  const stable = { ...clone(DEFAULT_ADVANCED.stable_stockpile), ...object(source.stable_stockpile) }
  for (const key of ["valley_iv", "wuling"] as const) {
    const fallback = clone(DEFAULT_ADVANCED.stable_stockpile[key])
    const storedArea = object(source.stable_stockpile?.[key])
    const area: any = { ...fallback, ...storedArea }
    area.enabled = area.enabled !== false
    area.reserve = bounded(storedArea.reserve, fallback.reserve, 0, 1_000_000_000)
    area.only_discount = area.only_discount !== false
    const tier = Number(area.min_discount)
    area.min_discount = [95, 90, 85, 80, 75, 70, 65, 50].includes(tier) ? tier : null
    const limits = { ...fallback.limits, ...object(storedArea.limits) }
    for (const limitKey of Object.keys(fallback.limits)) limits[limitKey] = bounded(limits[limitKey], 20, 0, 1_000_000_000)
    area.limits = limits
    const items: Record<string, boolean> = {}
    for (const [slug, , enabled] of STABLE_CATALOG[key].items) items[slug] = storedArea.items?.[slug] === undefined ? enabled : Boolean(storedArea.items[slug])
    area.items = items
    stable[key] = area
  }
  merged.stable_stockpile = stable

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
