export type TaskGroup = "routine" | "operations" | "resources" | "base"

export type TaskDefinition = {
  id: string
  label: string
  description: string
  group: TaskGroup
  defaultEnabled: boolean
}

export const SCRIPT_TASKS: TaskDefinition[] = [
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
  { id: "material_dispatch", label: "弹性售卖", description: "按价格策略出售高价物资", group: "operations", defaultEnabled: false },
  { id: "outpost_trade", label: "据点交易", description: "自动派驻、选品与出售", group: "operations", defaultEnabled: false },
  { id: "stamina_clear", label: "刷体力", description: "按关卡队列消耗理智", group: "resources", defaultEnabled: false },
  { id: "voucher_spend", label: "弹性购买", description: "按星期与地区购买物资", group: "resources", defaultEnabled: false },
  { id: "stable_stockpile", label: "稳定购买", description: "购买稳定需求物资", group: "resources", defaultEnabled: false },
  { id: "shift_rotation", label: "基建任务", description: "帝江号收菜、线索与换班", group: "base", defaultEnabled: true },
]

export const STAMINA_TYPES = ["干员经验", "干员进阶", "钱币收集", "技能提升", "武器经验", "武器进阶", "危境预演", "能量淤积点"]
export const STAMINA_LEVELS: Record<string, string[]> = {
  "干员经验": ["自动选关", "作战记录3A", "作战记录3B", "作战记录4A", "作战记录4B", "作战记录5A", "作战记录5B", "作战记录54321A", "作战记录54321B"],
  "干员进阶": ["自动选关", "协议圆盘3A", "协议圆盘3B", "协议圆盘4A", "协议圆盘4B", "协议圆盘5A", "协议圆盘5B", "协议圆盘54321A", "协议圆盘54321B"],
  "钱币收集": ["自动选关", "折金券1", "折金券2", "折金券3", "折金券4", "折金券5", "折金券54321"],
  "技能提升": ["自动选关", "协议棱柱3A", "协议棱柱3B", "协议棱柱4A", "协议棱柱4B", "协议棱柱5A", "协议棱柱5B", "协议棱柱54321A", "协议棱柱54321B"],
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

const OUTPOST_OPTIONS = {
  valley_iv: ["无", "精选柑实罐头", "精选荞愈胶囊", "高容谷地电池", "中容谷地电池", "优质柑实罐头", "优质荞愈胶囊", "低容谷地电池", "柑实罐头", "荞愈胶囊", "钢制零件", "紫晶质瓶", "铁制零件", "晶体外壳", "紫晶零件"],
  wuling: ["无", "灼铜零件", "中容武陵电池", "赫铜零件", "低容武陵电池", "优质锦草软饮", "优质芽针针剂", "重息壤", "锦草软饮", "芽针针剂", "赤铜零件", "分离芯", "息壤"],
} as const

export const SCRIPT_SCHEMA_VERSION = 1
export type ScriptConfig = {
  schemaVersion: number
  selection: Record<string, boolean>
  advanced_config: Record<string, any>
}

const boolArray = (values: unknown, fallback: boolean[]) => Array.isArray(values) && values.length === 7 ? values.map(Boolean) : [...fallback]
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {}
const number = (value: unknown, fallback: number, min = -Infinity, max = Infinity) => {
  const next = Number(value)
  return Number.isFinite(next) ? Math.min(max, Math.max(min, Math.round(next))) : fallback
}

function defaultStableArea(key: keyof typeof STABLE_CATALOG) {
  const items: Record<string, boolean> = {}
  for (const [slug, , enabled] of STABLE_CATALOG[key].items) items[slug] = enabled
  return { enabled: true, reserve: 24, only_discount: true, min_discount: null, limits: { engraving_permit: 20, food_buff: 20, detector_compass: 20, artificing_catalyst: 20, gifts: 20 }, items }
}

export function createDefaultScriptConfig(): ScriptConfig {
  const selection: Record<string, boolean> = {}
  for (const task of SCRIPT_TASKS) selection[task.id] = task.defaultEnabled
  // Diagnostics stay opt-in; they are script-compatible fields but not part of
  // the normal user workflow and can add storage/processing overhead.
  selection.remote_debug = false
  selection.annotated_debug = false
  selection.detailed_log = false
  selection.developer_mode = false
  selection.hotupdate_auto_apply = false
  const rounds = [80, 120, 160, 200].map((cost, index) => ({ cost, mode: index === 2 ? "fallback" : "off" }))
  return {
    schemaVersion: SCRIPT_SCHEMA_VERSION,
    selection,
    advanced_config: {
      voucher_weekdays: [false, false, false, false, true, true, true],
      voucher_areas: { area_4: true, wuling: true }, voucher_price_mode: "maa", voucher_max_spend: 1000,
      stable_weekdays: [true, true, true, true, true, true, true], login_weekdays: [true, true, true, true, true, true, true],
      stable_stockpile: { valley_iv: defaultStableArea("valley_iv"), wuling: defaultStableArea("wuling") },
      depot_areas: { area_4: true, wuling: true }, depot_pack_cargo_select_item: false, depot_pack_cargo_only: false, depot_accept_job_only: false,
      depot_locations: { originium_science_park: true, origin_lodespring: true, power_plateau: true, wuling_city: true, test_area: true },
      depot_pack_item_valley: "sandleaf_powder", depot_pack_item_wuling: "sandleaf_powder",
      credit_refresh_rounds: rounds, credit_reserve: 150,
      dijiang: { recovery_emotion: true, clue_keep_count: 2, send_max: 3, send_direct: true },
      material_dispatch: { valley_iv: true, wuling: true, price_mode: "per_category", global_price: 4600, moderate_price: 4600, large_price: 5000, massive_price: 5300, ticket_overflow_valley_iv: 30000000, ticket_overflow_wuling: 30000000, stockpile_server_time: 8, stockpile_allow_data_upload: true },
      outpost_trade: { valley_iv: true, wuling: true, selection_strategy: "rarity", priority_enabled: false, only_preferred: false, operator_auto_switch: true, priority_valley_iv: ["无", "无", "无", "无", "无", "无"], priority_wuling: ["无", "无", "无", "无", "无", "无"], reserve_rules: {} },
      stamina_clear: { stage_items: [{ stage_type: "干员经验", stage_name: "干员经验", stage_level: null, max_runs: 999, enabled: true, order: 1 }], stage_name: "干员经验", stage_level: null, max_runs: 999, use_potion: true, energy_enter_attempts: 5 },
      stamina_potion: { expire_within_days: 3, use_count: 99, max_sanity: 9999 }, growth: { prefer_targets: [], block_targets: [], auto_extract_seed: false },
      remote_yolo: { enabled: false, base_url: "https://yoloapi.102818.xyz/v1/detect", timeout_ms: 1200, jpeg_quality: 70 },
      skland: { server: "cn", token: "", phone: "", password: "" },
      schedule: { enabled: false, times_text: "4:00 12:00 20:00", cross_point_restart: true },
      game_watchdog: { game_restart_interval_s: 900, full_restart_interval_s: 3600, disable_full_restart: false },
      log_report: { enabled: true, write_local: true, max_time_min: 15, max_lines: 1000 },
    },
  }
}

export function normalizeScriptConfig(raw: unknown): ScriptConfig {
  const defaults = createDefaultScriptConfig()
  const root = object(raw)
  const nested = object(root.script)
  const sourceSelection = object(root.selection ?? nested.selection)
  const sourceAdvanced = object(root.advanced_config ?? root.advancedConfig ?? nested.advanced_config ?? nested.advancedConfig)
  const selection = { ...defaults.selection, ...sourceSelection }
  // Older profiles used material_sell/material_stockpile and base_harvest.
  // Keep those payloads readable while presenting one canonical task name in
  // the console and sending the key expected by the current dispatcher.
  if (sourceSelection.material_dispatch === undefined) {
    const legacyMaterial = sourceSelection.material_sell ?? sourceSelection.material_stockpile
    if (legacyMaterial !== undefined) selection.material_dispatch = Boolean(legacyMaterial)
  }
  if (sourceSelection.shift_rotation === undefined && sourceSelection.base_harvest !== undefined) {
    selection.shift_rotation = Boolean(sourceSelection.base_harvest)
  }
  selection.material_sell = selection.material_dispatch
  selection.material_stockpile = selection.material_dispatch
  selection.base_harvest = selection.shift_rotation
  const advanced: Record<string, any> = { ...defaults.advanced_config, ...sourceAdvanced }
  for (const key of Object.keys(defaults.advanced_config)) {
    if (defaults.advanced_config[key] && typeof defaults.advanced_config[key] === "object" && !Array.isArray(defaults.advanced_config[key])) {
      advanced[key] = { ...defaults.advanced_config[key], ...object(sourceAdvanced[key]) }
    }
  }
  advanced.voucher_weekdays = boolArray(sourceAdvanced.voucher_weekdays, defaults.advanced_config.voucher_weekdays)
  advanced.stable_weekdays = boolArray(sourceAdvanced.stable_weekdays, defaults.advanced_config.stable_weekdays)
  advanced.login_weekdays = boolArray(sourceAdvanced.login_weekdays, defaults.advanced_config.login_weekdays)
  advanced.credit_refresh_rounds = [0, 1, 2, 3].map((index) => ({ ...defaults.advanced_config.credit_refresh_rounds[index], ...((sourceAdvanced.credit_refresh_rounds as any[])?.[index] || {}) }))
  advanced.stamina_clear = { ...defaults.advanced_config.stamina_clear, ...object(sourceAdvanced.stamina_clear) }
  advanced.stamina_clear.stage_items = Array.isArray(sourceAdvanced.stamina_clear?.stage_items) && sourceAdvanced.stamina_clear.stage_items.length > 0 ? sourceAdvanced.stamina_clear.stage_items : defaults.advanced_config.stamina_clear.stage_items
  advanced.stamina_clear.stage_items = advanced.stamina_clear.stage_items.slice(0, 8)
  advanced.stamina_clear.energy_enter_attempts = number(sourceAdvanced.stamina_clear?.energy_enter_attempts, defaults.advanced_config.stamina_clear.energy_enter_attempts, 1, 5)
  advanced.stamina_potion = { ...defaults.advanced_config.stamina_potion, ...object(sourceAdvanced.stamina_potion) }
  advanced.material_dispatch = { ...defaults.advanced_config.material_dispatch, ...object(sourceAdvanced.material_dispatch) }
  advanced.dijiang = { ...defaults.advanced_config.dijiang, ...object(sourceAdvanced.dijiang) }
  advanced.outpost_trade = { ...defaults.advanced_config.outpost_trade, ...object(sourceAdvanced.outpost_trade) }
  advanced.outpost_trade.priority_valley_iv = Array.isArray(sourceAdvanced.outpost_trade?.priority_valley_iv) ? sourceAdvanced.outpost_trade.priority_valley_iv.slice(0, 6) : [...defaults.advanced_config.outpost_trade.priority_valley_iv]
  advanced.outpost_trade.priority_wuling = Array.isArray(sourceAdvanced.outpost_trade?.priority_wuling) ? sourceAdvanced.outpost_trade.priority_wuling.slice(0, 6) : [...defaults.advanced_config.outpost_trade.priority_wuling]
  const reserveRules = object(sourceAdvanced.outpost_trade?.reserve_rules)
  advanced.outpost_trade.reserve_rules = Object.fromEntries(Object.entries(reserveRules).filter(([, value]) => typeof value === "number" && Number.isFinite(value)))
  advanced.remote_yolo = { ...defaults.advanced_config.remote_yolo, ...object(sourceAdvanced.remote_yolo) }
  advanced.skland = { ...defaults.advanced_config.skland, ...object(sourceAdvanced.skland) }
  advanced.schedule = { ...defaults.advanced_config.schedule, ...object(sourceAdvanced.schedule) }
  advanced.game_watchdog = { ...defaults.advanced_config.game_watchdog, ...object(sourceAdvanced.game_watchdog) }
  advanced.log_report = { ...defaults.advanced_config.log_report, ...object(sourceAdvanced.log_report) }
  advanced.stable_stockpile = { ...defaults.advanced_config.stable_stockpile, ...object(sourceAdvanced.stable_stockpile) }
  for (const key of ["valley_iv", "wuling"] as const) advanced.stable_stockpile[key] = { ...defaults.advanced_config.stable_stockpile[key], ...object(sourceAdvanced.stable_stockpile?.[key]) }
  return { schemaVersion: SCRIPT_SCHEMA_VERSION, selection, advanced_config: advanced }
}

export function enabledTaskCount(config: ScriptConfig) {
  return SCRIPT_TASKS.filter((task) => config.selection[task.id]).length
}

export const OUTPOST_PRIORITY_OPTIONS_BY_AREA = OUTPOST_OPTIONS

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
