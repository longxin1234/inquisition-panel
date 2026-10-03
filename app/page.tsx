"use client"

import React, { forwardRef, useEffect, useState } from "react"
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, User } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/api-config"
import { preloadAdminDashboardOverview } from "@/lib/admin-dashboard-resource"
import { cn } from "@/lib/utils"

const REMEMBER_LOGIN_KEY = "endfield_remember_credentials"
const SAVED_ACCOUNT_KEY = "endfield_saved_account"
const SAVED_PASSWORD_KEY = "endfield_saved_password"

type AuthMode = "login" | "register"

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  })
  const [registerForm, setRegisterForm] = useState({
    account: "",
    password: "",
    confirmPassword: "",
    sdk: "",
    server: 0,
  })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberLogin, setRememberLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, userType, isLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    router.prefetch("/admin/dashboard")
    router.prefetch("/user/dashboard")
  }, [router])

  useEffect(() => {
    try {
      window.localStorage.removeItem("admin_switched_mode")
      window.localStorage.removeItem("admin_return_token")
    } catch {}
    try {
      const remembered = window.localStorage.getItem(REMEMBER_LOGIN_KEY) === "1"
      setRememberLogin(remembered)
      if (remembered) {
        setLoginForm({
          username: window.localStorage.getItem(SAVED_ACCOUNT_KEY) || "",
          password: window.localStorage.getItem(SAVED_PASSWORD_KEY) || "",
        })
      }
    } catch {
      // Storage can be unavailable in private or embedded browser contexts.
    }
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated && userType) {
      window.location.replace(`/${userType}/dashboard`)
    }
  }, [isAuthenticated, userType, isLoading])

  const showLoginError = (message?: string) => {
    toast({
      variant: "destructive",
      title: "登录失败",
      description: message || "账号或密码错误，请检查后重试",
    })
  }

  const persistCredentials = () => {
    try {
      if (rememberLogin) {
        window.localStorage.setItem(REMEMBER_LOGIN_KEY, "1")
        window.localStorage.setItem(SAVED_ACCOUNT_KEY, loginForm.username.trim())
        window.localStorage.setItem(SAVED_PASSWORD_KEY, loginForm.password)
      } else {
        window.localStorage.removeItem(REMEMBER_LOGIN_KEY)
        window.localStorage.removeItem(SAVED_ACCOUNT_KEY)
        window.localStorage.removeItem(SAVED_PASSWORD_KEY)
      }
    } catch {
      // Login should still continue when the browser blocks local storage.
    }
  }

  const updateRememberLogin = (checked: boolean) => {
    setRememberLogin(checked)
    if (!checked) {
      try {
        window.localStorage.removeItem(REMEMBER_LOGIN_KEY)
        window.localStorage.removeItem(SAVED_ACCOUNT_KEY)
        window.localStorage.removeItem(SAVED_PASSWORD_KEY)
      } catch {
        // Ignore storage cleanup failures.
      }
    }
  }

  const completeLogin = (token: string, type: "admin" | "user") => {
    try {
      window.localStorage.removeItem("admin_switched_mode")
      window.localStorage.removeItem("admin_return_token")
    } catch {}
    persistCredentials()
    login(token, type)
    if (type === "admin") void preloadAdminDashboardOverview(token)
    toast({
      variant: "success",
      title: "登录成功",
      description: type === "admin" ? "正在进入管理工作台" : "正在进入用户工作台",
    })
    router.push(type === "admin" ? "/admin/dashboard" : "/user/dashboard")
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      let adminResult: { code: number; data?: { token?: string }; msg?: string } | null = null
      try {
        adminResult = await apiRequest<{ token?: string }>("/adminLogin", {
          method: "POST",
          body: JSON.stringify({ username: loginForm.username.trim(), password: loginForm.password }),
        })
      } catch {
        // A normal user account is not expected to pass the admin endpoint.
      }
      if (adminResult?.code === 200 && adminResult.data?.token) {
        return completeLogin(adminResult.data.token, "admin")
      }

      let userResult: { code: number; data?: { token?: string }; msg?: string } | null = null
      try {
        userResult = await apiRequest<{ token?: string }>("/userLogin", {
          method: "POST",
          body: JSON.stringify({ account: loginForm.username.trim(), password: loginForm.password }),
        })
      } catch {
        // Keep one generic login error for both account types.
      }
      if (userResult?.code === 200 && userResult.data?.token) {
        return completeLogin(userResult.data.token, "user")
      }

      showLoginError(userResult?.msg || adminResult?.msg)
    } catch {
      showLoginError("网络连接错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!registerForm.account.trim()) {
      toast({ variant: "destructive", title: "请输入账号" })
      return
    }
    if (!registerForm.password) {
      toast({ variant: "destructive", title: "请输入密码" })
      return
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "密码不一致",
        description: "两次输入的密码不一致，请重新输入",
      })
      return
    }
    if (!registerForm.sdk.trim()) {
      toast({ variant: "destructive", title: "请输入CDK激活码" })
      return
    }

    setLoading(true)
    try {
      const result = await apiRequest<string>("/createUserByCDK", {
        method: "POST",
        body: JSON.stringify({
          account: registerForm.account.trim(),
          username: registerForm.account.trim(),
          password: registerForm.password,
          cdk: registerForm.sdk.trim(),
          server: Number(registerForm.server) || 0,
        }),
      })

      if (result.code !== 200) {
        throw new Error(result.msg || "创建账号失败")
      }

      try {
        const loginResult = await apiRequest<{ token?: string }>("/userLogin", {
          method: "POST",
          body: JSON.stringify({
            account: registerForm.account.trim(),
            password: registerForm.password,
          }),
        })
        if (loginResult.code === 200 && loginResult.data?.token) {
          toast({ variant: "success", title: "账号创建成功", description: "已为您自动登录工作台" })
          return completeLogin(loginResult.data.token, "user")
        }
      } catch {}

      toast({
        variant: "success",
        title: "账号创建成功",
        description: "请使用新账号登录",
      })
      setLoginForm((current) => ({
        ...current,
        username: registerForm.account.trim(),
        password: "",
      }))
      setRegisterForm({
        account: "",
        password: "",
        confirmPassword: "",
        sdk: "",
        server: 0,
      })
      setAuthMode("login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "创建失败",
        description: error instanceof Error ? error.message : "请检查填写内容后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] text-slate-900">
        <div className="flex items-center gap-3 text-sm text-slate-500" role="status">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          {isAuthenticated ? "正在进入工作台" : "正在恢复登录状态"}
        </div>
      </main>
    )
  }

  const isRegister = authMode === "register"

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f7fb] px-5 py-10 text-slate-900">
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-15rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-sky-100/70 blur-3xl" />

      <section className="relative w-full max-w-[440px] rounded-[28px] border border-slate-200/90 bg-white/95 px-6 py-8 shadow-[0_28px_70px_rgba(26,61,101,0.14)] backdrop-blur sm:px-11 sm:py-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 h-[74px] w-[74px] overflow-hidden rounded-[22px] bg-blue-50 shadow-[0_12px_24px_rgba(23,105,224,0.16)]">
            <img src="/login-avatar.png" alt="终末地控制台" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">终末地控制台</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isRegister ? "填写注册信息后创建新的云控账号。" : "查看账号状态、定位任务并处理设备。"}
          </p>
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {!isRegister ? (
            <>
              <IconInput
                id="control-account"
                icon={<User className="h-4 w-4" />}
                placeholder="账号，终末地登录的账号"
                autoComplete="username"
                value={loginForm.username}
                onChange={(e) => setLoginForm((current) => ({ ...current, username: e.target.value }))}
                required
              />

              <IconInput
                id="control-password"
                icon={<Lock className="h-4 w-4" />}
                endIcon={showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onEndIconClick={() => setShowLoginPassword((prev) => !prev)}
                type={showLoginPassword ? "text" : "password"}
                placeholder="密码，终末地登录的密码"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((current) => ({ ...current, password: e.target.value }))}
                required
              />

              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  id="control-account-remember"
                  checked={rememberLogin}
                  onCheckedChange={(checked) => updateRememberLogin(checked === true)}
                />
                <Label htmlFor="control-account-remember" className="cursor-pointer font-normal text-slate-500">
                  在这台设备上记住账号和密码
                </Label>
              </div>
            </>
          ) : (
            <>
              <IconInput
                id="register-account"
                icon={<User className="h-4 w-4" />}
                placeholder="账号，终末地登录的账号"
                autoComplete="username"
                value={registerForm.account}
                onChange={(e) => setRegisterForm((c) => ({ ...c, account: e.target.value }))}
                required
              />

              <IconInput
                id="register-password"
                icon={<Lock className="h-4 w-4" />}
                endIcon={showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onEndIconClick={() => setShowRegisterPassword((prev) => !prev)}
                type={showRegisterPassword ? "text" : "password"}
                placeholder="密码，终末地登录的密码"
                autoComplete="new-password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((c) => ({ ...c, password: e.target.value }))}
                required
              />

              <IconInput
                id="register-confirm-password"
                icon={<Lock className="h-4 w-4" />}
                endIcon={showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onEndIconClick={() => setShowConfirmPassword((prev) => !prev)}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="确认密码"
                autoComplete="new-password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm((c) => ({ ...c, confirmPassword: e.target.value }))}
                required
              />

              <IconInput
                id="register-sdk"
                icon={<KeyRound className="h-4 w-4" />}
                placeholder="CDK 激活码"
                autoComplete="off"
                value={registerForm.sdk}
                onChange={(e) => setRegisterForm((c) => ({ ...c, sdk: e.target.value }))}
                required
              />

              <Select
                value={String(registerForm.server)}
                onValueChange={(val) => setRegisterForm((c) => ({ ...c, server: Number(val) }))}
              >
                <SelectTrigger className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                  <SelectValue placeholder="选择服务器" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">官服</SelectItem>
                  <SelectItem value="1">B服</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-full bg-[#181818] px-5 text-base font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all hover:bg-[#262626] hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)] active:scale-[0.99] disabled:opacity-50"
            disabled={loading}
          >
            <span>{loading ? "处理中..." : isRegister ? "创建账号" : "立即登录"}</span>
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-1 text-sm text-slate-500">
          <span>{isRegister ? "已有账号？" : "还没有账号？"}</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800 hover:underline"
            onClick={() => {
              if (isRegister) {
                setAuthMode("login")
              } else {
                setRegisterForm({
                  account: "",
                  password: "",
                  confirmPassword: "",
                  sdk: "",
                  server: 0,
                })
                setShowRegisterPassword(false)
                setShowConfirmPassword(false)
                setAuthMode("register")
              }
            }}
          >
            {isRegister && <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
            {isRegister ? "返回登录" : "创建账号"}
          </button>
        </div>
      </section>
    </main>
  )
}

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode
  endIcon?: React.ReactNode
  onEndIconClick?: () => void
}

const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, endIcon, onEndIconClick, className, ...props }, ref) => {
    return (
      <div className="relative flex h-12 w-full items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20">
        <span className="mr-2.5 flex shrink-0 items-center justify-center text-slate-400">
          {icon}
        </span>
        <input
          ref={ref}
          className={cn(
            "h-full w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none",
            className
          )}
          {...props}
        />
        {endIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            tabIndex={-1}
            className="ml-2 flex shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
          >
            {endIcon}
          </button>
        )}
      </div>
    )
  }
)
IconInput.displayName = "IconInput"


