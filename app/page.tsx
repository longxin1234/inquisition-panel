"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ArrowRight, Gauge, Shield, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/api-config"
import { preloadAdminDashboardOverview } from "@/lib/admin-dashboard-resource"

const ADMIN_LOGIN_USERNAME = "1654458136@qq.com"

type PasswordCredentialConstructor = new (data: {
  id: string
  password: string
  name?: string
}) => Credential

async function savePasswordCredential(username: string, password: string): Promise<void> {
  if (!("credentials" in navigator)) return
  const constructor = (window as unknown as { PasswordCredential?: PasswordCredentialConstructor }).PasswordCredential
  if (!constructor) return

  try {
    await navigator.credentials.store(new constructor({
      id: username,
      password,
      name: "终末地控制台",
    }))
  } catch {
    // Browsers may deny programmatic storage while still offering native autofill.
  }
}

export default function LoginPage() {
  const [adminForm, setAdminForm] = useState({ username: ADMIN_LOGIN_USERNAME, password: "" })
  const [rememberLogin, setRememberLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, userType, isLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    router.prefetch("/admin/dashboard")
  }, [router])

  useEffect(() => {
    if (!isLoading && isAuthenticated && userType) {
      window.location.replace(`/${userType}/dashboard`)
    }
  }, [isAuthenticated, userType, isLoading])

  useEffect(() => {
    const savedAdminForm = localStorage.getItem("savedAdminForm")

    if (savedAdminForm) {
      try {
        const parsed = JSON.parse(savedAdminForm) as { username?: string }
        const savedUsername = parsed.username?.trim()
        setAdminForm({
          username: savedUsername && savedUsername !== "root" ? savedUsername : ADMIN_LOGIN_USERNAME,
          password: "",
        })
        setRememberLogin(true)
      } catch {
        localStorage.removeItem("savedAdminForm")
      }
    }
    localStorage.removeItem("savedProUserForm")
  }, [])

  const showLoginError = (message?: string) => {
    toast({
      variant: "destructive",
      title: "登录失败",
      description: message || "账号或密码错误，请检查后重试",
    })
  }

  const completeLogin = (token: string) => {
    login(token, "admin")
    void preloadAdminDashboardOverview(token)
    toast({
      variant: "success",
      title: "登录成功",
      description: "正在进入控制工作台",
    })
    router.push("/admin/dashboard")
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const result = (await apiRequest("/adminLogin", {
        method: "POST",
        body: JSON.stringify(adminForm),
      })) as { code: number; data: { token: string }; msg?: string }
      if (result.code !== 200) return showLoginError(result.msg)

      if (rememberLogin) {
        localStorage.setItem("savedAdminForm", JSON.stringify({ username: adminForm.username }))
        await savePasswordCredential(adminForm.username, adminForm.password)
      } else {
        localStorage.removeItem("savedAdminForm")
      }

      completeLogin(result.data.token)
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
                <div className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">CONTROL WORKSPACE</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">登录控制工作台</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">查看当前状态、定位任务并处理设备与账号。</p>
              </div>
            </div>

            <LoginForm
              accountId="control-account"
              accountLabel="邮箱账号"
              accountType="email"
              accountValue={adminForm.username}
              passwordId="control-password"
              passwordValue={adminForm.password}
              loading={loading}
              remember={rememberLogin}
              submitLabel="登录工作台"
              onAccountChange={(value) => setAdminForm({ ...adminForm, username: value })}
              onPasswordChange={(value) => setAdminForm({ ...adminForm, password: value })}
              onRememberChange={setRememberLogin}
              onSubmit={handleLogin}
            />

            <p className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              登录状态会保留在当前设备。勾选记住登录信息后，密码由浏览器的密码管理器保存，不会以明文写入网页缓存。
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
  accountType?: React.HTMLInputTypeAttribute
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

function LoginForm({ accountId, accountLabel, accountType = "text", accountValue, passwordId, passwordValue, loading, remember, submitLabel, onAccountChange, onPasswordChange, onRememberChange, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={accountId}>{accountLabel}</Label>
        <Input id={accountId} type={accountType} autoComplete="username" value={accountValue} onChange={(event) => onAccountChange(event.target.value)} placeholder={`请输入${accountLabel}`} className="h-11 bg-card" required />
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
          <Label htmlFor={`${accountId}-remember`} className="font-normal text-muted-foreground">在这台设备上记住账号和密码</Label>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full justify-between" disabled={loading}>
        <span>{loading ? "正在验证" : submitLabel}</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  )
}
