"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Activity, Archive, Bot, Check, ChevronRight, Code2, Database, Factory, Gauge, Home as HomeIcon, LayoutDashboard, LockKeyhole, LogOut, MapPinned, PanelLeftClose, PanelLeftOpen, PackageSearch, Play, Radio, RefreshCw, Save, Send, Settings2, ShieldCheck, ShoppingBag, Store, TicketCheck, Users, Wrench, Zap } from "lucide-react"
import { api, clearToken, getToken, saveToken } from "@/lib/api"
import { createDefaultScriptConfig, enabledTaskCount, normalizeScriptConfig, OUTPOST_PRIORITY_OPTIONS_BY_AREA, OUTPOST_RESERVE_ITEM_IDS, OUTPOST_RESERVE_ITEM_OPTIONS, OUTPOST_RESERVE_MODES, SCRIPT_TASKS, STABLE_CATALOG, STAMINA_LEVELS, STAMINA_TYPES, type ScriptConfig, type TaskGroup } from "@/lib/script-config"

type User = { id: number; account: string; displayName: string; gameName?: string | null; server: number; expiresAt: string; frozen?: boolean }
type Device = { id: number; name: string; version?: string; status: string; lastHeartbeat?: string }
type Task = { id: number; taskType: string; status: string; createdAt?: string }
type PanelId = "home" | "tasks" | "operations" | "resources" | "base" | "json"

const PANEL_META: Array<{ id: PanelId; label: string; note: string; icon: typeof LayoutDashboard }> = [
  { id: "home", label: "首页", note: "账号与任务概览", icon: HomeIcon },
  { id: "tasks", label: "任务队列", note: "脚本执行顺序", icon: LayoutDashboard },
  { id: "operations", label: "仓储与交易", note: "仓储、信用、据点、售卖", icon: PackageSearch },
  { id: "resources", label: "体力与购买", note: "刷体力、弹性、稳定物资", icon: Zap },
  { id: "base", label: "基建", note: "帝江号与培养舱", icon: Factory },
  { id: "json", label: "原始配置", note: "查看或导入完整 JSON", icon: Code2 },
]

const GROUP_META: Record<TaskGroup, { label: string; note: string }> = {
  routine: { label: "日常领取", note: "登录游戏后按脚本顺序执行" },
  operations: { label: "仓储与交易", note: "需要进入总控或仓储页面" },
  resources: { label: "资源管理", note: "体力与物资购买" },
  base: { label: "基建", note: "帝江号完整流程" },
}

const ICONS = { credit_shopping: ShoppingBag, visit_friends: Users, simple_crafting: Wrench, gear_assembly: Wrench, mail_claim: Archive, daily_tasks: Check, protocol_pass: TicketCheck, event_signin: Check, skland_signin: Radio, depot_claim: Store, material_dispatch: PackageSearch, outpost_trade: MapPinned, stamina_clear: Zap, voucher_spend: TicketCheck, stable_stockpile: Archive, shift_rotation: Factory } as const
const REMEMBER_CREDENTIALS_KEY = "endfield_remember_credentials"
const SAVED_ACCOUNT_KEY = "endfield_saved_account"
const SAVED_PASSWORD_KEY = "endfield_saved_password"

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
  return <label className="toggle-row"><span><strong>{label}</strong>{hint && <small>{hint}</small>}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><span /></span></label>
}

function Field({ label, value, onChange, type = "text", hint, min, max, step, name, autoComplete }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; hint?: string; min?: number; max?: number; step?: number; name?: string; autoComplete?: string }) {
  return <label className="field"><span>{label}</span><input name={name} autoComplete={autoComplete} type={type} value={value ?? ""} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>
}

function SelectField({ label, value, options, onChange, hint }: { label: string; value: string; options: string[]; onChange: (value: string) => void; hint?: string }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{hint && <small>{hint}</small>}</label>
}

function maskAccount(account: string) {
  if (!account) return "未命名账号"
  const at = account.indexOf("@")
  if (at <= 0) return account.length > 4 ? `${account.slice(0, 2)}****${account.slice(-2)}` : account
  const local = account.slice(0, at)
  return `${local.slice(0, Math.min(2, local.length))}****${account.slice(at)}`
}

function userLabel(user: Pick<User, "account" | "displayName" | "gameName">) {
  const gameName = user.gameName?.trim()
  if (gameName) return gameName
  const displayName = user.displayName?.trim()
  if (displayName && displayName !== user.account && !displayName.includes("@")) return displayName
  return maskAccount(user.account)
}

function Section({ title, description, icon: Icon, children }: { title: string; description: string; icon: typeof Settings2; children: React.ReactNode }) {
  return <section className="settings-section"><header className="section-heading"><span className="section-icon"><Icon size={17} /></span><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>
}

function DayPicker({ value, onChange }: { value: boolean[]; onChange: (value: boolean[]) => void }) {
  return <div className="day-picker">{["一", "二", "三", "四", "五", "六", "日"].map((day, index) => <button type="button" key={day} className={value[index] ? "day active" : "day"} onClick={() => { const next = [...value]; next[index] = !next[index]; onChange(next) }} aria-pressed={value[index]}>周{day}</button>)}</div>
}

function TaskQueue({ config, onSelectionChange, onLoginDaysChange, saving }: { config: ScriptConfig; onSelectionChange: (id: string, enabled: boolean) => void; onLoginDaysChange: (value: boolean[]) => void; saving: boolean }) {
  const grouped = (Object.keys(GROUP_META) as TaskGroup[]).map((group) => ({ group, tasks: SCRIPT_TASKS.filter((task) => task.group === group) }))
  return <div className="task-queue"><section className="task-group"><div className="group-heading"><div><h2>上号时间</h2><p>只在勾选的星期启动每日任务</p></div><span>执行日</span></div><DayPicker value={config.advanced_config.login_weekdays || []} onChange={onLoginDaysChange} /></section>{grouped.map(({ group, tasks }) => <section className="task-group" key={group}><div className="group-heading"><div><h2>{GROUP_META[group].label}</h2><p>{GROUP_META[group].note}</p></div><span>{tasks.filter((task) => config.selection[task.id]).length}/{tasks.length}</span></div><div className="task-list">{tasks.map((task) => { const Icon = ICONS[task.id as keyof typeof ICONS]; const enabled = Boolean(config.selection[task.id]); return <label className={enabled ? "task-row enabled" : "task-row"} key={task.id}><input type="checkbox" checked={enabled} onChange={(event) => onSelectionChange(task.id, event.target.checked)} disabled={saving} /><span className="task-check"><Check size={13} /></span><span className="task-icon"><Icon size={16} /></span><span className="task-copy"><strong>{task.label}</strong><small>{task.description}</small></span><ChevronRight className="task-arrow" size={15} /></label> })}</div></section>)}</div>
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [config, setConfig] = useState<ScriptConfig>(createDefaultScriptConfig)
  const [panel, setPanel] = useState<PanelId>("home")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rawJson, setRawJson] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [account, setAccount] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [sdk, setSdk] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [rememberCredentials, setRememberCredentials] = useState(false)
  const [busy, setBusy] = useState(false)
  const [savedJson, setSavedJson] = useState("")

  const updateAdvanced = (key: string, patch: Record<string, unknown>) => setConfig((current) => ({ ...current, advanced_config: { ...current.advanced_config, [key]: { ...(current.advanced_config[key] || {}), ...patch } } }))
  const updateAdvancedValue = (key: string, value: unknown) => setConfig((current) => ({ ...current, advanced_config: { ...current.advanced_config, [key]: value } }))
  const advanced = config.advanced_config
  const dirty = JSON.stringify(config) !== savedJson
  const enabledCount = useMemo(() => enabledTaskCount(config), [config])

  const loadDashboard = async (activeToken: string) => {
    // The public server still exposes the legacy user endpoints, so keep the
    // console compatible with that contract instead of calling missing /me routes.
    const [accountResult, statusResult] = await Promise.all([api<any>("/showMyAccount", {}, activeToken), api<any>("/showMyStatus", {}, activeToken)])
    const accountData = accountResult || {}
    const nextUser: User = {
      id: Number(accountData.id || accountData.accountId || 0),
      account: String(accountData.account || accountData.username || ""),
      displayName: String(accountData.displayName || accountData.name || ""),
      gameName: accountData.gameName || null,
      server: Number(accountData.server || 0),
      expiresAt: String(accountData.expiresAt || accountData.expireTime || ""),
      frozen: Boolean(accountData.frozen || accountData.isFrozen),
    }
    setUser(nextUser)
    const statusData = statusResult || {}
    setDevices(statusData ? [{ id: nextUser.id, name: "账号状态", version: statusData.version || "", status: String(statusData.status || statusData.state || "ONLINE"), lastHeartbeat: statusData.lastHeartbeat }] : [])
    setTasks([])
    let next = createDefaultScriptConfig()
    if (accountData?.config) {
      try { next = normalizeScriptConfig(typeof accountData.config === "string" ? JSON.parse(accountData.config) : accountData.config) }
      catch { setNotice("已读取配置文本，但格式无法解析，当前显示默认配置") }
    }
    setConfig(next); setSavedJson(JSON.stringify(next)); setRawJson(JSON.stringify(next, null, 2))
  }

  useEffect(() => { const stored = getToken(); if (!stored) return; setToken(stored); loadDashboard(stored).catch(() => { clearToken(); setToken(null) }) }, [])
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_CREDENTIALS_KEY) === "1"
    setRememberCredentials(remembered)
    if (remembered) {
      setAccount(localStorage.getItem(SAVED_ACCOUNT_KEY) || "")
      setPassword(localStorage.getItem(SAVED_PASSWORD_KEY) || "")
    }
  }, [])

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("")
    try {
      const endpoint = authMode === "login" ? "/userLogin" : "/auth/register"
      const body = authMode === "login"
        ? { account: account.trim(), password }
        : { account: account.trim(), displayName: displayName.trim(), password, server: 0, sdk: sdk.trim(), verificationCode: verificationCode.trim() }
      const data = await api<{ token: string; account: string }>(endpoint, { method: "POST", body: JSON.stringify(body) })
      saveToken(data.token)
      if (authMode === "login" && rememberCredentials) {
        localStorage.setItem(REMEMBER_CREDENTIALS_KEY, "1")
        localStorage.setItem(SAVED_ACCOUNT_KEY, account.trim())
        // Explicit product requirement: remember the password in plaintext on this browser.
        localStorage.setItem(SAVED_PASSWORD_KEY, password)
      } else if (authMode === "login") {
        localStorage.removeItem(REMEMBER_CREDENTIALS_KEY)
        localStorage.removeItem(SAVED_ACCOUNT_KEY)
        localStorage.removeItem(SAVED_PASSWORD_KEY)
      }
      setToken(data.token); await loadDashboard(data.token)
    } catch (err) { setError(err instanceof Error ? err.message : "登录失败") } finally { setBusy(false) }
  }

  const saveConfig = async () => {
    if (!token) return
    setBusy(true); setError("")
    try { const serialized = JSON.stringify(config); await api("/updateMyAccount", { method: "POST", body: JSON.stringify({ config, active: true }) }, token); setSavedJson(serialized); setRawJson(JSON.stringify(config, null, 2)); setNotice("配置已保存，提交任务后由设备领取") }
    catch (err) { setError(err instanceof Error ? err.message : "配置保存失败") } finally { setBusy(false) }
  }

  const enqueueTask = async () => {
    if (!token) return
    setBusy(true); setError("")
    try { await api("/startNow", { method: "POST" }, token); setTasks((current) => [{ id: Date.now(), taskType: "daily", status: "QUEUED", createdAt: new Date().toISOString() }, ...current]); setNotice("每日任务已加入队列") }
    catch (err) { setError(err instanceof Error ? err.message : "任务提交失败") } finally { setBusy(false) }
  }

  const freezeAccount = async () => {
    if (!token || !user || user.frozen || !window.confirm("冻结后将无法登录此账号，确定继续吗？")) return
    setBusy(true); setError("")
    try { const next = await api<User>("/me/freeze", { method: "POST" }, token); setUser(next); setNotice("账号已冻结") }
    catch (err) { setError(err instanceof Error ? err.message : "账号冻结失败") } finally { setBusy(false) }
  }

  const importJson = () => { try { const parsed = normalizeScriptConfig(JSON.parse(rawJson)); setConfig(parsed); setRawJson(JSON.stringify(parsed, null, 2)); setNotice("原始配置已应用到表单"); setError("") } catch { setError("JSON 格式不正确，未应用任何修改") } }
  const serverLabel = user?.server === 1 ? "B服" : "官服"
  const activePanel = PANEL_META.find((item) => item.id === panel)

  if (!token || !user) return <main className="auth"><section className="auth-panel"><div className="brand"><span className="brand-mark brand-avatar-wrap"><img src="/login-avatar.png" alt="终末地控制台" className="brand-avatar" /></span><span>终末地控制台</span></div><div className="auth-kicker">独立云控节点 / ENDFIELD</div><h1>{authMode === "login" ? "登录控制台" : "创建账号"}</h1><p>{authMode === "login" ? "查看账号状态、定位任务并处理设备。" : "填写注册凭据后创建新的云控账号。"}</p><form onSubmit={submitAuth}><Field label="账号" name="account" autoComplete="username" value={account} onChange={setAccount} />{authMode === "register" && <><Field label="显示名称" name="displayName" autoComplete="nickname" value={displayName} onChange={setDisplayName} /><Field label="SDK" name="sdk" autoComplete="off" value={sdk} onChange={setSdk} /><Field label="验证码" name="verificationCode" autoComplete="one-time-code" value={verificationCode} onChange={setVerificationCode} /></>}<Field label="密码" name="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} type="password" value={password} onChange={setPassword} />{authMode === "login" && <label className="remember-row" title="勾选后此浏览器会在本地保存账号和明文密码"><input type="checkbox" checked={rememberCredentials} onChange={(event) => { const checked = event.target.checked; setRememberCredentials(checked); if (!checked) { localStorage.removeItem(REMEMBER_CREDENTIALS_KEY); localStorage.removeItem(SAVED_ACCOUNT_KEY); localStorage.removeItem(SAVED_PASSWORD_KEY) } }} /><span>记住账号和密码</span></label>}{error && <div className="error">{error}</div>}<button className="button primary wide" disabled={busy}>{busy ? "处理中..." : authMode === "login" ? "登录" : "创建账号"}<ChevronRight size={16} /></button></form><div className="auth-switch">{authMode === "login" ? "还没有账号？" : "已有账号？"}<button type="button" className="link" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError("") }}>{authMode === "login" ? "创建账号" : "返回登录"}</button></div></section></main>

  return <div className={sidebarCollapsed ? "shell sidebar-collapsed" : "shell"}>
    <header className="topbar"><div className="brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span>终末地控制台</span><span className="brand-divider" /><span className="brand-context">任务编排</span></div><div className="top-actions"><span className="account-chip"><span className="online-dot" />{userLabel(user)}<small>{serverLabel}</small></span><button type="button" className="button ghost" onClick={() => { clearToken(); setToken(null); setUser(null) }}><LogOut size={15} />退出</button></div></header>
    <div className="workbench"><aside className="sidebar"><div className="sidebar-top"><div className="sidebar-label">工作台</div><button type="button" className="sidebar-toggle" title={sidebarCollapsed ? "展开侧栏" : "收起侧栏"} aria-label={sidebarCollapsed ? "展开侧栏" : "收起侧栏"} onClick={() => setSidebarCollapsed((current) => !current)}>{sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button></div>{PANEL_META.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} title={sidebarCollapsed ? item.label : undefined} aria-label={item.label} className={panel === item.id ? "nav-item active" : "nav-item"} onClick={() => setPanel(item.id)}><Icon size={17} /><span><strong>{item.label}</strong><small>{item.note}</small></span><ChevronRight size={14} /></button> })}<div className="sidebar-footer"><span className="online-dot" />设备通道正常<small>配置保存在云端</small></div></aside>
      <main className="main"><div className="page-head"><div><div className="eyebrow"><Activity size={14} /> CLOUD CONTROL / {serverLabel}</div><h1>{activePanel?.label || "首页"}</h1><p>{panel === "home" ? "从这里查看账号状态并开始下一轮任务。" : panel === "tasks" ? `以脚本真实配置为准，当前启用 ${enabledCount}/${SCRIPT_TASKS.length} 项任务。` : activePanel?.note}</p></div>{panel !== "home" && <div className="head-actions"><button className="button outline" onClick={() => { setConfig(normalizeScriptConfig(JSON.parse(savedJson || JSON.stringify(config)))); setNotice("已恢复最近保存的配置") }} disabled={busy || !dirty}><RefreshCw size={15} />撤销修改</button><button className="button primary" onClick={saveConfig} disabled={busy || !dirty}><Save size={15} />{busy ? "保存中" : "保存配置"}</button></div>}</div>
        {(error || notice) && <div className={error ? "notice error" : "notice success"}>{error || notice}</div>}
        {panel !== "home" && <div className="status-strip"><div><span className="strip-label">当前角色</span><strong>{userLabel(user)}</strong></div><div><span className="strip-label">已选任务</span><strong>{enabledCount} 项</strong></div><div><span className="strip-label">设备</span><strong>{devices.filter((device) => device.status === "ONLINE").length}/{devices.length || 0} 在线</strong></div><div className="strip-action"><button className="button secondary" onClick={enqueueTask} disabled={busy}><Send size={15} />提交每日任务</button></div></div>}
        {panel === "home" && <HomePanel user={user} devices={devices} tasks={tasks} onRun={enqueueTask} onFreeze={freezeAccount} busy={busy} />}
        {panel === "tasks" && <TaskQueue config={config} onSelectionChange={(id, enabled) => setConfig((current) => ({ ...current, selection: { ...current.selection, [id]: enabled } }))} onLoginDaysChange={(value) => updateAdvancedValue("login_weekdays", value)} saving={busy} />}
        {panel === "operations" && <OperationsPanel advanced={advanced} updateAdvanced={updateAdvanced} updateAdvancedValue={updateAdvancedValue} />}
        {panel === "resources" && <ResourcesPanel advanced={advanced} updateAdvanced={updateAdvanced} updateAdvancedValue={updateAdvancedValue} />}
        {panel === "base" && <BasePanel advanced={advanced} updateAdvanced={updateAdvanced} updateAdvancedValue={updateAdvancedValue} />}
        {panel === "json" && <JsonPanel value={rawJson} onChange={setRawJson} onApply={importJson} />}
      </main></div>
    <footer className="save-bar"><span>{dirty ? <><span className="unsaved-dot" />有未保存的修改</> : <><Check size={14} />配置已同步</>}</span><button type="button" className="button primary" onClick={saveConfig} disabled={busy || !dirty}><Save size={14} />保存</button></footer>
  </div>
}

function HomePanel({ user, devices, tasks, onRun, onFreeze, busy }: { user: User; devices: Device[]; tasks: Task[]; onRun: () => void; onFreeze: () => void; busy: boolean }) {
  const onlineDevices = devices.filter((device) => device.status === "ONLINE").length
  return <div className="home-panel"><section className="home-hero"><div><div className="eyebrow"><Activity size={14} /> PERSONAL WORKSPACE</div><h2>{userLabel(user)}</h2><p><span className="status-pill"><span className="online-dot" />账号可用</span><span>{userLabel(user)}</span><span>{user.server === 1 ? "B服" : "官服"}</span></p></div><div className="home-metrics"><div><span>有效期至</span><strong>{user.expiresAt || "未设置"}</strong></div><div><span>设备在线</span><strong>{onlineDevices}/{devices.length}</strong></div><div><span>账号状态</span><strong className={user.frozen ? "danger-text" : "success-text"}>{user.frozen ? "已冻结" : "正常"}</strong></div></div></section><section className="home-actions"><button type="button" className="action-tile action-primary" onClick={onRun} disabled={busy || user.frozen}><span className="action-icon"><Play size={20} /></span><span><strong>立即进行</strong><small>按当前配置加入每日任务</small></span><ChevronRight size={18} /></button><button type="button" className="action-tile action-danger" onClick={onFreeze} disabled={busy || user.frozen}><span className="action-icon"><LockKeyhole size={20} /></span><span><strong>{user.frozen ? "账号已冻结" : "冻结账号"}</strong><small>{user.frozen ? "当前账号已停止登录" : "冻结后将停止账号登录"}</small></span><ChevronRight size={18} /></button></section><section className="lower-grid"><section className="surface"><div className="surface-heading"><div><h2>设备状态</h2><p>已注册设备的最近心跳</p></div><Gauge size={18} /></div>{devices.length === 0 ? <div className="empty-state">暂未绑定设备</div> : devices.map((device) => <div className="device-row" key={device.id}><span className={device.status === "ONLINE" ? "online-dot" : "offline-dot"} /><div><strong>{device.name}</strong><small>{device.version || "未提供版本"}</small></div><span className={device.status === "ONLINE" ? "state online" : "state"}>{device.status === "ONLINE" ? "在线" : "离线"}</span></div>)}</section><section className="surface"><div className="surface-heading"><div><h2>最近任务</h2><p>设备领取后会在这里更新状态</p></div><Radio size={18} /></div>{tasks.length === 0 ? <div className="empty-state">还没有提交任务</div> : tasks.slice(0, 5).map((task) => <div className="dispatch-row" key={task.id}><span className="dispatch-id">#{task.id}</span><strong>{task.taskType === "daily" ? "每日任务" : task.taskType}</strong><span className="state online">{task.status}</span></div>)}</section></section></div>
}

function OperationsPanel({ advanced, updateAdvanced, updateAdvancedValue }: { advanced: Record<string, any>; updateAdvanced: (key: string, patch: Record<string, unknown>) => void; updateAdvancedValue: (key: string, value: unknown) => void }) {
  const depot = advanced.depot_areas || {}; const locations = advanced.depot_locations || {}; const material = advanced.material_dispatch || {}; const outpost = advanced.outpost_trade || {}; const rounds = advanced.credit_refresh_rounds || []
  const reserveEntries = Object.entries(outpost.reserve_rules || {})
  const reserveRows = Array.from({ length: 6 }, (_, index) => {
    const [itemId, rawValue] = reserveEntries[index] || ["", 100]
    const label = Object.entries(OUTPOST_RESERVE_ITEM_IDS).find(([, id]) => id === itemId)?.[0] || "无"
    const numericValue = typeof rawValue === "number" && rawValue >= 0 ? rawValue : 100
    return { item: label, mode: rawValue === -1 ? "永不售出" : "保留数量", value: numericValue }
  })
  const updateReserve = (index: number, patch: Record<string, unknown>) => {
    const nextRules: Record<string, number> = {}
    reserveRows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row).forEach((row) => {
      const itemId = OUTPOST_RESERVE_ITEM_IDS[String(row.item)]
      if (itemId) nextRules[itemId] = row.mode === "永不售出" ? -1 : Math.max(0, Number(row.value) || 0)
    })
    updateAdvanced("outpost_trade", { reserve_rules: nextRules })
  }
  return <div className="panel-stack"><Section title="仓储节点" description="脚本 Tab 2：地区、装箱和送货任务范围" icon={PackageSearch}><div className="inline-grid four"><Toggle label="四号谷地" checked={depot.area_4 !== false} onChange={(value) => updateAdvanced("depot_areas", { area_4: value })} /><Toggle label="武陵" checked={depot.wuling !== false} onChange={(value) => updateAdvanced("depot_areas", { wuling: value })} /><Toggle label="装箱时选择物品" checked={advanced.depot_pack_cargo_select_item === true} onChange={(value) => updateAdvancedValue("depot_pack_cargo_select_item", value)} /><Toggle label="仅装箱不转交" checked={advanced.depot_pack_cargo_only === true} onChange={(value) => updateAdvancedValue("depot_pack_cargo_only", value)} /><Toggle label="仅接取送货任务" checked={advanced.depot_accept_job_only === true} onChange={(value) => updateAdvancedValue("depot_accept_job_only", value)} /></div><div className="subheading">仓储地点</div><div className="check-grid">{[["originium_science_park", "四号谷地 源石研究园"], ["origin_lodespring", "四号谷地 矿脉源区"], ["power_plateau", "四号谷地 供能高地"], ["wuling_city", "武陵城区"], ["test_area", "试验园区"]].map(([key, label]) => <Toggle key={key} label={label} checked={locations[key] !== false} onChange={(value) => updateAdvancedValue("depot_locations", { ...locations, [key]: value })} />)}</div><div className="two-col"><Field label="四号谷地装箱物品 ID" value={advanced.depot_pack_item_valley || "sandleaf_powder"} onChange={(value) => updateAdvancedValue("depot_pack_item_valley", value)} /><Field label="武陵装箱物品 ID" value={advanced.depot_pack_item_wuling || "sandleaf_powder"} onChange={(value) => updateAdvancedValue("depot_pack_item_wuling", value)} /></div></Section><Section title="信用商店" description="脚本 Tab 3：四轮刷新成本与保留信用" icon={ShoppingBag}><div className="credit-rounds">{rounds.map((round: any, index: number) => <div className="credit-round" key={round.cost}><strong>第 {index + 1} 轮</strong><span>{round.cost} 信用</span><div className="segmented">{["off", "95", "75", "fallback"].map((mode) => <button type="button" key={mode} className={round.mode === mode ? "selected" : ""} onClick={() => updateAdvancedValue("credit_refresh_rounds", rounds.map((item: any, i: number) => i === index ? { ...item, mode } : item))}>{mode === "off" ? "不刷新" : mode === "fallback" ? "兜底" : `${mode} 折`}</button>)}</div></div>)}</div><Field label="刷新保留信用" type="number" value={advanced.credit_reserve ?? 150} onChange={(value) => updateAdvancedValue("credit_reserve", Number(value))} min={0} /></Section><Section title="据点交易" description="脚本 Tab 7：地区、选品优先级和保留规则" icon={MapPinned}><div className="inline-grid four"><Toggle label="四号谷地" checked={outpost.valley_iv !== false} onChange={(value) => updateAdvanced("outpost_trade", { valley_iv: value })} /><Toggle label="武陵" checked={outpost.wuling !== false} onChange={(value) => updateAdvanced("outpost_trade", { wuling: value })} /><Toggle label="按单价优先" checked={outpost.selection_strategy === "price"} onChange={(value) => updateAdvanced("outpost_trade", { selection_strategy: value ? "price" : "rarity" })} /><Toggle label="自动切换联络干员" checked={outpost.operator_auto_switch !== false} onChange={(value) => updateAdvanced("outpost_trade", { operator_auto_switch: value })} /><Toggle label="启用优先货品" checked={outpost.priority_enabled === true} onChange={(value) => updateAdvanced("outpost_trade", { priority_enabled: value })} /><Toggle label="只售优先货品" checked={outpost.only_preferred === true} onChange={(value) => updateAdvanced("outpost_trade", { only_preferred: value })} /></div><div className="priority-grid">{(["valley_iv", "wuling"] as const).map((area) => <div key={area}><div className="subheading">{area === "valley_iv" ? "四号谷地" : "武陵"}优先货品</div><div className="slot-grid">{(outpost[`priority_${area}`] || []).map((item: string, index: number) => <SelectField key={`${area}-${index}`} label={`槽位 ${index + 1}`} value={item || "无"} options={[...OUTPOST_PRIORITY_OPTIONS_BY_AREA[area]]} onChange={(value) => { const next = [...(outpost[`priority_${area}`] || [])]; next[index] = value; updateAdvanced("outpost_trade", { [`priority_${area}`]: next }) }} />)}</div></div>)}</div></Section><Section title="弹性售卖" description="脚本 Tab 8：出售地区、价格档和券溢出阈值" icon={Store}><div className="inline-grid four"><Toggle label="四号谷地" checked={material.valley_iv !== false} onChange={(value) => updateAdvanced("material_dispatch", { valley_iv: value })} /><Toggle label="武陵" checked={material.wuling !== false} onChange={(value) => updateAdvanced("material_dispatch", { wuling: value })} /></div><div className="two-col"><SelectField label="价格策略" value={material.price_mode || "per_category"} options={["per_category", "global"]} onChange={(value) => updateAdvanced("material_dispatch", { price_mode: value })} /><Field label="统一阈值" type="number" value={material.global_price ?? 4600} onChange={(value) => updateAdvanced("material_dispatch", { global_price: Number(value) })} /></div><div className="three-col"><Field label="中额" type="number" value={material.moderate_price ?? 4600} onChange={(value) => updateAdvanced("material_dispatch", { moderate_price: Number(value) })} /><Field label="大额" type="number" value={material.large_price ?? 5000} onChange={(value) => updateAdvanced("material_dispatch", { large_price: Number(value) })} /><Field label="巨额" type="number" value={material.massive_price ?? 5300} onChange={(value) => updateAdvanced("material_dispatch", { massive_price: Number(value) })} /></div><div className="two-col"><Field label="四号谷地券溢出" type="number" value={material.ticket_overflow_valley_iv ?? 30000000} onChange={(value) => updateAdvanced("material_dispatch", { ticket_overflow_valley_iv: Number(value) })} /><Field label="武陵券溢出" type="number" value={material.ticket_overflow_wuling ?? 30000000} onChange={(value) => updateAdvanced("material_dispatch", { ticket_overflow_wuling: Number(value) })} /></div><div className="two-col"><Field label="服务器 UTC 偏移" type="number" value={material.stockpile_server_time ?? 8} onChange={(value) => updateAdvanced("material_dispatch", { stockpile_server_time: Number(value) })} min={-12} max={14} /><Toggle label="上报价格数据" checked={material.stockpile_allow_data_upload !== false} onChange={(value) => updateAdvanced("material_dispatch", { stockpile_allow_data_upload: value })} /></div></Section><Section title="物品保留" description="脚本 Tab 7：按物品保留数量；选择“无”表示该行不启用" icon={Store}><div className="reserve-list">{reserveRows.map((row, index) => <div className="reserve-row" key={index}><SelectField label={"物品 " + (index + 1)} value={row.item} options={OUTPOST_RESERVE_ITEM_OPTIONS} onChange={(value) => updateReserve(index, { item: value })} /><SelectField label="规则" value={row.mode} options={OUTPOST_RESERVE_MODES} onChange={(value) => updateReserve(index, { mode: value })} /><Field label="数量" type="number" value={row.value} onChange={(value) => updateReserve(index, { value: Number(value) })} min={0} /></div>)}</div></Section></div>
}

function ResourcesPanel({ advanced, updateAdvanced, updateAdvancedValue }: { advanced: Record<string, any>; updateAdvanced: (key: string, patch: Record<string, unknown>) => void; updateAdvancedValue: (key: string, value: unknown) => void }) {
  const stamina = advanced.stamina_clear || {}; const potion = advanced.stamina_potion || {}; const voucher = advanced.voucher_areas || {}; const items = Array.isArray(stamina.stage_items) ? stamina.stage_items : []
  const updateItem = (index: number, patch: Record<string, unknown>) => updateAdvanced("stamina_clear", { stage_items: items.map((item: any, i: number) => i === index ? { ...item, ...patch, stage_name: patch.stage_type || item.stage_type } : item) })
  return <div className="panel-stack"><Section title="刷体力" description="脚本 Tab 5：按队列顺序执行副本，最多 8 项" icon={Zap}><div className="stack-list">{items.map((item: any, index: number) => <div className="stamina-row" key={index}><span className="row-index">{index + 1}</span><SelectField label="副本类型" value={item.stage_type || "干员经验"} options={STAMINA_TYPES} onChange={(value) => updateItem(index, { stage_type: value, stage_level: null })} /><SelectField label="关卡" value={item.stage_level || "自动选关"} options={STAMINA_LEVELS[item.stage_type] || ["自动选关"]} onChange={(value) => updateItem(index, { stage_level: value === "自动选关" ? null : value })} /><Field label="最大次数" type="number" value={item.max_runs ?? 999} onChange={(value) => updateItem(index, { max_runs: Number(value) })} min={1} max={999} /><Toggle label="启用" checked={item.enabled !== false} onChange={(value) => updateItem(index, { enabled: value })} />{items.length > 1 && <button type="button" className="icon-button danger" onClick={() => updateAdvanced("stamina_clear", { stage_items: items.filter((_: any, i: number) => i !== index) })} aria-label={`删除第 ${index + 1} 项`}>×</button>}</div>)}</div><button type="button" className="button outline" onClick={() => updateAdvanced("stamina_clear", { stage_items: [...items, { stage_type: "干员经验", stage_name: "干员经验", stage_level: null, max_runs: 999, enabled: true, order: items.length + 1 }] })} disabled={items.length >= 8}>+ 添加刷体力配置</button><div className="two-col"><Toggle label="允许使用恢复道具" checked={stamina.use_potion !== false} onChange={(value) => updateAdvanced("stamina_clear", { use_potion: value })} /><Field label="能量淤积点最大尝试" type="number" value={stamina.energy_enter_attempts ?? 5} onChange={(value) => updateAdvanced("stamina_clear", { energy_enter_attempts: Math.max(1, Math.min(5, Number(value) || 1)) })} min={1} max={5} /></div><div className="three-col"><SelectField label="药剂有效期" value={String(potion.expire_within_days ?? 3)} options={["all", "1", "3", "7", "10"]} onChange={(value) => updateAdvanced("stamina_potion", { expire_within_days: value === "all" ? "all" : Number(value) })} /><Field label="药剂使用数量" type="number" value={potion.use_count ?? 99} onChange={(value) => updateAdvanced("stamina_potion", { use_count: Number(value) })} min={1} max={99} /><Field label="最大使用理智" type="number" value={potion.max_sanity ?? 9999} onChange={(value) => updateAdvanced("stamina_potion", { max_sanity: Number(value) })} min={1} max={9999} /></div></Section><Section title="弹性购买" description="脚本 Tab 9：按星期与地区执行调度券购买" icon={TicketCheck}><div className="subheading">执行星期</div><DayPicker value={advanced.voucher_weekdays || []} onChange={(value) => updateAdvancedValue("voucher_weekdays", value)} /><div className="inline-grid four"><Toggle label="四号谷地" checked={voucher.area_4 !== false} onChange={(value) => updateAdvanced("voucher_areas", { area_4: value })} /><Toggle label="武陵" checked={voucher.wuling !== false} onChange={(value) => updateAdvanced("voucher_areas", { wuling: value })} /></div><div className="two-col"><SelectField label="购买阈值模式" value={advanced.voucher_price_mode || "maa"} options={["maa", "custom"]} onChange={(value) => updateAdvancedValue("voucher_price_mode", value)} /><Field label="自定义单件价格上限" type="number" value={advanced.voucher_max_spend ?? 1000} onChange={(value) => updateAdvancedValue("voucher_max_spend", Number(value))} min={0} /></div></Section><StablePanel advanced={advanced} updateAdvanced={updateAdvanced} updateAdvancedValue={updateAdvancedValue} /></div>
}

function StablePanel({ advanced, updateAdvanced, updateAdvancedValue }: { advanced: Record<string, any>; updateAdvanced: (key: string, patch: Record<string, unknown>) => void; updateAdvancedValue: (key: string, value: unknown) => void }) {
  const stable = advanced.stable_stockpile || {}
  return <Section title="稳定购买" description="脚本 Tab 13：地区、折扣门槛、分类上限与商品开关" icon={Archive}><div className="subheading">执行星期</div><DayPicker value={advanced.stable_weekdays || []} onChange={(value) => updateAdvancedValue("stable_weekdays", value)} /><div className="stable-areas">{(Object.keys(STABLE_CATALOG) as Array<keyof typeof STABLE_CATALOG>).map((area) => { const source = stable[area] || {}; const limits = source.limits || {}; return <div className="stable-area" key={area}><div className="stable-area-head"><div><strong>{STABLE_CATALOG[area].label}</strong><small>稳定需求商品目录</small></div><Toggle label="启用地区" checked={source.enabled !== false} onChange={(value) => updateAdvanced("stable_stockpile", { [area]: { ...source, enabled: value } })} /></div><div className="three-col"><Field label="保留券数" type="number" value={source.reserve ?? 24} onChange={(value) => updateAdvanced("stable_stockpile", { [area]: { ...source, reserve: Number(value) } })} min={0} /><SelectField label="最低折扣" value={source.min_discount == null ? "不限" : String(source.min_discount)} options={["不限", "95", "90", "85", "80", "75", "70", "65", "50"]} onChange={(value) => updateAdvanced("stable_stockpile", { [area]: { ...source, min_discount: value === "不限" ? null : Number(value) } })} /><Toggle label="仅购买折扣商品" checked={source.only_discount !== false} onChange={(value) => updateAdvanced("stable_stockpile", { [area]: { ...source, only_discount: value } })} /></div><div className="limit-grid">{[["engraving_permit", "刻写券"], ["food_buff", "食物与药剂"], ["detector_compass", "探物器与罗盘"], ["artificing_catalyst", "精锻助剂"], ["gifts", "礼物"]].map(([key, label]) => <Field key={key} label={`每类上限 · ${label}`} type="number" value={limits[key] ?? 20} onChange={(value) => updateAdvanced("stable_stockpile", { [area]: { ...source, limits: { ...limits, [key]: Number(value) } } })} min={0} />)}</div><div className="product-grid">{STABLE_CATALOG[area].items.map(([slug, label, defaultEnabled]) => <label className="product-item" key={slug}><input type="checkbox" checked={source.items?.[slug] ?? defaultEnabled} onChange={(event) => updateAdvanced("stable_stockpile", { [area]: { ...source, items: { ...(source.items || {}), [slug]: event.target.checked } } })} /><span>{label}</span></label>)}</div></div> })}</div></Section>
}

function BasePanel({ advanced, updateAdvanced }: { advanced: Record<string, any>; updateAdvanced: (key: string, patch: Record<string, unknown>) => void; updateAdvancedValue: (key: string, value: unknown) => void }) {
  const dijiang = advanced.dijiang || {}; const growth = advanced.growth || {}
  return <div className="panel-stack"><Section title="帝江号基建" description="脚本基建链：收菜、线索、心情恢复与换班" icon={Factory}><div className="two-col"><Field label="每种线索保留数量" type="number" value={dijiang.clue_keep_count ?? 2} onChange={(value) => updateAdvanced("dijiang", { clue_keep_count: Number(value) })} min={1} max={2} /><Field label="最多赠予线索次数" type="number" value={dijiang.send_max ?? 3} onChange={(value) => updateAdvanced("dijiang", { send_max: Number(value) })} min={0} max={99} /></div><div className="inline-grid four"><Toggle label="直接赠予线索" checked={dijiang.send_direct !== false} onChange={(value) => updateAdvanced("dijiang", { send_direct: value })} /><Toggle label="执行心情恢复与换班" checked={dijiang.recovery_emotion !== false} onChange={(value) => updateAdvanced("dijiang", { recovery_emotion: value })} /></div></Section><Section title="培养舱" description="脚本 Tab 6：种子优先级和缺料处理" icon={Bot}><Field label="优先种子" value={Array.isArray(growth.prefer_targets) ? growth.prefer_targets.join(" ") : ""} onChange={(value) => updateAdvanced("growth", { prefer_targets: value.split(/[\s,，、]+/).filter(Boolean) })} hint="多个名称用空格或逗号分隔" /><Field label="禁止种子" value={Array.isArray(growth.block_targets) ? growth.block_targets.join(" ") : ""} onChange={(value) => updateAdvanced("growth", { block_targets: value.split(/[\s,，、]+/).filter(Boolean) })} hint="必须使用脚本种子白名单中的名称" /><Toggle label="缺料时自动提取基核" checked={growth.auto_extract_seed === true} onChange={(value) => updateAdvanced("growth", { auto_extract_seed: value })} /></Section></div>
}

function JsonPanel({ value, onChange, onApply }: { value: string; onChange: (value: string) => void; onApply: () => void }) {
  return <Section title="原始配置 JSON" description="这里看到的是发送给设备的完整 selection + advanced_config；适合迁移或排查字段" icon={Database}><textarea className="json-editor" value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} /><div className="section-actions"><button type="button" className="button outline" onClick={onApply}><Code2 size={15} />应用 JSON</button></div></Section>
}
