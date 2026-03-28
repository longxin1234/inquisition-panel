"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Shield, User, Crown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import BgSwitcher from "@/components/bg-switcher"
import { apiRequest } from "@/lib/api-config"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [userForm, setUserForm] = useState({ account: "", password: "" })
  const [adminForm, setAdminForm] = useState({ username: "", password: "" })
  const [proUserForm, setProUserForm] = useState({ username: "", password: "" })
  const [rememberPassword, setRememberPassword] = useState({
    user: false,
    admin: false,
    prouser: false,
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, userType, isLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && isAuthenticated && userType) {
      window.location.replace(`/${userType}/dashboard`)
    }
  }, [isAuthenticated, userType, isLoading, router])

  useEffect(() => {
    const savedUserForm = localStorage.getItem("savedUserForm")
    const savedAdminForm = localStorage.getItem("savedAdminForm")
    const savedProUserForm = localStorage.getItem("savedProUserForm")

    if (savedUserForm) {
      const parsed = JSON.parse(savedUserForm)
      setUserForm(parsed)
      setRememberPassword((prev) => ({ ...prev, user: true }))
    }

    if (savedAdminForm) {
      const parsed = JSON.parse(savedAdminForm)
      setAdminForm(parsed)
      setRememberPassword((prev) => ({ ...prev, admin: true }))
    }

    if (savedProUserForm) {
      const parsed = JSON.parse(savedProUserForm)
      setProUserForm(parsed)
      setRememberPassword((prev) => ({ ...prev, prouser: true }))
    }
  }, [])

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await apiRequest("/userLogin", {
        method: "POST",
        body: JSON.stringify(userForm),
      }) as { code: number; data: { token: string }; msg?: string }
      if (result.code === 200) {
        if (rememberPassword.user) {
          localStorage.setItem("savedUserForm", JSON.stringify(userForm))
        } else {
          localStorage.removeItem("savedUserForm")
        }

        login(result.data.token, "user")
        toast({
          variant: "success",
          title: "登录成功",
          description: "欢迎回来！正在跳转到用户面板...",
        })

        router.push("/user/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "登录失败",
          description: result.msg || "用户名或密码错误",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: "网络连接错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await apiRequest("/adminLogin", {
        method: "POST",
        body: JSON.stringify(adminForm),
      }) as { code: number; data: { token: string }; msg?: string }
      if (result.code === 200) {
        if (rememberPassword.admin) {
          localStorage.setItem("savedAdminForm", JSON.stringify(adminForm))
        } else {
          localStorage.removeItem("savedAdminForm")
        }

        login(result.data.token, "admin")
        toast({
          variant: "success",
          title: "管理员登录成功",
          description: "欢迎回来！正在跳转到管理员面板...",
        })

        router.push("/admin/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "登录失败",
          description: result.msg || "用户名或密码错误",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: "网络连接错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await apiRequest("/proUserLogin", {
        method: "POST",
        body: JSON.stringify(proUserForm),
      }) as { code: number; data: { token: string }; msg?: string }
      if (result.code === 200) {
        if (rememberPassword.prouser) {
          localStorage.setItem("savedProUserForm", JSON.stringify(proUserForm))
        } else {
          localStorage.removeItem("savedProUserForm")
        }

        login(result.data.token, "prouser")
        toast({
          variant: "success",
          title: "代理用户登录成功",
          description: "欢迎回来！正在跳转到代理用户面板...",
        })

        router.push("/prouser/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "登录失败",
          description: result.msg || "用户名或密码错误",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: "网络连接错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-white text-lg">加载中...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-white text-lg">正在跳转...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <BgSwitcher />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(75,85,99,0.1),transparent_50%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_49%,rgba(75,85,99,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-cyan-400/30 shadow-[0_0_40px_5px_rgba(0,255,255,0.15)] transition-all duration-300 hover:shadow-[0_0_60px_10px_rgba(0,255,255,0.25)]">
          <CardHeader className="text-center space-y-4">
            <div>
              <CardTitle className="text-2xl font-bold text-white dark:text-white">审判庭管理系统</CardTitle>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <div className="h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/60 to-cyan-400/0 shadow-[0_0_8px_2px_rgba(0,255,255,0.2)] flex-1"></div>
              <div className="w-2 h-2 bg-cyan-400 shadow-[0_0_8px_2px_rgba(0,255,255,0.5)] rounded-full animate-pulse"></div>
              <div className="h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/60 to-cyan-400/0 shadow-[0_0_8px_2px_rgba(0,255,255,0.2)] flex-1"></div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 dark:bg-black/20 backdrop-blur-sm border-white/20">
                <TabsTrigger
                  value="user"
                  className="flex items-center gap-1 data-[state=active]:bg-gray-600/30 data-[state=active]:text-white text-gray-300"
                >
                  <User className="w-4 h-4" />
                  用户
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="flex items-center gap-1 data-[state=active]:bg-gray-600/30 data-[state=active]:text-white text-gray-300"
                >
                  <Shield className="w-4 h-4" />
                  管理员
                </TabsTrigger>
                <TabsTrigger
                  value="prouser"
                  className="flex items-center gap-1 data-[state=active]:bg-gray-600/30 data-[state=active]:text-white text-gray-300"
                >
                  <Crown className="w-4 h-4" />
                  代理用户
                </TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="mt-6">
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-account" className="text-gray-200 dark:text-gray-300">
                      账号
                    </Label>
                    <Input
                      id="user-account"
                      type="text"
                      value={userForm.account}
                      onChange={(e) => setUserForm({ ...userForm, account: e.target.value })}
                      required
                      className="bg-white/10 dark:bg-black/20 border-cyan-400/30 text-white placeholder:text-cyan-200/40 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                      placeholder="请输入账号"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password" className="text-gray-200 dark:text-gray-300">
                      密码
                    </Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required
                      className="bg-white/10 dark:bg-black/20 border-cyan-400/30 text-white placeholder:text-cyan-200/40 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                      placeholder="请输入密码"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-user"
                      checked={rememberPassword.user}
                      onCheckedChange={(checked) => setRememberPassword({ ...rememberPassword, user: !!checked })}
                    />
                    <Label htmlFor="remember-user" className="text-sm text-gray-200">
                      记住密码
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white border-0 shadow-lg shadow-cyan-400/30 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-cyan-400/60"
                    disabled={loading}
                  >
                    {loading ? "登录中..." : "用户登录"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-6">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username" className="text-gray-200 dark:text-gray-300">
                      用户名
                    </Label>
                    <Input
                      id="admin-username"
                      type="text"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      required
                      className="bg-white/10 dark:bg-black/20 border-cyan-400/30 text-white placeholder:text-cyan-200/40 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-gray-200 dark:text-gray-300">
                      密码
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      required
                      className="bg-white/10 dark:bg-black/20 border-cyan-400/30 text-white placeholder:text-cyan-200/40 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                      placeholder="请输入密码"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-admin"
                      checked={rememberPassword.admin}
                      onCheckedChange={(checked) => setRememberPassword({ ...rememberPassword, admin: !!checked })}
                    />
                    <Label htmlFor="remember-admin" className="text-sm text-gray-200">
                      记住密码
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white border-0 shadow-lg shadow-cyan-400/30 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-cyan-400/60"
                    disabled={loading}
                  >
                    {loading ? "登录中..." : "管理员登录"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="prouser" className="mt-6">
                <form onSubmit={handleProUserLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prouser-username" className="text-gray-200 dark:text-gray-300">
                      用户名
                    </Label>
                    <Input
                      id="prouser-username"
                      type="text"
                      value={proUserForm.username}
                      onChange={(e) => setProUserForm({ ...proUserForm, username: e.target.value })}
                      required
                      className="bg-white/10 dark:bg-black/20 border-cyan-400/30 text-white placeholder:text-cyan-200/40 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prouser-password" className="text-gray-200 dark:text-gray-300">
                      密码
                    </Label>
                    <Input
                      id="prouser-password"
                      type="password"
                      value={proUserForm.password}
                      onChange={(e) => setProUserForm({ ...proUserForm, password: e.target.value })}
                      required
                      className="bg-white/10 dark:bg-black/20 border-cyan-400/30 text-white placeholder:text-cyan-200/40 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                      placeholder="请输入密码"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-prouser"
                      checked={rememberPassword.prouser}
                      onCheckedChange={(checked) => setRememberPassword({ ...rememberPassword, prouser: !!checked })}
                    />
                    <Label htmlFor="remember-prouser" className="text-sm text-gray-200">
                      记住密码
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white border-0 shadow-lg shadow-cyan-400/30 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-cyan-400/60"
                    disabled={loading}
                  >
                    {loading ? "登录中..." : "代理用户登录"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
