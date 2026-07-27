export interface TaskBoardSummary {
  urgent: number
  pending: number
  inProgress: number
  coolingDown: number
  frozen: number
}

export interface UrgentTask {
  id: number
  accountId: number
  name: string
  account: string | null
  gameDay: string
  triggerType: string
  taskMode: string
  status: string
  attemptCount: number
  nextRetryAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
  deviceToken: string | null
  assignedAt: string | null
  lastProgressTitle: string | null
}

export interface BoardAccountTask {
  id: number
  name: string
  account: string
  taskType: string
  agent: number | null
  expireTime: string | null
  returnedFromUrgent: boolean
}

export interface RunningTask {
  assignmentId: string
  accountId: number
  name: string
  account: string
  taskType: string
  taskMode: string
  urgent: boolean
  deviceName?: string | null
  deviceToken: string
  assignedAt: string | null
  runningMinutes: number
  lastProgressAt: string | null
  lastProgressTitle: string | null
  lastProgressDetail: string | null
  leaseExpiresAt: string | null
}

export interface CooldownTask {
  id: number
  name: string
  account: string
  until: string
  reason: string
  message: string
}

export interface TaskBoardSnapshot {
  generatedAt: string
  summary: TaskBoardSummary
  urgentTasks: UrgentTask[]
  pendingTasks: BoardAccountTask[]
  runningTasks: RunningTask[]
  cooldownTasks: CooldownTask[]
  frozenTasks: BoardAccountTask[]
}

interface UrgentStatusMeta {
  label: string
  tone: "warning" | "info" | "danger" | "success" | "muted"
}

const URGENT_STATUS_META: Record<string, UrgentStatusMeta> = {
  WAITING: { label: "等待设备", tone: "warning" },
  RUNNING: { label: "正在登录", tone: "info" },
  RETRY_WAIT: { label: "重试等待", tone: "warning" },
  FAILED: { label: "等待重试", tone: "danger" },
  SUCCEEDED: { label: "登录成功", tone: "success" },
  CANCELLED: { label: "已取消", tone: "muted" },
}

export function getUrgentStatusMeta(status: string): UrgentStatusMeta {
  return URGENT_STATUS_META[status] || { label: "未知状态", tone: "muted" }
}

export function getRunningModeLabel(taskMode: string, taskType: string): string {
  if (taskMode === "LOGIN_ONLY") return "强制登录"
  if (taskType === "daily") return "完整日常"
  if (taskType === "rogue" || taskType === "rogue2") return "肉鸽"
  if (taskType === "sand_fire") return "生息演算"
  return taskType || "未知任务"
}

export function formatRunningDeviceLabel(deviceName: string | null | undefined, deviceToken: string): string {
  const normalizedName = deviceName?.trim()
  return normalizedName ? `设备${normalizedName}：${deviceToken}` : deviceToken
}

export function sortRunningTasks<T extends { urgent: boolean }>(tasks: T[]): T[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((left, right) => Number(right.task.urgent) - Number(left.task.urgent) || left.index - right.index)
    .map(({ task }) => task)
}

export function shouldShowUrgentSection(tasks: unknown[]): boolean {
  return tasks.length > 0
}

export function getBoardRefreshInterval(now: Date): number {
  const hour = now.getHours()
  return hour >= 2 && hour < 4 ? 5_000 : 15_000
}

export function formatBoardDateTime(value: string | null | undefined): string {
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
