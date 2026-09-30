export type ScheduledTaskHealthStatus =
  | "HEALTHY"
  | "RUNNING"
  | "FAILED"
  | "MISSED"
  | "STALLED"
  | "WAITING"
  | "DISABLED"
  | "UNKNOWN"

export type ScheduledTaskFilter = "ALL" | "ABNORMAL" | "RUNNING" | "DISABLED"

export interface ScheduledTaskStatus {
  key: string
  name: string
  description: string
  cron: string
  timeZone: string
  scheduleText: string
  status: string
  enabled: boolean
  lastOutcome: string | null
  lastTriggerSource: string | null
  lastStartedAt: string | null
  lastFinishedAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  nextRunAt: string | null
  lastDurationMs: number | null
  consecutiveFailures: number
  runCount: number
  lastError: string | null
  updatedAt: string | null
}

export interface ScheduledTaskOverview {
  serverTime: string
  totalCount: number
  healthyCount: number
  runningCount: number
  abnormalCount: number
  waitingCount: number
  disabledCount: number
  tasks: ScheduledTaskStatus[]
}

interface StatusMeta {
  label: string
  tone: "success" | "info" | "danger" | "warning" | "muted"
}

const STATUS_META: Record<ScheduledTaskHealthStatus, StatusMeta> = {
  HEALTHY: { label: "正常", tone: "success" },
  RUNNING: { label: "运行中", tone: "info" },
  FAILED: { label: "执行失败", tone: "danger" },
  MISSED: { label: "错过执行", tone: "danger" },
  STALLED: { label: "疑似卡住", tone: "warning" },
  WAITING: { label: "等待首次运行", tone: "muted" },
  DISABLED: { label: "已停用", tone: "muted" },
  UNKNOWN: { label: "未知", tone: "muted" },
}

export function getTaskStatusMeta(status: string): StatusMeta {
  return STATUS_META[status as ScheduledTaskHealthStatus] || STATUS_META.UNKNOWN
}

export function isAbnormalTaskStatus(status: string): boolean {
  return status === "FAILED" || status === "MISSED" || status === "STALLED"
}

export function filterScheduledTasks<T extends { status: string }>(
  tasks: T[],
  filter: ScheduledTaskFilter,
): T[] {
  if (filter === "ABNORMAL") return tasks.filter((task) => isAbnormalTaskStatus(task.status))
  if (filter === "RUNNING") return tasks.filter((task) => task.status === "RUNNING")
  if (filter === "DISABLED") return tasks.filter((task) => task.status === "DISABLED")
  return tasks
}

export function formatDuration(milliseconds: number | null | undefined): string {
  if (milliseconds === null || milliseconds === undefined) return "-"
  if (milliseconds < 1000) return `${Math.max(0, Math.round(milliseconds))} 毫秒`
  if (milliseconds < 60_000) {
    const seconds = Math.round(milliseconds / 100) / 10
    return `${seconds} 秒`
  }
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes} 分${seconds > 0 ? ` ${seconds} 秒` : ""}`
}

export function formatTaskDateTime(value: string | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace("T", " ")
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}
