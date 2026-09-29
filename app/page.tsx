"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ArrowRight, Crown, Gauge, Shield, Sparkles, User } from "lucide-react"
import { useRouter } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/api-config"
import { preloadAdminDashboardOverview } from "@/lib/admin-dashboard-resource"
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  authenticateDemoAccount,
  isDemoModeAvailable,
} from "@/lib/demo-mode"

type LoginRole = "user" | "admin" | "prouser"

const roleMeta: Record<LoginRole, { label: string; eyebrow: string; description: string }> = {
  user: {
    label: "用户",
    eyebrow: "PERSONAL WORKSPACE",
    description: "查看账号状态、调整任务并追踪每次运行结果。",
  },
  admin: {
    label: "管理员",
    eyebrow: "OPERATIONS CONSOLE",
    description: "发现异常、定位任务并处理设备与账号。",
  },
  prouser: {
    label: "代理用户",
    eyebrow: "PARTNER DESK",
    description: "维护子账号、授权与日常运营配置。",
  },
}

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<LoginRole>("user")
  const [userForm, setUserForm] = useState({ account: "", password: "" })
  const [adminForm, setAdminForm] = useState({ username: "", password: "" })
  const [proUserForm, setProUserForm] = useState({ username: "", password: "" })
  const [rememberPassword, setRememberPassword] = useState({ admin: false, prouser: false })
  const [loading, setLoading] = useState(false)
  const [demoAvailable, setDemoAvailable] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, userType, isLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    router.prefetch("/admin/dashboard")
  }, [router])

  useEffect(() => {
    setDemoAvailable(isDemoModeAvailable())
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated && userType) {
      window.location.replace(`/${userType}/dashboard`)
    }
  }, [isAuthenticated, userType, isLoading])

  useEffect(() => {
    const savedAdminForm = localStorage.getItem("savedAdminForm")
    const savedProUserForm = localStorage.getItem("savedProUserForm")

    if (savedAdminForm) {
      try {
        const parsed = JSON.parse(savedAdminForm) as { username?: string }
        setAdminForm({ username: parsed.username || "", password: "" })
        setRememberPassword((previous) => ({ ...previous, admin: true }))
      } catch {
        localStorage.removeItem("savedAdminForm")
      }
    }

    if (savedProUserForm) {
      try {
        const parsed = JSON.parse(savedProUserForm) as { username?: string }
        setProUserForm({ username: parsed.username || "", password: "" })
        setRememberPassword((previous) => ({ ...previous, prouser: true }))
      } catch {
        localStorage.removeItem("savedProUserForm")
      }
    }
  }, [])

  const showLoginError = (message?: string) => {
    toast({
      variant: "destructive",
      title: "登录失败",
      description: message || "账号或密码错误，请检查后重试",
    })
  }

  const completeLogin = (token: string, role: LoginRole, demo = false) => {
    login(token, role)
    if (role === "admin") void preloadAdminDashboardOverview(token)
    const destination = role === "user" ? "个人" : role === "admin" ? "运营" : "代理"
    toast({
      variant: "success",
      title: demo ? "已进入本地演示" : "登录成功",
      description: demo ? "所有数据和操作都停留在当前浏览器" : "正在进入" + destination + "工作台",
    })
    router.push("/" + role + "/dashboard")
  }

  const tryDemoLogin = (role: LoginRole, username: string, password: string) => {
    const token = authenticateDemoAccount(role, username, password)
    if (!token) return false
    completeLogin(token, role, true)
    return true
  }

  const handleDemoQuickLogin = (role: LoginRole) => {
    if (!demoAvailable || loading) return
    const token = authenticateDemoAccount(role, DEMO_ACCOUNTS[role].username, DEMO_PASSWORD)
    if (!token) return
    setLoading(true)
    completeLogin(token, role, true)
  }

  const handleUserLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (tryDemoLogin("user", userForm.account, userForm.password)) return
      const result = (await apiRequest("/userLogin", {
        method: "POST",
        body: JSON.stringify(userForm),
      })) as { code: number; data: { token: string }; msg?: string }
      if (result.code !== 200) return showLoginError(result.msg)

      completeLogin(result.data.token, "user")
    } catch {
      showLoginError("网络连接错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (tryDemoLogin("admin", adminForm.username, adminForm.password)) return
      const result = (await apiRequest("/adminLogin", {
        method: "POST",
        body: JSON.stringify(adminForm),
      })) as { code: number; data: { token: string }; msg?: string }
      if (result.code !== 200) return showLoginError(result.msg)

      if (rememberPassword.admin) localStorage.setItem("savedAdminForm", JSON.stringify({ username: adminForm.username }))
      else localStorage.removeItem("savedAdminForm")

      completeLogin(result.data.token, "admin")
    } catch {
      showLoginError("网络连接错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleProUserLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (tryDemoLogin("prouser", proUserForm.username, proUserForm.password)) return
      const result = (await apiRequest("/proUserLogin", {
        method: "POST",
        body: JSON.stringify(proUserForm),
      })) as { code: number; data: { token: string }; msg?: string }
      if (result.code !== 200) return showLoginError(result.msg)

      if (rememberPassword.prouser) localStorage.setItem("savedProUserForm", JSON.stringify({ username: proUserForm.username }))
      else localStorage.removeItem("savedProUserForm")

      completeLogin(result.data.token, "prouser")
    } catch {
      showLoginError("网络连接错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          {isAuthenticated ? "正在进入工作台" : "正在恢复登录状态"}
        </div>
      </main>
    )
  }

  const meta = roleMeta[activeRole]

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 workbench-grid opacity-60" />
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.75fr)]">
        <section className="flex flex-col justify-between border-b border-border px-5 pb-5 pt-14 sm:min-h-[38vh] sm:px-10 sm:pb-8 sm:pt-20 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-16 lg:pb-14 lg:pt-14">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="font-semibold tracking-[-0.02em]">终末地控制台</div>
              <div className="text-xs text-muted-foreground">ENDFIELD CONTROL</div>
            </div>
          </div>

          <div className="max-w-2xl py-5 sm:py-12 lg:py-0">
            <div className="mb-3 inline-flex items-center gap-2 border-l-2 border-primary pl-3 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground sm:mb-5 sm:text-xs sm:tracking-[0.18em]">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              HIGH-FREQUENCY OPERATIONS
            </div>
            <h1 className="max-w-xl text-2xl font-semibold leading-[1.1] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              <span className="sm:hidden">把任务和下一步放在同一个工作面。</span>
              <span className="hidden sm:inline">把状态、任务和下一步行动放在同一个工作面。</span>
            </h1>
            <p className="mt-4 hidden max-w-xl text-sm leading-6 text-muted-foreground sm:mt-6 sm:block sm:text-lg sm:leading-7">
              不需要在页面之间反复确认。登录后即可看到当前状态、待处理事项和最近运行结果。
            </p>
          </div>

          <div className="hidden max-w-xl grid-cols-3 border-y border-border text-sm sm:grid">
            {[
              ["01", "状态优先"],
              ["02", "就地处理"],
              ["03", "结果可追踪"],
            ].map(([number, label]) => (
              <div key={number} className="border-r border-border px-3 py-4 first:pl-0 last:border-r-0">
                <div className="font-mono text-xs text-primary">{number}</div>
                <div className="mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center px-5 py-8 sm:px-10 sm:py-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-start gap-4">
              <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card">
                <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">{meta.eyebrow}</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">进入{meta.label}工作台</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{meta.description}</p>
              </div>
            </div>

            <Tabs value={activeRole} onValueChange={(value) => setActiveRole(value as LoginRole)}>
              <TabsList className="grid h-11 w-full grid-cols-3 rounded-lg bg-muted p-1">
                <TabsTrigger value="user" className="gap-2 rounded-md"><User className="h-4 w-4" />用户</TabsTrigger>
                <TabsTrigger value="admin" className="gap-2 rounded-md"><Shield className="h-4 w-4" />管理员</TabsTrigger>
                <TabsTrigger value="prouser" className="gap-2 rounded-md"><Crown className="h-4 w-4" />代理</TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="mt-7">
                <LoginForm accountId="user-account" accountLabel="账号" accountValue={userForm.account} passwordId="user-password" passwordValue={userForm.password} loading={loading} submitLabel="进入个人工作台" onAccountChange={(value) => setUserForm({ ...userForm, account: value })} onPasswordChange={(value) => setUserForm({ ...userForm, password: value })} onSubmit={handleUserLogin} />
              </TabsContent>

              <TabsContent value="admin" className="mt-7">
                <LoginForm accountId="admin-username" accountLabel="用户名" accountValue={adminForm.username} passwordId="admin-password" passwordValue={adminForm.password} loading={loading} remember={rememberPassword.admin} submitLabel="进入运营工作台" onAccountChange={(value) => setAdminForm({ ...adminForm, username: value })} onPasswordChange={(value) => setAdminForm({ ...adminForm, password: value })} onRememberChange={(checked) => setRememberPassword({ ...rememberPassword, admin: checked })} onSubmit={handleAdminLogin} />
              </TabsContent>

              <TabsContent value="prouser" className="mt-7">
                <LoginForm accountId="prouser-username" accountLabel="用户名" accountValue={proUserForm.username} passwordId="prouser-password" passwordValue={proUserForm.password} loading={loading} remember={rememberPassword.prouser} submitLabel="进入代理工作台" onAccountChange={(value) => setProUserForm({ ...proUserForm, username: value })} onPasswordChange={(value) => setProUserForm({ ...proUserForm, password: value })} onRememberChange={(checked) => setRememberPassword({ ...rememberPassword, prouser: checked })} onSubmit={handleProUserLogin} />
              </TabsContent>
            </Tabs>

            {demoAvailable && (
              <div className="mt-5 flex flex-col gap-3 rounded-lg border border-primary/35 bg-primary/10 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    本地演示账号
                  </div>
                  <p className="mt-1 break-all text-xs leading-5 text-muted-foreground">
                    账号 <code className="font-mono text-foreground">{DEMO_ACCOUNTS[activeRole].username}</code>
                    <span className="px-1.5">·</span>
                    密码 <code className="font-mono text-foreground">{DEMO_PASSWORD}</code>
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => handleDemoQuickLogin(activeRole)}>
                  一键进入
                </Button>
              </div>
            )}

            <p className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              登录即表示你正在访问已授权的控制面板。遇到网络异常时，输入内容会保留在当前页面。
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

interface LoginFormProps {
  accountId: string
  accountLabel: string
  accountValue: string
  passwordId: string
  passwordValue: string
  loading: boolean
  remember?: boolean
  submitLabel: string
  onAccountChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange?: (checked: boolean) => void
  onSubmit: (event: React.FormEvent) => void
}

function LoginForm({ accountId, accountLabel, accountValue, passwordId, passwordValue, loading, remember, submitLabel, onAccountChange, onPasswordChange, onRememberChange, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={accountId}>{accountLabel}</Label>
        <Input id={accountId} autoComplete="username" value={accountValue} onChange={(event) => onAccountChange(event.target.value)} placeholder={`请输入${accountLabel}`} className="h-11 bg-card" required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={passwordId}>密码</Label>
          <span className="text-xs text-muted-foreground">区分大小写</span>
        </div>
        <Input id={passwordId} type="password" autoComplete="current-password" value={passwordValue} onChange={(event) => onPasswordChange(event.target.value)} placeholder="请输入密码" className="h-11 bg-card" required />
      </div>
      {onRememberChange && (
        <div className="flex items-center gap-2">
          <Checkbox id={`${accountId}-remember`} checked={remember} onCheckedChange={(checked) => onRememberChange(checked === true)} />
          <Label htmlFor={`${accountId}-remember`} className="font-normal text-muted-foreground">在这台设备上记住用户名</Label>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full justify-between" disabled={loading}>
        <span>{loading ? "正在验证" : submitLabel}</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  )
}
