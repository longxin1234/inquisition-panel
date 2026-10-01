"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
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
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    password: "",
    sdk: "",
    verificationCode: "",
  })
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
      const remembered = window.localStorage.getItem(REMEMBER_LOGIN_KEY) === "1"
      setRememberLogin(remembered)
      if (remembered) {
        setForm((current) => ({
          ...current,
          username: window.localStorage.getItem(SAVED_ACCOUNT_KEY) || "",
          password: window.localStorage.getItem(SAVED_PASSWORD_KEY) || "",
        }))
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
        window.localStorage.setItem(SAVED_ACCOUNT_KEY, form.username.trim())
        window.localStorage.setItem(SAVED_PASSWORD_KEY, form.password)
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
          body: JSON.stringify({ username: form.username.trim(), password: form.password }),
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
          body: JSON.stringify({ account: form.username.trim(), password: form.password }),
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
    setLoading(true)
    try {
      const result = await apiRequest<{ token?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          account: form.username.trim(),
          displayName: form.displayName.trim(),
          password: form.password,
          sdk: form.sdk.trim(),
          verificationCode: form.verificationCode.trim(),
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
          <AuthField
            id="control-account"
            label="账号"
            autoComplete="username"
            value={form.username}
            onChange={(username) => setForm((current) => ({ ...current, username }))}
          />

          {isRegister && (
            <>
              <AuthField
                id="control-display-name"
                label="显示名称"
                autoComplete="nickname"
                value={form.displayName}
                onChange={(displayName) => setForm((current) => ({ ...current, displayName }))}
              />
              <AuthField
                id="control-sdk"
                label="SDK"
                autoComplete="off"
                value={form.sdk}
                onChange={(sdk) => setForm((current) => ({ ...current, sdk }))}
              />
              <AuthField
                id="control-code"
                label="验证码"
                autoComplete="one-time-code"
                value={form.verificationCode}
                onChange={(verificationCode) => setForm((current) => ({ ...current, verificationCode }))}
              />
            </>
          )}

          <AuthField
            id="control-password"
            label="密码"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={form.password}
            onChange={(password) => setForm((current) => ({ ...current, password }))}
          />

          {!isRegister && (
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
            onClick={() => setAuthMode(isRegister ? "login" : "register")}
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
