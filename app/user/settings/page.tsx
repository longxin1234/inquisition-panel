"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Bell, Gamepad2, KeyRound, Mail, MessageSquare, Server, ShieldCheck } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isSessionFailureError, isTokenValid } from "@/lib/api-config"

type NoticeChannel = { text: string; enable: boolean }
type NoticeState = { wxUID: NoticeChannel; qq: NoticeChannel; mail: NoticeChannel }
type AccountSnapshot = { config?: Record<string, any>; active?: Record<string, any>; notice?: Partial<NoticeState> }

const EMPTY_NOTICE: NoticeState = {
  wxUID: { text: "", enable: false },
  qq: { text: "", enable: false },
  mail: { text: "", enable: false },
}

function normalizeNotice(notice?: Partial<NoticeState>): NoticeState {
  return {
    wxUID: { ...EMPTY_NOTICE.wxUID, ...(notice?.wxUID || {}) },
    qq: { ...EMPTY_NOTICE.qq, ...(notice?.qq || {}) },
    mail: { ...EMPTY_NOTICE.mail, ...(notice?.mail || {}) },
  }
}

export default function UserSettings() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [cdk, setCdk] = useState("")
  const [cdkLoading, setCdkLoading] = useState(false)
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [server, setServer] = useState("0")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [accountSnapshot, setAccountSnapshot] = useState<AccountSnapshot | null>(null)
  const [notice, setNotice] = useState<NoticeState>(EMPTY_NOTICE)
  const [noticeLoading, setNoticeLoading] = useState(true)
  const [noticeSaving, setNoticeSaving] = useState(false)

  const getToken = () => contextToken || getStoredToken()

  useEffect(() => {
    const token = getToken()
    if (!token || !isTokenValid(token)) { setNoticeLoading(false); return }
    apiRequestWithAuth("/showMyAccount", token, { method: "GET" })
      .then((result) => {
        if (result.code !== 200) throw new Error(result.msg || "读取账号信息失败")
        const data = result.data as AccountSnapshot
        if (data.account !== "1654458136@qq.com") {
          try {
            window.localStorage?.removeItem("admin_switched_mode")
            window.localStorage?.removeItem("admin_return_token")
          } catch {}
        }
        setAccountSnapshot(data)
        setNotice(normalizeNotice(data.notice))
      })
      .catch((error) => {
        const isSwitchedMode = typeof window !== "undefined" && window.localStorage?.getItem("admin_switched_mode") === "user"
        if (isSwitchedMode || isSessionFailureError(error)) {
          // 管理员预览模式或未登录状态静默使用默认空配置，绝不弹出红色错误干扰用户
          return
        }
        toast({
          variant: "destructive",
          title: "通知设置加载失败",
          description: error instanceof Error ? error.message : "请稍后重试",
        })
      })
      .finally(() => setNoticeLoading(false))
  }, [contextToken, toast])

  const handleCdkActivate = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) { toast({ variant: "destructive", title: "认证失败", description: "请重新登录" }); return }
    if (!cdk.trim()) { toast({ variant: "destructive", title: "请输入授权码" }); return }
    setCdkLoading(true)
    try {
      const result = await apiRequestWithAuth("/useCDK", token, { method: "POST", body: JSON.stringify({ cdk: cdk.trim() }), headers: { "Content-Type": "application/json" } })
      if (result.code !== 200) throw new Error(result.msg || "授权码未能激活")
      toast({ variant: "success", title: "授权已更新", description: result.msg })
      setCdk("")
    } catch (error) {
      toast({ variant: "destructive", title: "激活失败", description: error instanceof Error ? error.message : "请稍后重试" })
    } finally { setCdkLoading(false) }
  }

  const handleUpdateAccount = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) { toast({ variant: "destructive", title: "认证失败", description: "请重新登录" }); return }
    if (!account.trim() || !password) { setFormError("请填写完整的游戏账号和密码"); return }
    setFormError(null)
    setUpdateLoading(true)
    try {
      const result = await apiRequestWithAuth("/updateAccountAndPassword", token, { method: "POST", body: JSON.stringify({ account: account.trim(), password, server: Number(server) }), headers: { "Content-Type": "application/json" } })
      if (result.code !== 200) throw new Error(result.msg || "账号信息未能保存")
      toast({ variant: "success", title: "游戏账号已更新", description: result.msg })
      setAccount(""); setPassword(""); setServer("0")
    } catch (error) {
      const message = error instanceof Error ? error.message : "修改失败"
      setFormError(message)
      toast({ variant: "destructive", title: "保存失败", description: message })
    } finally { setUpdateLoading(false) }
  }

  const handleSaveNotice = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token) || !accountSnapshot) { toast({ variant: "destructive", title: "认证失败", description: "请重新登录" }); return }
    setNoticeSaving(true)
    try {
      const result = await apiRequestWithAuth("/updateMyAccount", token, { method: "POST", body: JSON.stringify({ config: accountSnapshot.config || {}, active: accountSnapshot.active || {}, notice }), headers: { "Content-Type": "application/json" } })
      if (result.code !== 200) throw new Error(result.msg || "通知设置保存失败")
      setAccountSnapshot((current) => current ? { ...current, notice } : current)
      toast({ variant: "success", title: "通知设置已保存" })
    } catch (error) {
      toast({ variant: "destructive", title: "保存失败", description: error instanceof Error ? error.message : "请稍后重试" })
    } finally { setNoticeSaving(false) }
  }

  return (
    <DashboardLayout contentClassName="max-w-5xl">
      <main className="space-y-5">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-700 dark:text-sky-300">ACCOUNT & SECURITY</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">安全设置</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">管理授权、游戏登录凭据和通知渠道。任务开关与上号时间请前往任务配置。</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid gap-4 border-b border-border px-5 py-5 sm:grid-cols-[minmax(0,0.7fr)_minmax(320px,1fr)] sm:px-6">
            <div className="max-w-md"><div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-sky-600 dark:text-sky-300" />授权兑换</div><h2 className="mt-3 text-xl font-semibold tracking-[-0.025em]">使用 CDK 更新账号授权</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">输入有效授权码后，账号授权信息将立即更新。</p></div>
            <div className="flex items-end gap-3"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="cdk">授权码</Label><Input id="cdk" value={cdk} onChange={(event) => setCdk(event.target.value)} disabled={cdkLoading} placeholder="输入 CDK" autoComplete="off" className="h-11" /></div><Button onClick={handleCdkActivate} disabled={cdkLoading} className="h-11 shrink-0">{cdkLoading ? "验证中" : "立即兑换"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:grid-cols-[minmax(0,0.7fr)_minmax(320px,1fr)] sm:px-6">
            <div className="max-w-md"><div className="flex items-center gap-2 text-sm font-semibold"><Gamepad2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />游戏账号</div><h2 className="mt-3 text-xl font-semibold tracking-[-0.025em]">更换登录凭据与服务器</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">保存后，后续任务会使用新凭据登录。</p><div className="mt-4 flex gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs leading-5 dark:border-sky-900 dark:bg-sky-950/30"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />保存失败时不会清空输入，可检查错误后直接重试。</div></div>
            <form onSubmit={(e) => { e.preventDefault(); void handleUpdateAccount(); }} className="space-y-4"><div className="space-y-2"><Label htmlFor="game-account">游戏账号</Label><Input id="game-account" value={account} onChange={(event) => setAccount(event.target.value)} disabled={updateLoading} placeholder="输入新的游戏账号" autoComplete="username" className="h-11" aria-invalid={Boolean(formError && !account.trim())} /></div><div className="space-y-2"><Label htmlFor="game-password">游戏密码</Label><Input id="game-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={updateLoading} placeholder="输入新的游戏密码" autoComplete="new-password" className="h-11" aria-invalid={Boolean(formError && !password)} /></div><div className="space-y-2"><Label htmlFor="game-server">服务器</Label><Select value={server} onValueChange={setServer} disabled={updateLoading}><SelectTrigger id="game-server" className="h-11 w-full"><Server className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="选择服务器" /></SelectTrigger><SelectContent><SelectItem value="0">官服</SelectItem><SelectItem value="1">B服</SelectItem></SelectContent></Select></div>{formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}<div className="flex justify-end border-t border-border pt-4"><Button type="submit" disabled={updateLoading} size="lg">{updateLoading ? "保存中" : "保存游戏账号"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></form>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6"><div className="flex items-center gap-2"><Bell className="h-5 w-5 text-sky-600 dark:text-sky-300" /><div><h2 className="text-base font-semibold">通知设置</h2><p className="mt-0.5 text-xs text-muted-foreground">通知渠道只在安全设置维护</p></div></div><Button onClick={handleSaveNotice} disabled={noticeLoading || noticeSaving} size="sm">{noticeSaving ? "保存中" : "保存通知"}</Button></div>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
            <NoticeField icon={MessageSquare} label="微信" value={notice.wxUID} placeholder="微信 UID" disabled={noticeLoading || noticeSaving} onChange={(next) => setNotice((current) => ({ ...current, wxUID: next }))} />
            <NoticeField icon={MessageSquare} label="QQ" value={notice.qq} placeholder="QQ 号" disabled={noticeLoading || noticeSaving} onChange={(next) => setNotice((current) => ({ ...current, qq: next }))} />
            <NoticeField icon={Mail} label="邮件" value={notice.mail} placeholder="邮箱地址" disabled={noticeLoading || noticeSaving} onChange={(next) => setNotice((current) => ({ ...current, mail: next }))} />
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}

function NoticeField({ icon: Icon, label, value, placeholder, disabled, onChange }: { icon: typeof MessageSquare; label: string; value: NoticeChannel; placeholder: string; disabled: boolean; onChange: (value: NoticeChannel) => void }) {
  return <div className="space-y-3 rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-sky-600 dark:text-sky-300" />{label}</div><Switch checked={value.enable} onCheckedChange={(enable) => onChange({ ...value, enable })} disabled={disabled} aria-label={`启用${label}通知`} /></div><Input value={value.text} onChange={(event) => onChange({ ...value, text: event.target.value })} disabled={disabled} placeholder={placeholder} /></div>
}
