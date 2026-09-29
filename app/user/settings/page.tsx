"use client"

import { useState } from "react"
import { ArrowRight, Gamepad2, KeyRound, Server, ShieldCheck } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"

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

  const getToken = () => contextToken || getStoredToken()

  const handleCdkActivate = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
      return
    }
    if (!cdk.trim()) {
      toast({ variant: "destructive", title: "请输入授权码" })
      return
    }

    setCdkLoading(true)
    try {
      const result = await apiRequestWithAuth("/useCDK", token, {
        method: "POST",
        body: JSON.stringify({ cdk: cdk.trim() }),
        headers: { "Content-Type": "application/json" },
      })
      if (result.code !== 200) throw new Error(result.msg || "授权码未能激活")
      toast({ variant: "success", title: "授权已更新", description: result.msg })
      setCdk("")
    } catch (requestError) {
      toast({ variant: "destructive", title: "激活失败", description: requestError instanceof Error ? requestError.message : "请稍后重试" })
    } finally {
      setCdkLoading(false)
    }
  }

  const handleUpdateAccount = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
      return
    }
    if (!account.trim() || !password) {
      setFormError("请填写完整的游戏账号和密码")
      return
    }

    setFormError(null)
    setUpdateLoading(true)
    try {
      const result = await apiRequestWithAuth("/updateAccountAndPassword", token, {
        method: "POST",
        body: JSON.stringify({ account: account.trim(), password, server: Number(server) }),
        headers: { "Content-Type": "application/json" },
      })
      if (result.code !== 200) throw new Error(result.msg || "账号信息未能保存")
      toast({ variant: "success", title: "游戏账号已更新", description: result.msg })
      setAccount("")
      setPassword("")
      setServer("0")
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "修改失败"
      setFormError(message)
      toast({ variant: "destructive", title: "保存失败", description: message })
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <DashboardLayout contentClassName="max-w-[1180px]">
      <main className="space-y-5">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">ACCOUNT & SECURITY</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">安全设置</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">更新授权时长或更换游戏账号。任务配置和通知方式在各自页面单独维护。</p>
        </header>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid gap-4 border-b border-border px-5 py-5 sm:grid-cols-[minmax(0,0.7fr)_minmax(320px,1fr)] sm:px-6">
            <div className="max-w-md">
              <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-primary" />授权兑换</div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em]">使用 CDK 更新账号授权</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">输入有效授权码后，账号授权信息将立即更新。授权码成功使用后不可重复兑换。</p>
            </div>
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="cdk">授权码</Label>
                <Input id="cdk" value={cdk} onChange={(event) => setCdk(event.target.value)} disabled={cdkLoading} placeholder="输入 CDK" autoComplete="off" className="h-11" />
              </div>
              <Button onClick={handleCdkActivate} disabled={cdkLoading} className="h-11 shrink-0">
                {cdkLoading ? "验证中" : "立即兑换"}<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:grid-cols-[minmax(0,0.7fr)_minmax(320px,1fr)] sm:px-6">
            <div className="max-w-md">
              <div className="flex items-center gap-2 text-sm font-semibold"><Gamepad2 className="h-4 w-4 text-primary" />游戏账号</div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em]">更换登录凭据与服务器</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">保存后，后续任务会使用新凭据登录。正在运行的任务不会在此操作中自动重启。</p>
              <div className="mt-4 flex gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-xs leading-5 text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                保存失败时不会清空输入，可检查错误后直接重试。
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="game-account">游戏账号</Label>
                <Input id="game-account" value={account} onChange={(event) => setAccount(event.target.value)} disabled={updateLoading} placeholder="输入新的游戏账号" autoComplete="username" className="h-11" aria-invalid={Boolean(formError && !account.trim())} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-password">游戏密码</Label>
                <Input id="game-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={updateLoading} placeholder="输入新的游戏密码" autoComplete="new-password" className="h-11" aria-invalid={Boolean(formError && !password)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-server">服务器</Label>
                <Select value={server} onValueChange={setServer} disabled={updateLoading}>
                  <SelectTrigger id="game-server" className="h-11 w-full"><Server className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="选择服务器" /></SelectTrigger>
                  <SelectContent><SelectItem value="0">官服</SelectItem><SelectItem value="1">B服</SelectItem></SelectContent>
                </Select>
              </div>
              {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={handleUpdateAccount} disabled={updateLoading} size="lg">
                  {updateLoading ? "保存中" : "保存游戏账号"}<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}
