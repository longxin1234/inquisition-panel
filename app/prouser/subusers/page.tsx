"use client"

import {useCallback, useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {Calendar, Filter, Play, Plus, RefreshCw, Search, User, Zap} from "lucide-react"
import {apiRequestWithAuth, getStoredToken, isTokenValid} from "@/lib/api-config"
import {useToast} from "@/hooks/use-toast"
import {DashboardLayout} from "@/components/dashboard-layout"
import {useAuth} from "@/contexts/auth-context"
import {ProuserSubuserAddDialog} from "@/components/prouser-subuser-add-dialog"
import {UserEditDialog} from "@/components/user-edit-dialog"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"

interface SubUserAccount {
  id: number
  name: string
  account: string
  freeze: number
  server: number
  taskType: string
  refresh: number
  createTime: string
  updateTime: string
  expireTime: string
  san: string
  config: any
  active: any
  notice: any
}

interface SubUserListResponse {
  code: number
  msg: string
  data: {
    current: number
    page: number
    total: number
    records: SubUserAccount[]
  }
}

function RenewDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (open: boolean) => void; user: SubUserAccount | null }) {
  const { toast } = useToast();
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cdk, setCdk] = useState("");

  useEffect(() => {
    if (open) {
      setMonths(1);
      setCdk("");
    }
  }, [open]);

  const handleBalanceRenew = async () => {
    if (!user) return;
    if (!months || months < 1) {
      toast({ variant: "destructive", title: "请输入有效月数" });
      return;
    }
    setLoading(true);
    try {
      const token = getStoredToken() || "";
      const res = await apiRequestWithAuth("/renewSubUserDaily", token, {
        method: "POST",
        body: JSON.stringify({ id: user.id, mo: months }),
      });
      if (res.code === 200) {
        toast({ variant: "success", title: "续费成功", description: `已成功续费${months}个月` });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "续费失败", description: res.msg || "操作失败" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "网络错误", description: e?.message || "续费失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleCDKRenew = async () => {
    if (!user) return;
    if (!cdk.trim()) {
      toast({ variant: "destructive", title: "请输入CDK码" });
      return;
    }
    setLoading(true);
    try {
      const token = getStoredToken() || "";
      const res = await apiRequestWithAuth("/activateSubUserCdk", token, {
        method: "POST",
        body: JSON.stringify({ id: user.id, cdk: cdk.trim() }),
      });
      if (res.code === 200) {
        toast({ variant: "success", title: "续费成功", description: "CDK续费成功" });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "续费失败", description: res.msg || "操作失败" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "网络错误", description: e?.message || "续费失败" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = () => {
    };
    window.addEventListener('refreshSubUserList', handler);
    return () => window.removeEventListener('refreshSubUserList', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">续期 - {user?.name || user?.account}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="balance">余额续费</TabsTrigger>
            <TabsTrigger value="cdk">CDK续费</TabsTrigger>
          </TabsList>
          <TabsContent value="balance">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span>续费月数</span>
                <input
                  type="number"
                  min={1}
                  value={months}
                  onChange={e => setMonths(Number(e.target.value) || 1)}
                  className="w-24 rounded border border-input bg-background px-2 py-1 text-foreground"
                  disabled={loading}
                />
                <span>月</span>
              </div>
              <Button onClick={handleBalanceRenew} disabled={loading || !user} className="w-full bg-green-500 hover:bg-green-600 text-white">
                {loading ? "提交中..." : "提交"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="cdk">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span>CDK码</span>
                <input
                  type="text"
                  value={cdk}
                  onChange={e => setCdk(e.target.value)}
                  className="border rounded px-2 py-1 flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                  placeholder="请输入CDK"
                />
              </div>
              <Button onClick={handleCDKRenew} disabled={loading || !user} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                {loading ? "提交中..." : "提交"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default function SubUsersPage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<SubUserAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0,
    page: 0,
  })

  const [searchForm, setSearchForm] = useState({
    keyword: "",
    type: "all",
  })

  const [showAddDialog, setShowAddDialog] = useState(false)

  const [proUserInfo, setProUserInfo] = useState<any>(null)

  const [editUser, setEditUser] = useState<SubUserAccount | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [renewUser, setRenewUser] = useState<SubUserAccount | null>(null)
  const [showRenewDialog, setShowRenewDialog] = useState(false)

  useEffect(() => {
    const token = getStoredToken() || "";
    if (token && isTokenValid(token)) {
      apiRequestWithAuth("/getProUserInfo", token, { method: "GET" }).then((res) => {
        if (res.code === 200) setProUserInfo(res.data)
      })
    }
  }, [contextToken])

  const getToken = () => {
    return contextToken || getStoredToken()
  }

  const fetchUsers = useCallback(
    async (isSearchParam: boolean, pageToFetch: number) => {
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
        let endpoint = "/getSubUserList"
        const params = new URLSearchParams({
          type: searchForm.type,
          current: pageToFetch.toString(),
          size: pagination.size.toString(),
        })
        if (isSearchParam && searchForm.keyword.trim()) {
          params.append("keyword", searchForm.keyword.trim())
        }
        const result: SubUserListResponse = await apiRequestWithAuth(`${endpoint}?${params.toString()}`, token, {
          method: "GET",
        })
        if (result.code === 200) {
          setUsers(result.data.records)
          setPagination({
            current: result.data.current,
            size: pagination.size,
            total: result.data.total,
            page: result.data.page,
          })
        } else {
          toast({
            variant: "destructive",
            title: "获取附属用户列表失败",
            description: result.msg || "无法获取附属用户数据",
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
    [contextToken, pagination.size, searchForm.keyword, searchForm.type, toast],
  )

  useEffect(() => {
    const token = getToken()
    if (token && isTokenValid(token)) {
      fetchUsers(!!searchForm.keyword.trim(), pagination.current)
    }
  }, [contextToken, fetchUsers])

  const [goToPageInput, setGoToPageInput] = useState("")

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchUsers(true, 1)
  }

  const handleFilter = () => {
    setPagination({ ...pagination, current: 1 })
    fetchUsers(false, 1)
  }

  const handleReset = () => {
    setSearchForm({
      keyword: "",
      type: "all",
    })
    setPagination({ ...pagination, current: 1 })
    fetchUsers(false, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, current: newPage })
    fetchUsers(!!searchForm.keyword.trim(), newPage)
  }

  const handleAddNewUser = async (newUserData: any) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({
        variant: "destructive",
        title: "认证失败",
        description: "请重新登录",
      })
      return
    }
    if (!proUserInfo?.id) {
      toast({
        variant: "destructive",
        title: "无法获取代理用户ID",
        description: "请刷新页面后重试",
      })
      return
    }
    setLoading(true)
    try {
      const createRes = await apiRequestWithAuth("/createSubUserByProUser", token, {
        method: "POST",
        body: JSON.stringify({
          name: newUserData.name,
          account: newUserData.account,
          password: newUserData.password,
          server: newUserData.server,
          days: newUserData.days || 30,
          agent: proUserInfo.id,
        }),
      })
      if (createRes.code === 200) {
        toast({
          variant: "success",
          title: "添加成功",
          description: "新附属用户已成功添加",
        })
      } else {
        toast({
          variant: "destructive",
          title: "添加失败",
          description: createRes.msg || "添加新附属用户时发生错误",
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
  }

  const handleEditUserSave = async (editData: Partial<SubUserAccount>) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
      return
    }
    if (!editUser || typeof editUser.id === 'undefined') {
      toast({ variant: "destructive", title: "无效用户", description: "无法获取用户ID" })
      return
    }
    setLoading(true)
    try {
      const res = await apiRequestWithAuth("/setSubUser", token, {
        method: "POST",
        body: JSON.stringify({ ...editData, id: editUser.id }),
      })
      if (res.code === 200) {
        toast({ variant: "success", title: "保存成功", description: "用户信息已更新" })
        await fetchUsers(false, pagination.current)
        setShowEditDialog(false)
      } else {
        toast({ variant: "destructive", title: "保存失败", description: res.msg || "更新失败" })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "网络错误", description: e?.message || "更新失败" })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN")
  }

  const isExpired = (expireTime: string) => {
    return new Date(expireTime) < new Date()
  }

  const getTaskTypeName = (taskType: string) => {
    const taskTypes: Record<string, string> = {
      daily: "日常任务",
      rogue: "肉鸽任务",
      sand_fire: "生息演算",
    }
    return taskTypes[taskType] || taskType
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

  useEffect(() => {
    if (!showRenewDialog) {
      fetchUsers(!!searchForm.keyword.trim(), pagination.current);
    }
  }, [showRenewDialog]);

  return (
    <DashboardLayout>
      <div className="mb-8 border-b border-border pb-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">账号工作台</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">附属用户管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理您的所有附属用户账号</p>
      </div>
      <Card className="mb-6 border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-foreground">搜索与筛选</CardTitle>
          <CardDescription>根据条件查找附属用户</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-foreground">
                关键词搜索
              </Label>
              <Input
                id="keyword"
                placeholder="用户名或账号"
                value={searchForm.keyword}
                onChange={(e) => setSearchForm({ ...searchForm, keyword: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">账户状态</Label>
              <Select
                value={searchForm.type}
                onValueChange={(value) => setSearchForm({ ...searchForm, type: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="选择账户状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="expired">已到期</SelectItem>
                  <SelectItem value="frozen">已冻结</SelectItem>
                  <SelectItem value="deleted">已删除</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
            <Button onClick={handleFilter} variant="outline" disabled={loading}>
              <Filter className="mr-2 h-4 w-4" />
              筛选
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
              <span>附属用户列表</span>
              <Badge variant="outline" className="border-border text-muted-foreground">
                共 {pagination.total} 个附属用户
              </Badge>
            </div>
            <Button onClick={() => setShowAddDialog(true)} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              创建用户
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground" role="status">正在加载附属用户...</span>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-lg dark:text-white">{user.name}</h3>
                        <Badge variant={user.freeze ? "destructive" : "default"}>
                          {user.freeze ? "已冻结" : "正常"}
                        </Badge>
                        <Badge variant={isExpired(user.expireTime) ? "destructive" : "secondary"}
                          className={isExpired(user.expireTime) ? undefined : "bg-blue-100 text-blue-700 border-blue-200"}>
                          {isExpired(user.expireTime) ? "已到期" : "有效"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">账号: </span>
                          <span className="dark:text-white">{user.account}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">任务类型: </span>
                          <span className="dark:text-white">{getTaskTypeName(user.taskType)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">服务器: </span>
                          <span className="dark:text-white">{user.server === 0 ? "官服" : "B服"}</span>{" "}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-500 dark:text-gray-400">理智: </span>
                          <span className="dark:text-white">{user.san}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-4 w-4 text-green-500" />
                          <span className="text-gray-500 dark:text-gray-400">刷新次数: </span>
                          <span className="dark:text-white">{user.refresh}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="text-gray-500 dark:text-gray-400">到期时间: </span>
                          <span className="dark:text-white">{formatDate(user.expireTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 md:mt-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                        onClick={() => {
                          setRenewUser(user);
                          setShowRenewDialog(true);
                        }}
                        disabled={loading}
                      >
                        一键续期
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          const token = getToken();
                          if (!token || !isTokenValid(token)) {
                            toast({
                              variant: "destructive",
                              title: "认证失败",
                              description: "请重新登录",
                            });
                            return;
                          }
                          try {
                            const res = await apiRequestWithAuth("/forceSubUserStop", token, {
                              method: "POST",
                              body: JSON.stringify({ id: user.id }),
                            });
                            if (res.code === 200) {
                              toast({
                                variant: "success",
                                title: "操作成功",
                                description: "已发送强制停止指令",
                              });
                            } else {
                              toast({
                                variant: "destructive",
                                title: "操作失败",
                                description: res.msg || "强制停止失败",
                              });
                            }
                          } catch (e: any) {
                            toast({
                              variant: "destructive",
                              title: "网络错误",
                              description: e?.message || "强制停止失败",
                            });
                          }
                        }}
                        disabled={loading}
                      >
                        强制停止
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          const token = getToken();
                          if (!token || !isTokenValid(token)) {
                            toast({
                              variant: "destructive",
                              title: "认证失败",
                              description: "请重新登录",
                            });
                            return;
                          }
                          try {
                            const res = await apiRequestWithAuth("/forceSubUserFight", token, {
                              method: "POST",
                              body: JSON.stringify({ id: user.id }),
                            });
                            if (res.code === 200) {
                              toast({
                                variant: "success",
                                title: "操作成功",
                                description: "已发送立即上号指令",
                              });
                            } else {
                              toast({
                                variant: "destructive",
                                title: "操作失败",
                                description: res.msg || "上号失败",
                              });
                            }
                          } catch (e: any) {
                            toast({
                              variant: "destructive",
                              title: "网络错误",
                              description: e?.message || "上号失败",
                            });
                          }
                        }}
                        disabled={loading}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        立即上号
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditUser({
                            ...user,
                            password: "",
                            agent: (user as any).agent ?? "",
                          } as any);
                          setShowEditDialog(true)
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={loading}
                      >
                        编辑
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  显示第 {(pagination.current - 1) * pagination.size + 1} - {Math.min(pagination.current * pagination.size, pagination.total)} 条，共 {pagination.total} 条
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
                    第 {pagination.current} / {pagination.page} 页
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current >= pagination.page}
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
                        const pageNum = Number.parseInt(goToPageInput)
                        if (!Number.isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination.page) {
                          handlePageChange(pageNum)
                          setGoToPageInput("")
                        }
                      }
                    }}
                    className="w-20 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <Button size="sm" onClick={() => {
                    const pageNum = Number.parseInt(goToPageInput)
                    if (!Number.isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination.page) {
                      handlePageChange(pageNum)
                      setGoToPageInput("")
                    } else {
                      toast({
                        variant: "destructive",
                        title: "无效页码",
                        description: `请输入 1 到 ${pagination.page} 之间的有效页码。`,
                      })
                    }
                  }} disabled={loading}>
                    跳转
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <User className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">暂无附属用户数据</p>
            </div>
          )}
        </CardContent>
      </Card>
      <ProuserSubuserAddDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSave={handleAddNewUser} />
      <UserEditDialog user={editUser as any} open={showEditDialog} onOpenChange={setShowEditDialog} onSave={handleEditUserSave} />
      <RenewDialog open={showRenewDialog} onOpenChange={setShowRenewDialog} user={renewUser} />
    </DashboardLayout>
  )
}
