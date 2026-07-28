export type DashboardOverallStatus = "HEALTHY" | "WARNING" | "CRITICAL"
export type DashboardAlertSeverity = "WARNING" | "CRITICAL"
export type DashboardDeviceState = "IDLE" | "BUSY" | "SUSPENDED" | "OFFLINE"
export type DashboardLoginFilter = "all" | "missing"
export type DashboardTaskTab = "pending" | "inProgress" | "exception"
export type DashboardDeviceFilter = "all" | "idle" | "busy" | "suspended" | "offline"
export type DashboardScheduledTaskFilter = "ALL" | "ABNORMAL" | "RUNNING" | "DISABLED"

export interface DashboardMissingAccountItem {
  accountId: number
  name: string
  dispatchMode: string
  nextScheduledAt: string | null
  currentTaskState: string
}

export interface DashboardTaskItem {
  assignmentId: string | null
  accountId: number
  name: string
  taskMode: string | null
  dispatchSource: string | null
  deviceName: string | null
  assignedAt: string | null
  runningMinutes: number
  lastProgressTitle: string | null
  leaseExpiresAt: string | null
  urgent: boolean
}

export interface DashboardDeviceItem {
  deviceId: number
  name: string
  tokenSuffix: string
  runtimeState: DashboardDeviceState
  lastHeartbeatAt: string | null
  offlineSince: string | null
  suspendedUntil: string | null
  currentAccountId: number | null
  currentAccountName: string | null
}

export interface DashboardScheduledTaskItem {
  key: string
  name: string
  status: string
  lastSuccessAt: string | null
  lastFailureAt: string | null
  nextRunAt: string | null
  consecutiveFailures: number
  lastError: string | null
}

export interface DashboardAlertItem {
  type: string
  severity: DashboardAlertSeverity
  title: string
  detail: string | null
  since: string | null
  href: string
}

export interface AdminDashboardOverview {
  generatedAt: string
  timeZone: "Asia/Shanghai"
  gameDay: string
  gameDayStartedAt: string
  overallStatus: DashboardOverallStatus
  alertCount: number
  accounts: {
    eligibleDaily: number
    loggedToday: number
    missingLogin: number
    loginRate: number
    frozen: number
    coolingDown: number
    expiringWithinSevenDays: number
    missingItems: DashboardMissingAccountItem[]
  }
  tasks: {
    urgent: number
    pending: number
    inProgress: number
    scheduledWaiting: number
    scheduledRunning: number
    longRunning: number
    runningItems: DashboardTaskItem[]
    priorityWaitingItems: DashboardTaskItem[]
  }
  devices: {
    total: number
    online: number
    idle: number
    busy: number
    offline: number
    suspended: number
    items: DashboardDeviceItem[]
  }
  scheduledTasks: {
    total: number
    healthy: number
    running: number
    abnormal: number
    waiting: number
    disabled: number
    abnormalItems: DashboardScheduledTaskItem[]
  }
  business: {
    newAccountsToday: number
    validAccounts: number
    dayIncome: number
    monthIncome: number
  }
  alerts: DashboardAlertItem[]
}

interface StatusMeta {
  label: string
  className: string
}

const OVERALL_STATUS_META: Record<DashboardOverallStatus, StatusMeta> = {
  HEALTHY: { label: "运行正常", className: "text-emerald-700 dark:text-emerald-300" },
  WARNING: { label: "需要关注", className: "text-amber-700 dark:text-amber-300" },
  CRITICAL: { label: "严重异常", className: "text-red-700 dark:text-red-300" },
}

const DEVICE_STATUS_META: Record<DashboardDeviceState, StatusMeta> = {
  IDLE: { label: "空闲", className: "text-emerald-700 dark:text-emerald-300" },
  BUSY: { label: "忙碌", className: "text-blue-700 dark:text-blue-300" },
  SUSPENDED: { label: "暂停", className: "text-amber-700 dark:text-amber-300" },
  OFFLINE: { label: "离线", className: "text-red-700 dark:text-red-300" },
}

export function getOverallStatusMeta(status: string): StatusMeta {
  return OVERALL_STATUS_META[status as DashboardOverallStatus] || OVERALL_STATUS_META.WARNING
}

export function getDeviceStatusMeta(status: string): StatusMeta {
  return DEVICE_STATUS_META[status as DashboardDeviceState] || DEVICE_STATUS_META.OFFLINE
}

export function formatDashboardTime(value: string | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace("T", " ")
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date)
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.month}/${byType.day} ${byType.hour}:${byType.minute}`
}

export function formatGameDay(value: string | null | undefined): string {
  if (!value) return "-"
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[2]}/${match[3]}` : value
}

export function formatRunningMinutes(minutes: number | null | undefined): string {
  const safeMinutes = Math.max(0, Math.floor(minutes || 0))
  if (safeMinutes < 60) return `${safeMinutes} 分钟`
  const hours = Math.floor(safeMinutes / 60)
  const remainder = safeMinutes % 60
  return remainder === 0 ? `${hours} 小时` : `${hours} 小时 ${remainder} 分`
}

export function clampRate(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10
}

export function parseLoginFilter(value: string | null | undefined): DashboardLoginFilter {
  return value === "missing" ? "missing" : "all"
}

export function parseTaskTab(value: string | null | undefined): DashboardTaskTab {
  return value === "inProgress" || value === "exception" || value === "pending" ? value : "pending"
}

export function parseDeviceState(value: string | null | undefined): DashboardDeviceFilter {
  return value === "idle" || value === "busy" || value === "suspended" || value === "offline" ? value : "all"
}

export function parseScheduledTaskFilter(value: string | null | undefined): DashboardScheduledTaskFilter {
  return value === "ABNORMAL" || value === "RUNNING" || value === "DISABLED" ? value : "ALL"
}

export function shouldStartDashboardRefresh(state: { visible: boolean; inFlight: boolean }): boolean {
  return state.visible && !state.inFlight
}

export function replaceSearchParam(
  current: URLSearchParams,
  key: string,
  value: string | null,
  defaultValue?: string,
): string {
  const next = new URLSearchParams(current.toString())
  if (!value || value === defaultValue) next.delete(key)
  else next.set(key, value)
  return next.toString()
}
