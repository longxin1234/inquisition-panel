export type DemoRole = "user" | "admin" | "prouser"

export const DEMO_PASSWORD = "demo1234"

export const DEMO_ACCOUNTS: Record<DemoRole, { username: string; label: string }> = {
  user: { username: "demo-user", label: "用户" },
  admin: { username: "demo-admin", label: "管理员" },
  prouser: { username: "demo-pro", label: "代理" },
}

interface DemoEnvironment {
  hostname?: string
  nodeEnv?: string
}

interface DemoTokenPayload {
  exp: number
  iat: number
  demo: true
  role: DemoRole
  sub: string
}

interface DemoApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

const DAY = 24 * 60 * 60 * 1000

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/=/g, "").replace(/[+]/g, "-").replace(/[\/]/g, "_")
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))
}

function getRuntimeEnvironment(): DemoEnvironment {
  return {
    hostname: typeof window === "undefined" ? undefined : window.location.hostname,
    nodeEnv: process.env.NODE_ENV,
  }
}

export function isLocalDemoEnvironment(environment: DemoEnvironment = getRuntimeEnvironment()): boolean {
  const hostname = environment.hostname?.toLowerCase()
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  return environment.nodeEnv !== "production" && isLocalHost
}

function createDemoToken(role: DemoRole): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: DemoTokenPayload = {
    exp: now + 7 * 24 * 60 * 60,
    iat: now,
    demo: true,
    role,
    sub: DEMO_ACCOUNTS[role].username,
  }
  return [
    encodeBase64Url(JSON.stringify({ alg: "none", typ: "JWT" })),
    encodeBase64Url(JSON.stringify(payload)),
    "local-demo",
  ].join(".")
}

function readDemoToken(token: string | null | undefined): DemoTokenPayload | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3 || parts[2] !== "local-demo") return null
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as Partial<DemoTokenPayload>
    if (
      payload.demo !== true ||
      (payload.role !== "user" && payload.role !== "admin" && payload.role !== "prouser") ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now() / 1000
    ) {
      return null
    }
    return payload as DemoTokenPayload
  } catch {
    return null
  }
}

export function isDemoToken(token: string | null | undefined, role?: DemoRole): boolean {
  const payload = readDemoToken(token)
  return Boolean(payload && (!role || payload.role === role))
}

export function authenticateDemoAccount(
  role: DemoRole,
  username: string,
  password: string,
  environment: DemoEnvironment = getRuntimeEnvironment(),
): string | null {
  if (!isLocalDemoEnvironment(environment)) return null
  const account = DEMO_ACCOUNTS[role]
  if (username.trim() !== account.username || password !== DEMO_PASSWORD) return null
  return createDemoToken(role)
}

export function isDemoModeAvailable(): boolean {
  return isLocalDemoEnvironment()
}

function iso(offsetDays = 0, hour = 10, minute = 0): string {
  const date = new Date(Date.now() + offsetDays * DAY)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function createActiveDays() {
  return {
    monday: { enable: true, detail: [] },
    tuesday: { enable: true, detail: [] },
    wednesday: { enable: true, detail: [] },
    thursday: { enable: true, detail: [] },
    friday: { enable: true, detail: [] },
    saturday: { enable: true, detail: [] },
    sunday: { enable: false, detail: [] },
  }
}

function createDemoAccount(id = 1001, name = "演示博士", account = "demo-user") {
  return {
    id,
    name,
    account,
    password: "********",
    freeze: 0,
    server: 0,
    taskType: "daily",
    config: {
      daily: {
        fight: [
          { level: "resource_01", num: 2 },
          { level: "resource_02", num: 1 },
        ],
        sanity: { drug: 1, stone: 0 },
        mail: true,
        offer: { enable: true, car: true, star4: false, star5: true, star6: true, other: false },
        friend: true,
        infrastructure: {
          harvest: true,
          shift: true,
          acceleration: true,
          communication: true,
          deputy: false,
        },
        credit: true,
        task: true,
        activity: true,
        cultivation: true,
        cultivation_plan: [],
        fight_enable: true,
        scriptSchemaVersion: 1,
      },
      rogue: {
        operator: { index: 0, num: 1, skill: 1 },
        level: 1,
        coin: 0,
        type: 0,
        skip: { coin: false, beast: false, daily: false, sensitive: false, illusion: false, survive: false },
      },
    },
    active: createActiveDays(),
    notice: {
      wxUID: { text: "", enable: false },
      qq: { text: "", enable: false },
      mail: { text: "demo@example.com", enable: true },
    },
    refresh: 3,
    san: "118/240",
    agent: null,
    createTime: iso(-45),
    updateTime: iso(0, 9, 42),
    expireTime: iso(60),
    delete: 0,
    blimitDevice: [],
  }
}

function createAdminOverview() {
  return {
    generatedAt: iso(0, 10, 12),
    timeZone: "Asia/Shanghai",
    gameDay: iso().slice(0, 10),
    gameDayStartedAt: iso(0, 4),
    overallStatus: "WARNING",
    alertCount: 2,
    accounts: {
      eligibleDaily: 128,
      loggedToday: 116,
      missingLogin: 12,
      loginRate: 90.6,
      frozen: 3,
      coolingDown: 5,
      expiringWithinSevenDays: 8,
      missingItems: [
        { accountId: 1007, name: "北境来客", dispatchMode: "自动调度", nextScheduledAt: iso(0, 11), currentTaskState: "等待设备" },
        { accountId: 1012, name: "罗德岛访客", dispatchMode: "定时执行", nextScheduledAt: iso(0, 11, 30), currentTaskState: "冷却中" },
      ],
    },
    tasks: {
      urgent: 2,
      pending: 9,
      inProgress: 4,
      scheduledWaiting: 5,
      scheduledRunning: 1,
      longRunning: 1,
      runningItems: [
        { assignmentId: "demo-run-01", accountId: 1001, name: "演示博士", taskMode: "DAILY", dispatchSource: "SCHEDULED", deviceName: "工作节点 01", assignedAt: iso(0, 9, 58), runningMinutes: 14, lastProgressTitle: "正在处理基建任务", leaseExpiresAt: iso(0, 10, 20), urgent: false },
        { assignmentId: "demo-run-02", accountId: 1003, name: "荒原旅人", taskMode: "LOGIN_ONLY", dispatchSource: "MANUAL", deviceName: "工作节点 02", assignedAt: iso(0, 10, 4), runningMinutes: 8, lastProgressTitle: "登录验证完成", leaseExpiresAt: iso(0, 10, 24), urgent: true },
      ],
      priorityWaitingItems: [
        { assignmentId: null, accountId: 1007, name: "北境来客", taskMode: "DAILY", dispatchSource: "SCHEDULED", deviceName: null, assignedAt: null, runningMinutes: 0, lastProgressTitle: "等待可用设备", leaseExpiresAt: null, urgent: true },
      ],
    },
    devices: {
      total: 6,
      online: 5,
      idle: 2,
      busy: 3,
      offline: 1,
      suspended: 0,
      items: [
        { deviceId: 1, name: "工作节点 01", tokenSuffix: "8F2A", runtimeState: "BUSY", lastHeartbeatAt: iso(0, 10, 11), offlineSince: null, suspendedUntil: null, currentAccountId: 1001, currentAccountName: "演示博士" },
        { deviceId: 2, name: "工作节点 02", tokenSuffix: "C419", runtimeState: "IDLE", lastHeartbeatAt: iso(0, 10, 11), offlineSince: null, suspendedUntil: null, currentAccountId: null, currentAccountName: null },
        { deviceId: 6, name: "备用节点", tokenSuffix: "12DE", runtimeState: "OFFLINE", lastHeartbeatAt: iso(-1, 22), offlineSince: iso(-1, 22, 6), suspendedUntil: null, currentAccountId: null, currentAccountName: null },
      ],
    },
    scheduledTasks: {
      total: 4,
      healthy: 2,
      running: 1,
      abnormal: 1,
      waiting: 0,
      disabled: 0,
      abnormalItems: [
        { key: "daily-cleanup", name: "日终清理", status: "FAILED", lastSuccessAt: iso(-1, 23), lastFailureAt: iso(0, 4, 5), nextRunAt: iso(1, 4), consecutiveFailures: 1, lastError: "演示：上次执行超时" },
      ],
    },
    business: { newAccountsToday: 7, validAccounts: 143, dayIncome: 268, monthIncome: 7840 },
    alerts: [
      { type: "MISSING_LOGIN", severity: "WARNING", title: "12 个账号尚未完成今日登录", detail: "建议先处理即将到期账号", since: iso(0, 8), href: "/admin/users?login=missing" },
      { type: "DEVICE_OFFLINE", severity: "CRITICAL", title: "备用节点已离线", detail: "最后心跳在昨晚 22:00", since: iso(-1, 22), href: "/admin/devices?state=offline" },
    ],
  }
}

function createTaskBoard() {
  return {
    generatedAt: iso(0, 10, 12),
    summary: { urgent: 2, pending: 3, inProgress: 2, coolingDown: 1, frozen: 1 },
    urgentTasks: [
      { id: 901, accountId: 1007, name: "北境来客", account: "demo-1007", gameDay: iso().slice(0, 10), triggerType: "MISSING_LOGIN", taskMode: "LOGIN_ONLY", status: "WAITING", attemptCount: 1, nextRetryAt: iso(0, 10, 30), lastError: null, createdAt: iso(0, 9), updatedAt: iso(0, 10), deviceToken: null, assignedAt: null, lastProgressTitle: "等待可用设备" },
    ],
    pendingTasks: [
      { id: 1008, name: "长夜微光", account: "demo-1008", taskType: "daily", agent: null, expireTime: iso(25), returnedFromUrgent: false, dispatchSource: "SCHEDULED", scheduledRunId: 301 },
      { id: 1011, name: "静默守望", account: "demo-1011", taskType: "daily", agent: 2, expireTime: iso(18), returnedFromUrgent: false, dispatchSource: "MANUAL", scheduledRunId: null },
    ],
    runningTasks: [
      { assignmentId: "demo-run-01", accountId: 1001, name: "演示博士", account: "demo-user", taskType: "daily", taskMode: "DAILY", urgent: false, dispatchSource: "SCHEDULED", scheduledRunId: 300, deviceName: "工作节点 01", deviceToken: "demo-device-01", assignedAt: iso(0, 9, 58), runningMinutes: 14, lastProgressAt: iso(0, 10, 10), lastProgressTitle: "正在处理基建任务", lastProgressDetail: "已完成收菜，准备换班", leaseExpiresAt: iso(0, 10, 20) },
    ],
    cooldownTasks: [
      { id: 1012, name: "罗德岛访客", account: "demo-1012", until: iso(0, 11, 15), reason: "LOGIN_LIMIT", message: "登录频率保护" },
    ],
    frozenTasks: [
      { id: 1015, name: "暂停演示", account: "demo-1015", taskType: "daily", agent: null, expireTime: iso(40), returnedFromUrgent: false },
    ],
  }
}

function createScheduledOverview() {
  return {
    serverTime: iso(0, 10, 12),
    totalCount: 4,
    healthyCount: 2,
    runningCount: 1,
    abnormalCount: 1,
    waitingCount: 0,
    disabledCount: 0,
    tasks: [
      { key: "daily-dispatch", name: "日常任务调度", description: "按账号计划分派日常任务", cron: "0 */15 * * * *", timeZone: "Asia/Shanghai", scheduleText: "每 15 分钟", status: "HEALTHY", enabled: true, lastOutcome: "SUCCESS", lastTriggerSource: "SCHEDULED", lastStartedAt: iso(0, 10), lastFinishedAt: iso(0, 10, 1), lastSuccessAt: iso(0, 10, 1), lastFailureAt: null, nextRunAt: iso(0, 10, 15), lastDurationMs: 46820, consecutiveFailures: 0, runCount: 782, lastError: null, updatedAt: iso(0, 10, 1) },
      { key: "login-recovery", name: "登录补偿", description: "补偿未完成登录的账号", cron: "0 */10 * * * *", timeZone: "Asia/Shanghai", scheduleText: "每 10 分钟", status: "RUNNING", enabled: true, lastOutcome: null, lastTriggerSource: "SCHEDULED", lastStartedAt: iso(0, 10, 10), lastFinishedAt: null, lastSuccessAt: iso(0, 10), lastFailureAt: null, nextRunAt: iso(0, 10, 20), lastDurationMs: null, consecutiveFailures: 0, runCount: 126, lastError: null, updatedAt: iso(0, 10, 10) },
      { key: "daily-cleanup", name: "日终清理", description: "汇总运行结果并清理过期锁", cron: "0 5 4 * * *", timeZone: "Asia/Shanghai", scheduleText: "每天 04:05", status: "FAILED", enabled: true, lastOutcome: "FAILED", lastTriggerSource: "SCHEDULED", lastStartedAt: iso(0, 4, 5), lastFinishedAt: iso(0, 4, 7), lastSuccessAt: iso(-1, 4, 5), lastFailureAt: iso(0, 4, 7), nextRunAt: iso(1, 4, 5), lastDurationMs: 121000, consecutiveFailures: 1, runCount: 31, lastError: "演示：清理任务超过预期时长", updatedAt: iso(0, 4, 7) },
      { key: "snapshot", name: "数据快照", description: "生成运营统计快照", cron: "0 0 * * * *", timeZone: "Asia/Shanghai", scheduleText: "每小时", status: "HEALTHY", enabled: true, lastOutcome: "SUCCESS", lastTriggerSource: "SCHEDULED", lastStartedAt: iso(0, 10), lastFinishedAt: iso(0, 10, 0), lastSuccessAt: iso(0, 10, 0), lastFailureAt: null, nextRunAt: iso(0, 11), lastDurationMs: 8400, consecutiveFailures: 0, runCount: 410, lastError: null, updatedAt: iso(0, 10, 0) },
    ],
  }
}

function createDeviceRecords() {
  return [
    { id: 1, deviceName: "工作节点 01", deviceToken: "demo-device-01", chinac: 1, region: "华东", expireTime: iso(90), delete: 0, status: 1, runtimeState: "BUSY", lastHeartbeatAt: iso(0, 10, 11), offlineSince: null, suspendedUntil: null, currentAccountId: 1001, currentAccountName: "演示博士", deviceRole: "PRIMARY" },
    { id: 2, deviceName: "工作节点 02", deviceToken: "demo-device-02", chinac: 1, region: "华南", expireTime: iso(90), delete: 0, status: 0, runtimeState: "IDLE", lastHeartbeatAt: iso(0, 10, 11), offlineSince: null, suspendedUntil: null, currentAccountId: null, currentAccountName: null, deviceRole: "PRIMARY" },
    { id: 6, deviceName: "备用节点", deviceToken: "demo-device-06", chinac: 0, region: "华北", expireTime: iso(35), delete: 0, status: 2, runtimeState: "OFFLINE", lastHeartbeatAt: iso(-1, 22), offlineSince: iso(-1, 22, 6), suspendedUntil: null, currentAccountId: null, currentAccountName: null, deviceRole: "BACKUP" },
  ]
}

function createAgentRecords() {
  return [
    { id: 21, username: "华东代理", permission: "STANDARD", balance: 1260.5, discount: 0.88, authorization: "USER_MANAGE", expireTime: iso(120), delete: 0 },
    { id: 22, username: "合作方演示", permission: "PREMIUM", balance: 486.2, discount: 0.82, authorization: "USER_MANAGE,CDK", expireTime: iso(75), delete: 0 },
  ]
}

function createSubUsers() {
  return [
    { ...createDemoAccount(2001, "代理账号 A", "agent-demo-a"), san: "182/240", agent: 21 },
    { ...createDemoAccount(2002, "代理账号 B", "agent-demo-b"), san: "64/240", agent: 21, expireTime: iso(5) },
    { ...createDemoAccount(2003, "代理账号 C", "agent-demo-c"), san: "240/240", agent: 21, expireTime: iso(18), freeze: 1 },
  ]
}

function createLogRecords() {
  return [
    { id: 501, level: "INFO", taskType: "daily", title: "日常任务完成", detail: "邮件、基建和信用商店任务已完成。", imageUrl: "", from: "工作节点 01", server: 0, name: "演示博士", account: "demo-user", password: null, time: iso(0, 9, 48), delete: 0 },
    { id: 502, level: "WARNING", taskType: "daily", title: "任务已进入重试", detail: "首次进入活动页面超时，已按策略重试。", imageUrl: "", from: "工作节点 02", server: 0, name: "长夜微光", account: "demo-1008", password: null, time: iso(0, 8, 36), delete: 0 },
    { id: 503, level: "ERROR", taskType: "daily", title: "设备连接中断", detail: "备用节点在任务开始前离线，账号已退回等待队列。", imageUrl: "", from: "备用节点", server: 1, name: "北境来客", account: "demo-1007", password: null, time: iso(-1, 22, 6), delete: 0 },
  ]
}

function createCdkRecords() {
  return [
    { id: 701, cdk: "DEMO-30D-7K4P", type: "daily", param: 30, tag: "演示活动", isAgent: 0, agent: 0, used: 0 },
    { id: 702, cdk: "DEMO-90D-2F9M", type: "daily", param: 90, tag: "合作渠道", isAgent: 1, agent: 21, used: 0 },
    { id: 703, cdk: "DEMO-30D-USED", type: "daily", param: 30, tag: "历史示例", isAgent: 0, agent: 0, used: 1 },
  ]
}

function page<T>(records: T[]): { current: number; page: number; total: number; records: T[] } {
  return { current: 1, page: records.length ? 1 : 0, total: records.length, records }
}

export function getDemoApiResponse(
  endpoint: string,
  token: string | null | undefined,
  options?: Pick<RequestInit, "method">,
): DemoApiResponse | null {
  const payload = readDemoToken(token)
  if (!payload) return null

  const path = endpoint.split("?")[0]
  const method = (options?.method || "GET").toUpperCase()
  const account = createDemoAccount()
  const subUsers = createSubUsers()

  if (path === "/getAnnouncement") {
    return { code: 200, msg: "success", data: { title: "本地演示环境", context: "当前展示的是本地模拟数据，不会向真实后端写入任何内容。" } }
  }
  if (path === "/showMyAccount") return { code: 200, msg: "success", data: account }
  if (path === "/showMyStatus") return { code: 200, msg: "success", data: { status: "等待调度", detail: "上次运行已完成" } }
  if (path === "/showMySan") return { code: 200, msg: "success", data: "118/240" }
  if (path === "/getDashboardOverview") return { code: 200, msg: "success", data: createAdminOverview() }
  if (path === "/showTaskBoard") return { code: 200, msg: "success", data: createTaskBoard() }
  if (path === "/admin/control/task-runs") return { code: 200, msg: "success", data: page(createLogRecords().slice(0, 2)) }
  if (path === "/showScheduledTaskList") return { code: 200, msg: "success", data: createScheduledOverview() }
  if (path === "/showLoadedDevice") return { code: 200, msg: "success", data: { loadDeviceList: createDeviceRecords() } }
  if (path === "/showInventoryDevice") return { code: 200, msg: "success", data: page(createDeviceRecords()) }
  if (path === "/getAllProUser") return { code: 200, msg: "success", data: page(createAgentRecords()) }
  if (path === "/showAccount" || path === "/searchAccount") {
    const records = [account, createDemoAccount(1008, "长夜微光", "demo-1008"), createDemoAccount(1012, "罗德岛访客", "demo-1012")]
    return { code: 200, msg: "success", data: page(records) }
  }
  if (path === "/admin/control/logs" || path === "/admin/control/user-logs") {
    return { code: 200, msg: "success", data: page(createLogRecords()) }
  }
  if (path === "/checkCDKByType" || path === "/checkCDKByTag" || path === "/getProUserInventoryCdk") {
    return { code: 200, msg: "success", data: { cdkList: createCdkRecords() } }
  }
  if (path === "/getProUserInfo") {
    return { code: 200, msg: "success", data: { id: 21, username: "demo-pro", balance: 1260.5, discount: 0.88, permission: "PREMIUM", expireTime: iso(120), authorization: "USER_MANAGE,CDK" } }
  }
  if (path === "/getSubUserList") return { code: 200, msg: "success", data: page(subUsers) }
  if (path === "/getRecentlyExpiredUsers") return { code: 200, msg: "success", data: subUsers.filter((item) => new Date(item.expireTime).getTime() < Date.now() + 7 * DAY) }
  if (path === "/showAccountCooldown") return { code: 200, msg: "success", data: null }

  if (method !== "GET") {
    return { code: 200, msg: "演示模式：操作已在本地模拟", data: null }
  }

  return { code: 200, msg: "演示模式：暂无更多演示数据", data: null }
}
