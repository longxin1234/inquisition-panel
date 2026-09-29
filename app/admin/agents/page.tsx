"use client"
import {useCallback, useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {
  Ban,
  Calendar,
  CheckCircle,
  DollarSign,
  Hash,
  Info,
  Key,
  Percent,
  Plus,
  RefreshCw,
  Search,
  User
} from "lucide-react"
import {apiRequestWithAuth, getStoredToken, isTokenValid} from "@/lib/api-config"
import {useToast} from "@/hooks/use-toast"
import {DashboardLayout} from "@/components/dashboard-layout"
import {useAuth} from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {AgentDetailDialog} from "@/components/agent-detail-dialog"
import {AgentAddDialog} from "@/components/agent-add-dialog"

interface ProUser {
  id: number
  username: string
  password?: string
  permission: string
  balance: number
  discount: number
  authorization: string
  expireTime: string
  delete: number
}

interface ProUserListResponse {
  code: number
  msg: string
  data: {
    current: number
    page: number
    total: number
    records: ProUser[]
  }
}

export default function AgentManagementPage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [proUsers, setProUsers] = useState<ProUser[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0,
    page: 0,
  })

  const [searchUsername, setSearchUsername] = useState("")

  const [selectedProUser, setSelectedProUser] = useState<ProUser | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false)

  const getToken = () => {
    return contextToken || getStoredToken()
  }

  const fetchProUsers = useCallback(
    async (pageToFetch: number) => {
      const token = getToken()
      if (!token || !isTokenValid(token)) {
        toast({
          variant: "destructive",
          title: "认证失败",
          description: "请重新登录",
        })
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          current: pageToFetch.toString(),
          size: pagination.size.toString(),
        })
        const endpoint = `/getAllProUser?${params.toString()}`
        const result: ProUserListResponse = await apiRequestWithAuth(endpoint, token, {
          method: "GET",
        })
        if (result.code === 200) {
          setProUsers(result.data.records)
          setPagination({
            current: result.data.current,
            size: pagination.size,
            total: result.data.total,
            page: result.data.page,
          })
        } else {
          toast({
            variant: "destructive",
            title: "获取代理用户失败",
            description: result.msg || "无法获取代理用户数据",
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "网络错误",
          description: error instanceof Error ? error.message : "无法连接到服务器",
        })
      } finally {
        setLoading(false)
      }
    },
    [contextToken, pagination.size, toast],
  )

  useEffect(() => {
    const token = getToken()
    if (token && isTokenValid(token)) {
      fetchProUsers(pagination.current)
    }
  }, [contextToken, fetchProUsers, pagination.current])

  const filteredProUsers = proUsers.filter(user =>
    user.username.includes(searchUsername.trim())
  )

  const startIdx = (pagination.current - 1) * pagination.size
  const endIdx = startIdx + pagination.size
  const pagedProUsers = filteredProUsers.slice(startIdx, endIdx)
  const totalFiltered = filteredProUsers.length
  const totalPages = Math.ceil(totalFiltered / pagination.size)

  const [goToPageInput, setGoToPageInput] = useState("")

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
  }

  const handleReset = () => {
    setSearchUsername("")
    setPagination({ ...pagination, current: 1 })
    fetchProUsers(1)
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, current: newPage })
    fetchProUsers(newPage)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString("zh-CN")
    } catch (e) {
      return "无效日期"
    }
  }

  const handleDetail = (proUser: ProUser) => {
    setSelectedProUser(proUser)
    setShowDetailDialog(true)
  }

  const handleToggleProUserStatus = async (id: number, currentDeleteStatus: number) => {
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
    const newDeleteStatus = currentDeleteStatus === 0 ? 1 : 0
    const actionText = newDeleteStatus === 1 ? "禁用" : "启用"

    try {
      const result = await apiRequestWithAuth("/updateProUser", token, {
        method: "POST",
        body: JSON.stringify({ id, delete: newDeleteStatus }),
      })
      if (result.code === 200) {
        toast({
          variant: "success",
          title: "操作成功",
          description: `代理用户 ${id} 已被${actionText}`,
        })
        await fetchProUsers(pagination.current)
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.msg || `无法${actionText}代理用户 ${id}`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "网络错误",
        description: error instanceof Error ? error.message : "操作失败",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoToPage = () => {
    const pageNum = Number.parseInt(goToPageInput)
    if (Number.isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      toast({
        variant: "destructive",
        title: "无效页码",
        description: `请输入 1 到 ${totalPages} 之间的有效页码。`,
      })
      return
    }
    setPagination({ ...pagination, current: pageNum })
    fetchProUsers(pageNum)
    setGoToPageInput("")
  }

  const handleSaveAgentEdit = async (data: Partial<ProUser>) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
      return
    }
    setLoading(true)
    try {
      const res = await apiRequestWithAuth("/updateProUser", token, {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (res.code === 200) {
        toast({ variant: "success", title: "保存成功", description: "代理信息已更新" })
        await fetchProUsers(pagination.current)
        setShowDetailDialog(false)
      } else {
        toast({ variant: "destructive", title: "保存失败", description: res.msg || "更新失败" })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "网络错误", description: e?.message || "更新失败" })
    } finally {
      setLoading(false)
    }
  }

  const token = getToken()
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
      <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">账号目录</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">代理管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理系统中的所有代理用户账号</p>
        </div>
      </div>

      <Card className="mb-6 border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-foreground">搜索代理用户</CardTitle>
          <CardDescription>根据账户名称查找代理用户</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="accountSearch" className="dark:text-white">
                账户搜索
              </Label>
              <Input
                id="accountSearch"
                placeholder="输入账户名称"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-2">
              <span>代理用户列表</span>
              <Badge variant="outline" className="border-border text-muted-foreground">
                共 {totalFiltered} 个代理用户
              </Badge>
            </div>
            <Button onClick={() => setShowAddAgentDialog(true)} className="flex items-center gap-2" size="sm">
              <Plus className="h-4 w-4" /> 新增用户
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground" role="status">正在加载代理用户...</span>
            </div>
          ) : pagedProUsers.length > 0 ? (
            <div className="space-y-4">
              {pagedProUsers.map((proUser) => (
                <div
                  key={proUser.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-lg dark:text-white">{proUser.username}</h3>
                        <Badge variant={proUser.delete === 1 ? "destructive" : "default"}>
                          {proUser.delete === 1 ? "已删除" : "活跃"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Hash className="h-4 w-4 text-gray-500" />ID:
                          </span>
                          <span className="dark:text-white">{proUser.id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Key className="h-4 w-4 text-primary" />权限:
                          </span>
                          <span className="dark:text-white">{proUser.permission}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-gray-500 dark:text-gray-400">余额: </span>
                          <span className="dark:text-white">{proUser.balance.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Percent className="h-4 w-4 text-primary" />
                          <span className="text-gray-500 dark:text-gray-400">价格比例: </span>
                          <span className="dark:text-white">{(proUser.discount * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500 dark:text-gray-400">到期时间: </span>
                          <span className="dark:text-white">{formatDate(proUser.expireTime)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 md:mt-0">
                      <Button size="sm" variant="outline" onClick={() => handleDetail(proUser)} disabled={loading}>
                        <Info className="mr-2 h-4 w-4" />
                        详情
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant={proUser.delete === 1 ? "default" : "destructive"}
                            disabled={loading}
                          >
                            {proUser.delete === 1 ? (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            ) : (
                              <Ban className="mr-2 h-4 w-4" />
                            )}
                            {proUser.delete === 1 ? "启用" : "禁用"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="dark:bg-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="dark:text-white">
                              确认{proUser.delete === 1 ? "启用" : "禁用"}代理用户？
                            </AlertDialogTitle>
                            <AlertDialogDescription className="dark:text-gray-400">
                              此操作将{proUser.delete === 1 ? "启用" : "禁用"}代理用户 {proUser.username}。
                              {proUser.delete === 1 ? "启用后该用户将可以正常登录。" : "被禁用后该用户将无法登录。"}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:border-gray-600 dark:text-white">取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleToggleProUserStatus(proUser.id, proUser.delete)}
                              className={
                                proUser.delete === 1
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              }
                            >
                              {proUser.delete === 1 ? "启用" : "禁用"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  显示第 {(pagination.current - 1) * pagination.size + 1} -{" "}
                  {Math.min(pagination.current * pagination.size, totalFiltered)} 条，共 {totalFiltered} 条
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current <= 1}
                    onClick={() => handlePageChange(pagination.current - 1)}
                  >
                    上一页
                  </Button>
                  <span className="flex items-center px-3 text-sm dark:text-white">
                    第 {pagination.current} / {totalPages} 页
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current >= totalPages}
                    onClick={() => handlePageChange(pagination.current + 1)}
                  >
                    下一页
                  </Button>
                  <Input
                    type="number"
                    placeholder="页码"
                    value={goToPageInput}
                    onChange={(e) => setGoToPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleGoToPage()
                      }
                    }}
                    className="w-20 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <Button size="sm" onClick={handleGoToPage} disabled={loading}>
                    跳转
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <User className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">暂无代理用户数据</p>
            </div>
          )}
        </CardContent>
      </Card>
      <AgentDetailDialog agent={selectedProUser} open={showDetailDialog} onOpenChange={setShowDetailDialog} onSave={handleSaveAgentEdit} />
      <AgentAddDialog
        open={showAddAgentDialog}
        onOpenChange={setShowAddAgentDialog}
        onSave={async (data) => {
          const token = getToken()
          if (!token || !isTokenValid(token)) {
            toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
            return
          }
          setLoading(true)
          try {
            const res = await apiRequestWithAuth("/createProUser", token, {
              method: "POST",
              body: JSON.stringify(data),
            })
            if (res.code === 200) {
              toast({ variant: "success", title: "新增成功", description: "代理用户已添加" })
              await fetchProUsers(1)
              setPagination((p) => ({ ...p, current: 1 }))
            } else {
              toast({ variant: "destructive", title: "新增失败", description: res.msg || "添加失败" })
            }
          } catch (e: any) {
            toast({ variant: "destructive", title: "网络错误", description: e?.message || "添加失败" })
          } finally {
            setLoading(false)
          }
        }}
      />
    </DashboardLayout>
  )
}
