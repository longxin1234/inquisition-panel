"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {AlertTriangle, CreditCard, Gift, Plus, TrendingUp, Users} from "lucide-react"
import {apiRequestWithAuth, getStoredToken, isTokenValid} from "@/lib/api-config"
import {useAuth} from "@/contexts/auth-context"
import {useToast} from "@/hooks/use-toast"
import {DashboardLayout} from "@/components/dashboard-layout"

const getToken = (contextToken: string | null) => {
  return contextToken || getStoredToken()
}

function formatBalance(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : "--"
}

export default function ProUserDashboard() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [proUserInfo, setProUserInfo] = useState<any>(null)
  const [subUsers, setSubUsers] = useState<any[]>([])
  const [recentlyExpired, setRecentlyExpired] = useState<any[]>([])

  useEffect(() => {
    const token = getToken(contextToken)
    if (token && isTokenValid(token)) {
      fetchProUserData()
    } else {
      toast({
        variant: "destructive",
        title: "认证失败",
        description: "请重新登录",
      })
    }
  }, [contextToken])

  const fetchProUserData = async () => {
    const token = getToken(contextToken)
    if (!token || !isTokenValid(token)) {
      toast({
        variant: "destructive",
        title: "认证失败",
        description: "请重新登录",
      })
      return
    }

    try {
      const infoResult = await apiRequestWithAuth("/getProUserInfo", token, {
        method: "GET",
      })
      if (infoResult.code === 200) {
        setProUserInfo(infoResult.data)
      } else {
        toast({
          variant: "destructive",
          title: "获取用户信息失败",
          description: infoResult.msg || "无法获取代理用户信息",
        })
      }

      const subUsersResult = await apiRequestWithAuth("/getSubUserList?type=all&current=1&size=10", token, {
        method: "GET",
      })
      if (subUsersResult.code === 200) {
        const records = (subUsersResult.data as { records?: any[] })?.records || []
        setSubUsers(records)
      } else {
        toast({
          variant: "destructive",
          title: "获取附属用户失败",
          description: subUsersResult.msg || "无法获取附属用户列表",
        })
      }

      const expiredResult = await apiRequestWithAuth("/getRecentlyExpiredUsers", token, {
        method: "GET",
      })
      if (expiredResult.code === 200) {
        setRecentlyExpired(expiredResult.data as any[] || [])
      } else {
        toast({
          variant: "destructive",
          title: "获取到期用户失败",
          description: expiredResult.msg || "无法获取近期到期用户",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "网络错误",
        description: "无法连接到服务器，请检查网络连接",
      })
    }
  }

  const token = getToken(contextToken)
  if (!token || !isTokenValid(token)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mb-4 text-sm text-muted-foreground">请先登录</div>
          <Button onClick={() => (window.location.href = "/")}>返回登录</Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8 border-b border-border pb-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">代理工作台</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">代理用户仪表板</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理您的代理业务和附属用户</p>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">账户余额</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">¥{formatBalance(proUserInfo?.balance)}</div>
            <p className="text-xs text-muted-foreground">折扣系数: {proUserInfo?.discount ?? 1.0}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">附属用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{subUsers.length}</div>
            <p className="text-xs text-muted-foreground">活跃用户数量</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">近期到期</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[hsl(var(--status-warning))]">{recentlyExpired.length}</div>
            <p className="text-xs text-muted-foreground">需要续费的用户</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">权限等级</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{proUserInfo?.permission ?? "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              到期: {proUserInfo?.expireTime ? new Date(proUserInfo.expireTime).toLocaleDateString() : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-foreground">快速操作</CardTitle>
            <CardDescription>管理您的代理业务和附属用户</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => {
              window.location.href = "/prouser/subusers?add=true"
            }}>
              <Plus className="mr-2 h-4 w-4" />
              创建新用户
            </Button>
            <Button
              variant="outline"
              className="w-full bg-transparent dark:bg-transparent dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              onClick={() => {
                window.location.href = "/prouser/cdk?add=true"
              }}
            >
              <Gift className="mr-2 h-4 w-4" />
              生成CDK
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-foreground">近期到期用户</CardTitle>
            <CardDescription>需要及时续费的用户列表</CardDescription>
          </CardHeader>
          <CardContent>
            {recentlyExpired.length > 0 ? (
              <div className="space-y-3">
                {recentlyExpired.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-md border border-[hsl(var(--status-warning)/0.25)] bg-[hsl(var(--status-warning)/0.1)] p-3"
                  >
                    <div>
                      <p className="text-sm font-medium dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.account}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-orange-600">{new Date(user.expireTime).toLocaleDateString()}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 bg-transparent dark:bg-transparent dark:border-gray-600 dark:text-white"
                      >
                        续费
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无即将到期的用户</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
