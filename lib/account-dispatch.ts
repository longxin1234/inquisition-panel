export type AccountDispatchMode = "AUTO" | "SCHEDULED"

export interface AccountDispatchConfigPayload {
  dispatchMode: AccountDispatchMode
  scheduleTime: string | null
}

export interface ActiveWeekday {
  enable?: boolean
}

export interface DispatchValidationErrors {
  scheduleTime?: string
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

export function getScheduleStatusLabel(status: string | null | undefined): string {
  if (!status) return SCHEDULE_STATUS_LABELS.NOT_RUN
  return SCHEDULE_STATUS_LABELS[status] || "未知"
}

export function formatAccountTaskType({
  taskType,
  dispatchMode,
  scheduleTime,
  scheduleStatus,
}: {
  taskType: string
  dispatchMode: string | null | undefined
  scheduleTime: string | null | undefined
  scheduleStatus: string | null | undefined
}): string {
  if (dispatchMode === "SCHEDULED") {
    const time = normalizeScheduleTime(scheduleTime) || "--:--"
    return "定时任务 / " + time + " / " + getScheduleStatusLabel(scheduleStatus)
  }
  return TASK_TYPE_LABELS[taskType] || taskType
}

export function buildDispatchConfigPayload(
  dispatchMode: AccountDispatchMode,
  scheduleTime: string | null | undefined,
): AccountDispatchConfigPayload {
  return {
    dispatchMode,
    scheduleTime: dispatchMode === "SCHEDULED" ? normalizeScheduleTime(scheduleTime) : null,
  }
}

export function validateDispatchConfig(
  dispatchMode: AccountDispatchMode,
  scheduleTime: string | null | undefined,
  active: Record<string, ActiveWeekday> | null | undefined,
): DispatchValidationErrors {
  if (dispatchMode !== "SCHEDULED") return {}

  const errors: DispatchValidationErrors = {}
  if (!normalizeScheduleTime(scheduleTime)) {
    errors.scheduleTime = "请选择运行时间"
  }
  if (!Object.values(active || {}).some((day) => day?.enable === true)) {
    errors.active = "至少选择一个活跃星期"
  }
  return errors
}
