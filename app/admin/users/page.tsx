"use client"

import {useCallback, useEffect, useRef, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {Calendar, Filter, Play, Plus, RefreshCw, Search, Trash, User, Zap} from "lucide-react"
import {apiRequestWithAuth, getStoredToken, isTokenValid} from "@/lib/api-config"
import {useToast} from "@/hooks/use-toast"
import {UserDetailDialog} from "@/components/user-detail-dialog"
import {UserEditDialog} from "@/components/user-edit-dialog"
import {UserAddDialog} from "@/components/user-add-dialog"
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

interface UserAccount {
  id: number
  name: string
  account: string
  password: string
  freeze: number
  server: number
  taskType: string
  refresh: number
  agent: string | null
  createTime: string
  updateTime: string
  expireTime: string
  san: string
  config: any
  active: any
  notice: any
  cooldownUntil?: string | null
  delete: number
}

interface NewUserAccount {
  name: string
  account: string
  password?: string
  freeze: number
  server: number
  taskType: string
  refresh: number
  agent: string | null
  expireTime: string
  config: any
  active: any
  notice: any
}

interface UserListResponse {
  code: number
  msg: string
  data: {
    current: number
    page: number
    total: number
    records: UserAccount[]
  }
}

export default function UsersPage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(false)
  const latestFetchIdRef = useRef(0)
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0,
    page: 0,
  })

  const [searchForm, setSearchForm] = useState({
    keyword: "",
    taskType: "",
    freeze: "",
    expired: "",
    deleted: "",
  })

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const getToken = () => {
    return contextToken || getStoredToken()
  }

  const normalizeCooldownUntil = (value?: string | null) => {
    if (!value || !value.trim()) {
      return null
    }
    return value.trim()
  }

  const isNotFoundApiError = (error: unknown) => {
    return error instanceof Error && error.message.includes("status: 404")
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

      const fetchId = ++latestFetchIdRef.current
      setLoading(true)
      try {
        let endpoint: string
        const params = new URLSearchParams({
          current: pageToFetch.toString(),
          size: pagination.size.toString(),
        })

        if (isSearchParam && searchForm.keyword.trim()) {
          endpoint = "/searchAccount"
          params.append("keyword", searchForm.keyword.trim())
        } else {
          endpoint = "/showAccount"
          if (searchForm.taskType && searchForm.taskType !== "all") {
            params.append("taskType", searchForm.taskType)
          }
          if (searchForm.freeze && searchForm.freeze !== "all") {
            params.append("freeze", searchForm.freeze)
          }
          if (searchForm.expired && searchForm.expired !== "all") {
            params.append("expired", searchForm.expired)
          }
          if (searchForm.deleted && searchForm.deleted !== "all") {
            params.append("deleted", searchForm.deleted)
          }
        }

        const result: UserListResponse = await apiRequestWithAuth(`${endpoint}?${params.toString()}`, token, {
          method: "GET",
        })

        if (fetchId !== latestFetchIdRef.current) {
          return
        }

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
            title: "获取用户列表失败",
            description: result.msg || "无法获取用户数据",
          })
        }
      } catch (error) {
        if (fetchId !== latestFetchIdRef.current) {
          return
        }
        toast({
          variant: "destructive",
          title: "网络错误",
          description: error instanceof Error ? error.message : "无法连接到服务器",
        })
      } finally {
        if (fetchId === latestFetchIdRef.current) {
          setLoading(false)
        }
      }
    },
    [
      contextToken,
      pagination.size,
      searchForm.keyword,
      searchForm.taskType,
      searchForm.freeze,
      searchForm.expired,
      searchForm.deleted,
      toast,
    ],
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
      taskType: "",
      freeze: "",
      expired: "",
      deleted: "",
    })
    setPagination({ ...pagination, current: 1 })
    fetchUsers(false, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, current: newPage })
    fetchUsers(!!searchForm.keyword.trim(), newPage)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN")
  }

  const isExpired = (expireTime: string) => {
    if (!expireTime) return false;
    return new Date(expireTime).getTime() < Date.now();
  }

  const getTaskTypeName = (taskType: string) => {
    const taskTypes: Record<string, string> = {
      daily: "日常任务",
      rogue: "肉鸽任务",
      sand_fire: "生息演算",
    }
    return taskTypes[taskType] || taskType
  }

  const handleEdit = async (user: UserAccount) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading(true)
    try {
      const result = await apiRequestWithAuth<string | null>(`/showAccountCooldown?userId=${user.id}`, token)
      if (result.code !== 200) {
        throw new Error(result.msg || "获取临时冷却失败")
      }
      setSelectedUser({ ...user, cooldownUntil: result.data || null })
      setShowEditDialog(true)
    } catch (error) {
      if (isNotFoundApiError(error)) {
        setSelectedUser({ ...user, cooldownUntil: null })
        setShowEditDialog(true)
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: error instanceof Error ? error.message : "无法获取用户临时冷却状态",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDetail = (user: UserAccount) => {
    setSelectedUser(user)
    setShowDetailDialog(true)
  }

  const handleSaveEdit = async (updatedData: Partial<UserAccount>) => {
    if (!selectedUser) return

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
      const { cooldownUntil, ...accountUpdates } = updatedData
      const payload = {
        id: selectedUser.id,
        ...accountUpdates,
      } as Partial<UserAccount>

      const result = await apiRequestWithAuth("/updateAccount", token, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (result.code !== 200) {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.msg || "更新用户信息时发生错误",
        })
        return
      }

      const previousCooldownUntil = normalizeCooldownUntil(selectedUser.cooldownUntil)
      const nextCooldownUntil = normalizeCooldownUntil(cooldownUntil)
      let cooldownWarning: string | null = null

      if (previousCooldownUntil !== nextCooldownUntil) {
        try {
          const cooldownResult = nextCooldownUntil
            ? await apiRequestWithAuth("/setAccountCooldownUntil", token, {
                method: "POST",
                body: JSON.stringify({ id: selectedUser.id, freezeUntil: nextCooldownUntil }),
              })
            : await apiRequestWithAuth("/clearAccountCooldown", token, {
                method: "POST",
                body: JSON.stringify({ id: selectedUser.id }),
              })

          if (cooldownResult.code !== 200) {
            cooldownWarning = cooldownResult.msg || "账号信息已保存，但临时冷却未更新成功"
          }
        } catch (error) {
          cooldownWarning = isNotFoundApiError(error)
            ? "账号信息已保存，但当前后端未升级，临时冷却暂不可用"
            : error instanceof Error
              ? `账号信息已保存，但临时冷却保存失败：${error.message}`
              : "账号信息已保存，但临时冷却保存失败"
        }
      }

      toast({
        variant: "success",
        title: "保存成功",
        description: "用户信息已更新",
      })
      if (cooldownWarning) {
        toast({
          variant: "destructive",
          title: "临时冷却未生效",
          description: cooldownWarning,
        })
      }

      await fetchUsers(!!searchForm.keyword.trim(), pagination.current)
      setShowEditDialog(false)
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

  const handleStartAccount = async (id: number) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/startAccountByAdmin", token, {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (result.code === 200) {
        toast({
          variant: "success",
          title: "操作成功",
          description: `用户 ${id} 已立即上号`,
        })
        await fetchUsers(!!searchForm.keyword.trim(), pagination.current)
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.msg || `无法立即上号用户 ${id}`,
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

  const handleResetSanity = async (id: number) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/resetAccountDynamicInfo", token, {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (result.code === 200) {
        toast({
          variant: "success",
          title: "操作成功",
          description: `用户 ${id} 理智信息已重置`,
        })
        await fetchUsers(!!searchForm.keyword.trim(), pagination.current)
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.msg || `无法重置用户 ${id} 理智信息`,
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

  const handleResetRefresh = async (id: number) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/resetRefresh", token, {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (result.code === 200) {
        toast({
          variant: "success",
          title: "操作成功",
          description: `用户 ${id} 刷新次数已重置`,
        })
        await fetchUsers(!!searchForm.keyword.trim(), pagination.current)
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.msg || `无法重置用户 ${id} 刷新次数`,
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

  const handleDeleteAccount = async (id: number) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/delAccount", token, {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (result.code === 200) {
        toast({
          variant: "success",
          title: "删除成功",
          description: `用户 ${id} 已被删除`,
        })
        await fetchUsers(!!searchForm.keyword.trim(), pagination.current)
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.msg || `无法删除用户 ${id}`,
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

  const handleAddNewUser = async (newUserData: NewUserAccount) => {
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
      const result = await apiRequestWithAuth("/addAccount", token, {
        method: "POST",
        body: JSON.stringify(newUserData),
      })

      if (result.code === 200) {
        toast({
          variant: "success",
          title: "添加成功",
          description: "新用户已成功添加",
        })
        setPagination((prev) => ({ ...prev, current: 1 }))
        await fetchUsers(false, 1)
        setShowAddDialog(false)
      } else {
        toast({
          variant: "destructive",
          title: "添加失败",
          description: result.msg || "添加新用户时发生错误",
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

  const handleGoToPage = () => {
    const pageNum = Number.parseInt(goToPageInput)
    if (Number.isNaN(pageNum) || pageNum < 1 || pageNum > pagination.page) {
      toast({
        variant: "destructive",
        title: "无效页码",
        description: `请输入 1 到 ${pagination.page} 之间的有效页码。`,
      })
      return
    }
    setPagination({ ...pagination, current: pageNum })
    fetchUsers(!!searchForm.keyword.trim(), pageNum)
    setGoToPageInput("")
  }

  const token = getToken()
  if (!token || !isTokenValid(token)) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-4">请先登录</div>
          <Button onClick={() => (window.location.href = "/")}>返回登录</Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用户管理</h1>
        <p className="text-gray-600 dark:text-gray-400">管理系统中的所有用户账号</p>
      </div>

      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">搜索与筛选</CardTitle>
          <CardDescription className="dark:text-gray-400">根据条件查找用户</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="keyword" className="dark:text-white">
                关键词搜索
              </Label>
              <Input
                id="keyword"
                name="admin-user-search-keyword"
                placeholder="用户名或账号"
                value={searchForm.keyword}
                onChange={(e) => setSearchForm({ ...searchForm, keyword: e.target.value })}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="dark:text-white">任务类型</Label>
              <Select
                value={searchForm.taskType}
                onValueChange={(value) => setSearchForm({ ...searchForm, taskType: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择任务类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="daily">日常任务</SelectItem>
                  <SelectItem value="rogue">肉鸽任务</SelectItem>
                  <SelectItem value="sand_fire">生息演算</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-white">是否冻结</Label>
              <Select
                value={searchForm.freeze}
                onValueChange={(value) => setSearchForm({ ...searchForm, freeze: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择冻结状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-white">是否到期</Label>
              <Select
                value={searchForm.expired}
                onValueChange={(value) => setSearchForm({ ...searchForm, expired: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择到期状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">是否已删除</Label>
              <Select
                value={searchForm.deleted}
                onValueChange={(value) => setSearchForm({ ...searchForm, deleted: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择删除状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
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
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 dark:text-white">
            <div className="flex items-center gap-2">
              <span>用户列表</span>
              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                共 {pagination.total} 个用户
              </Badge>
            </div>
            <Button onClick={() => setShowAddDialog(true)} disabled={loading} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              增加用户
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="dark:text-white">加载中...</span>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                >
                  {/* Header: name + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-gray-500 shrink-0" />
                    <h3 className="font-semibold text-lg dark:text-white">{user.name}</h3>
                    <Badge variant={user.freeze ? "destructive" : "default"}>
                      {user.freeze ? "已冻结" : "正常"}
                    </Badge>
                    {user.delete === 1 ? (
                      <Badge variant="destructive">已删除</Badge>
                    ) : isExpired(user.expireTime) ? (
                      <Badge variant="destructive">已到期</Badge>
                    ) : (
                      <Badge variant="default">有效</Badge>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm mb-3">
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
                      <span className="dark:text-white">{user.server === 0 ? "官服" : "B服"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400">理智: </span>
                      <span className="dark:text-white">{user.san}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400">刷新次数: </span>
                      <span className="dark:text-white">{user.refresh}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400">到期: </span>
                      <span className="dark:text-white">{formatDate(user.expireTime)}</span>
                    </div>
                  </div>

                  {user.agent && (
                    <div className="text-sm mb-3">
                      <span className="text-gray-500 dark:text-gray-400">代理: </span>
                      <span className="dark:text-white">{user.agent}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t dark:border-gray-700">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(user)}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      编辑
                    </Button>
                    <Button size="sm" onClick={() => handleStartAccount(user.id)} disabled={loading}>
                      <Play className="mr-1 h-4 w-4" />
                      立即上号
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/admin/logs?account=${encodeURIComponent(user.account)}`}
                      disabled={loading}
                    >
                      查询日志
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDetail(user)} disabled={loading}>
                      详情
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" disabled={loading}>
                          <Trash className="mr-1 h-4 w-4" />
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="dark:bg-gray-800 mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="dark:text-white">确认删除用户？</AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-gray-400">
                            此操作将永久删除用户 {user.name} 的所有数据。此操作不可撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="dark:border-gray-600 dark:text-white">取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAccount(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  显示第 {(pagination.current - 1) * pagination.size + 1} -{" "}
                  {Math.min(pagination.current * pagination.size, pagination.total)} 条，共 {pagination.total} 条
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current <= 1}
                    onClick={() => handlePageChange(pagination.current - 1)}
                  >
                    上一页
                  </Button>
                  <span className="flex items-center px-2 text-sm dark:text-white whitespace-nowrap">
                    {pagination.current} / {pagination.page}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current >= pagination.page}
                    onClick={() => handlePageChange(pagination.current + 1)}
                  >
                    下一页
                  </Button>
                  <div className="flex items-center gap-1">
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
                      className="w-16 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <Button size="sm" onClick={handleGoToPage} disabled={loading}>
                      跳转
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">暂无用户数据</p>
            </div>
          )}
        </CardContent>
      </Card>
      <UserDetailDialog user={selectedUser} open={showDetailDialog} onOpenChange={setShowDetailDialog}
        onResetRefresh={handleResetRefresh}
        onResetSanity={handleResetSanity}
      />
      <UserEditDialog
        user={selectedUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveEdit}
      />
      <UserAddDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSave={handleAddNewUser} />
    </DashboardLayout>
  )
}
