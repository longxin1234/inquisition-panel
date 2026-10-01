"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ArrowLeft, RotateCw } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/api-config"
import { preloadAdminDashboardOverview } from "@/lib/admin-dashboard-resource"

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
    username: "",
    password: "",
    sdk: "",
    verificationCode: "",
  })
  const [captchaCode, setCaptchaCode] = useState("")
  const [rememberLogin, setRememberLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, userType, isLoading } = useAuth()
  const { toast } = useToast()

  const refreshCaptcha = () => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    let result = ""
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaCode(result)
  }

  useEffect(() => {
    refreshCaptcha()
  }, [])

  useEffect(() => {
    router.prefetch("/admin/dashboard")
    router.prefetch("/user/dashboard")
  }, [router])

  useEffect(() => {
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
    if (captchaCode && registerForm.verificationCode.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      toast({
        variant: "destructive",
        title: "验证码错误",
        description: "请输入右侧列出的4位验证码",
      })
      refreshCaptcha()
      return
    }

    setLoading(true)
    try {
      const result = await apiRequest<{ token?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          account: registerForm.username.trim(),
          displayName: registerForm.username.trim(),
          password: registerForm.password,
          sdk: registerForm.sdk.trim(),
          verificationCode: registerForm.verificationCode.trim(),
          server: 0,
        }),
      })

      if (result.code !== 200) {
        throw new Error(result.msg || "创建账号失败")
      }
      if (result.data?.token) {
        return completeLogin(result.data.token, "user")
      }

      toast({
        variant: "success",
        title: "账号创建成功",
        description: "请使用新账号登录",
      })
      setLoginForm((current) => ({
        ...current,
        username: registerForm.username.trim(),
        password: "",
      }))
      setRegisterForm({
        username: "",
        password: "",
        sdk: "",
        verificationCode: "",
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
              <AuthField
                id="control-account"
                label="账号"
                autoComplete="username"
                value={loginForm.username}
                onChange={(username) => setLoginForm((current) => ({ ...current, username }))}
              />

              <AuthField
                id="control-password"
                label="密码"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(password) => setLoginForm((current) => ({ ...current, password }))}
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
              <AuthField
                id="register-account"
                label="账号"
                autoComplete="username"
                value={registerForm.username}
                onChange={(username) => setRegisterForm((current) => ({ ...current, username }))}
              />

              <AuthField
                id="register-sdk"
                label="SDK"
                autoComplete="off"
                value={registerForm.sdk}
                onChange={(sdk) => setRegisterForm((current) => ({ ...current, sdk }))}
              />

              <CaptchaField
                value={registerForm.verificationCode}
                onChange={(verificationCode) =>
                  setRegisterForm((current) => ({ ...current, verificationCode }))
                }
                captchaCode={captchaCode}
                onRefresh={refreshCaptcha}
              />

              <AuthField
                id="register-password"
                label="密码"
                type="password"
                autoComplete="new-password"
                value={registerForm.password}
                onChange={(password) => setRegisterForm((current) => ({ ...current, password }))}
              />
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
                  username: "",
                  password: "",
                  sdk: "",
                  verificationCode: "",
                })
                refreshCaptcha()
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

interface AuthFieldProps {
  id: string
  label: string
  type?: React.HTMLInputTypeAttribute
  autoComplete: string
  value: string
  onChange: (value: string) => void
}

function AuthField({ id, label, type = "text", autoComplete, value, onChange }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="pl-1 text-xs font-semibold text-slate-600">
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`请输入${label}`}
        className="h-12 rounded-full border-slate-200 bg-[#fbfdff] px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
        required
      />
    </div>
  )
}

interface CaptchaFieldProps {
  value: string
  onChange: (value: string) => void
  captchaCode: string
  onRefresh: () => void
}

function CaptchaField({ value, onChange, captchaCode, onRefresh }: CaptchaFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pl-1">
        <Label htmlFor="register-code" className="text-xs font-semibold text-slate-600">
          验证码
        </Label>
        <span className="text-xs text-slate-400">点击右侧更换</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            id="register-code"
            name="verificationCode"
            autoComplete="one-time-code"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="请输入右侧验证码"
            className="h-12 rounded-full border-slate-200 bg-[#fbfdff] px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
            required
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          title="点击刷新验证码"
          className="flex h-12 shrink-0 select-none items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-4 font-mono text-base font-bold tracking-widest text-slate-800 shadow-sm transition hover:bg-slate-200 active:scale-95"
        >
          <span className="inline-block -skew-x-6 select-none tracking-widest text-slate-700">
            {captchaCode || "8888"}
          </span>
          <RotateCw className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  )
}
