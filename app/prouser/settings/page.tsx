"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ProUserSettings() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const getToken = () => contextToken || getStoredToken()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "请填写所有字段",
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "两次输入的新密码不一致",
      })
      return
    }
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({
        variant: "destructive",
        title: "认证失败",
        description: "请重新登录",
      })
      return
    }
    setLoading(true)
    try {
      const res = await apiRequestWithAuth("/updateProUserPassword", token, {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      if (res.code === 200) {
        toast({
          variant: "success",
          title: "密码修改成功",
        })
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({
          variant: "destructive",
          title: "修改失败",
          description: res.msg || "请检查输入信息",
        })
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "网络错误",
        description: e?.message || "无法连接服务器",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="border-b border-border pb-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">账号与安全</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">修改密码</h1>
          <p className="mt-1 text-sm text-muted-foreground">更新代理账号密码后，旧密码会立即失效。</p>
        </div>
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-foreground">密码凭据</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">旧密码</label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="bg-background"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">新密码</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="bg-background"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">确认新密码</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="bg-background"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "提交中..." : "修改密码"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
