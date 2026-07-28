export type AccountDispatchMode = "AUTO" | "SCHEDULED"

export interface AccountDispatchConfigPayload {
  dispatchMode: AccountDispatchMode
  scheduleTimes: string[]
}

export interface ActiveWeekday {
  enable?: boolean
}

export interface DispatchValidationErrors {
  scheduleTimes?: string
  active?: string
}

const TASK_TYPE_LABELS: Record<string, string> = {
  daily: "日常任务",
  rogue: "肉鸽任务",
  rogue2: "肉鸽任务",
  sand_fire: "生息演算",
}

const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  NOT_RUN: "未运行",
  WAITING: "等待中",
  RUNNING: "运行中",
  RETRY_WAIT: "重试中",
  NORMAL: "正常",
  FAILED: "失败",
}

export function normalizeScheduleTime(value: string | null | undefined): string {
  const match = value?.trim().match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/)
  return match ? match[1] + ":" + match[2] : ""
}

export function normalizeScheduleTimes(
  values: readonly (string | null | undefined)[] | null | undefined,
  legacyValue?: string | null,
): string[] {
  const source = values?.length ? values : [legacyValue]
  return source
    .map(normalizeScheduleTime)
    .filter((value): value is string => value.length > 0)
    .sort((left, right) => left.localeCompare(right))
}

export function replaceScheduleTimeAt(
  values: readonly string[],
  index: number,
  value: string,
): string[] {
  return values.map((time, itemIndex) => (itemIndex === index ? value : time))
}

export function getScheduleStatusLabel(status: string | null | undefined): string {
  if (!status) return SCHEDULE_STATUS_LABELS.NOT_RUN
  return SCHEDULE_STATUS_LABELS[status] || "未知"
}

export function formatNextScheduledAt(value: string | null | undefined): string {
  const match = value?.trim().match(/^\d{4}-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  return match ? `${match[1]}月${match[2]}日 ${match[3]}:${match[4]}` : "待调度"
}

export function formatAccountTaskType({
  taskType,
  dispatchMode,
  scheduleTimes,
  scheduleTime,
  scheduleStatus,
}: {
  taskType: string
  dispatchMode: string | null | undefined
  scheduleTimes?: readonly (string | null | undefined)[] | null
  scheduleTime: string | null | undefined
  scheduleStatus: string | null | undefined
}): string {
  if (dispatchMode === "SCHEDULED") {
    const times = normalizeScheduleTimes(scheduleTimes, scheduleTime)
    return "定时任务 / " + (times.join("、") || "--:--") + " / " + getScheduleStatusLabel(scheduleStatus)
  }
  return TASK_TYPE_LABELS[taskType] || taskType
}

export function buildDispatchConfigPayload(
  dispatchMode: AccountDispatchMode,
  scheduleTimes: readonly (string | null | undefined)[],
): AccountDispatchConfigPayload {
  return {
    dispatchMode,
    scheduleTimes: dispatchMode === "SCHEDULED" ? normalizeScheduleTimes(scheduleTimes) : [],
  }
}

export function validateDispatchConfig(
  dispatchMode: AccountDispatchMode,
  scheduleTimes: readonly (string | null | undefined)[],
  active: Record<string, ActiveWeekday> | null | undefined,
): DispatchValidationErrors {
  if (dispatchMode !== "SCHEDULED") return {}

  const errors: DispatchValidationErrors = {}
  if (scheduleTimes.length === 0) {
    errors.scheduleTimes = "至少设置 1 个运行时间"
  } else if (scheduleTimes.length > 3) {
    errors.scheduleTimes = "最多设置 3 个运行时间"
  } else {
    const normalized = scheduleTimes.map(normalizeScheduleTime)
    if (normalized.some((time) => !time)) {
      errors.scheduleTimes = "请填写有效运行时间"
    } else if (new Set(normalized).size !== normalized.length) {
      errors.scheduleTimes = "运行时间不能重复"
    }
  }
  if (!Object.values(active || {}).some((day) => day?.enable === true)) {
    errors.active = "至少选择一个活跃星期"
  }
  return errors
}
