"use client"

import {useCallback, useEffect, useState} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {ArrowUp, Clock, Hash, List, Loader2, Play, RefreshCw, Smartphone, User, XCircle} from "lucide-react"
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

interface FreeTask {
  id: number
  name: string
  account: string
  taskType: string
  agent: string | null
}

interface LockTask {
  deviceToken: string
  account: {
    id: number
    name: string
    account: string
  }
  expirationTime: string
}

interface TempCoolDownTask extends FreeTask {
  freezeUntil?: string
}

interface FrozenTask {
  id: number
  name: string
  account: string
  password?: string
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
}

export default function TasksPage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [freeTasks, setFreeTasks] = useState<FreeTask[]>([])
  const [lockTasks, setLockTasks] = useState<LockTask[]>([])
  const [coolDownSchedule, setCoolDownSchedule] = useState<Record<string, string>>({})
  const [frozenTasks, setFrozenTasks] = useState<FrozenTask[]>([])
  const [loading, setLoading] = useState({
    pending: false,
    inProgress: false,
    coolingDown: false,
  })

  const tempCoolDownTasks: TempCoolDownTask[] = freeTasks
    .filter((task) => Boolean(coolDownSchedule[String(task.id)]))
    .map((task) => ({
      ...task,
      freezeUntil: coolDownSchedule[String(task.id)],
    }))

  const coolingDownTabLabel =
    `${tempCoolDownTasks.length > 0 ? `\u51b7\u5374\uff08${tempCoolDownTasks.length}\uff09` : "\u51b7\u5374"}/` +
    `${frozenTasks.length > 0 ? `\u51bb\u7ed3\uff08${frozenTasks.length}\uff09` : "\u51bb\u7ed3"}`

  const getToken = () => {
    return contextToken || getStoredToken()
  }

  const fetchTasks = useCallback(
    async (tab: string) => {
      const token = getToken()
      if (!token || !isTokenValid(token)) {
        toast({
          variant: "destructive",
          title: "认证失败",
          description: "请重新登录",
        })
        return
      }

      setLoading((prev) => ({ ...prev, [tab]: true }))
      try {
        let result: any
        if (tab === "pending") {
          result = await apiRequestWithAuth("/showFreeTaskList", token, { method: "GET" })
          if (result.code === 200) {
            setFreeTasks(result.data || [])
          } else {
            toast({ variant: "destructive", title: "获取待处理任务失败", description: result.msg })
          }
        } else if (tab === "inProgress") {
          result = await apiRequestWithAuth("/showLockTaskList", token, { method: "GET" })
          if (result.code === 200) {
            setLockTasks(result.data || [])
          } else {
            toast({ variant: "destructive", title: "获取进行中任务失败", description: result.msg })
          }
        } else if (tab === "coolingDown") {
          const freeTaskResult = await apiRequestWithAuth<FreeTask[]>("/showFreeTaskList", token, { method: "GET" })
          if (freeTaskResult.code === 200) {
            setFreeTasks(freeTaskResult.data || [])
          } else {
            toast({ variant: "destructive", title: "获取待处理任务失败", description: freeTaskResult.msg })
          }

          const coolDownResult = await apiRequestWithAuth<Record<string, string>>("/showFreezeTaskList", token, {
            method: "GET",
          })
          if (coolDownResult.code === 200) {
            setCoolDownSchedule(coolDownResult.data || {})
          } else {
            toast({ variant: "destructive", title: "获取临时冷却队列失败", description: coolDownResult.msg })
          }

          const frozenResult = await apiRequestWithAuth<{ records?: FrozenTask[] }>(
            "/showAccount?current=1&size=1000&freeze=true&expired=false&deleted=false",
            token,
            { method: "GET" },
          )
          if (frozenResult.code === 200) {
            setFrozenTasks(frozenResult.data?.records || [])
          } else {
            toast({ variant: "destructive", title: "获取数据库冻结账号失败", description: frozenResult.msg })
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "网络错误",
          description: error instanceof Error ? error.message : "无法连接到服务器",
        })
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }))
      }
    },
    [contextToken, toast],
  )

  useEffect(() => {
    const token = getToken()
    if (token && isTokenValid(token)) {
      fetchTasks("pending")
      fetchTasks("inProgress")
      fetchTasks("coolingDown")
    }
  }, [contextToken, fetchTasks])

  const handleRefresh = () => {
    fetchTasks(activeTab)
  }

  const handleTempInsertTask = async (id: number) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, pending: true }))
    try {
      const result = await apiRequestWithAuth("/tempInsertTask", token, {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "操作成功", description: `任务 ${id} 已插队` })
        await fetchTasks("pending")
        await fetchTasks("inProgress")
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.msg || `无法插队任务 ${id}` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, pending: false }))
    }
  }

  const handleTempRemoveTask = async (id: number, type: "pending" | "coolingDown") => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, [type]: true }))
    try {
      const result = await apiRequestWithAuth("/tempRemoveTask", token, {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "操作成功", description: `任务 ${id} 已移除` })
        await fetchTasks(type)
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.msg || `无法移除任务 ${id}` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }))
    }
  }

  const handleForceUnlockOneTask = async (tokenValue: string) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, inProgress: true }))
    try {
      const result = await apiRequestWithAuth("/forceUnlockOneTask", token, {
        method: "POST",
        body: JSON.stringify({ token: tokenValue }),
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "操作成功", description: `设备 ${tokenValue} 任务已移除` })
        await fetchTasks("inProgress")
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.msg || `无法移除设备 ${tokenValue} 任务`,
        })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, inProgress: false }))
    }
  }

  const handleForceUnlockAllTasks = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, inProgress: true }))
    try {
      const result = await apiRequestWithAuth("/forceUnlockTaskList", token, {
        method: "POST",
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "操作成功", description: "所有进行中任务已移除" })
        await fetchTasks("inProgress")
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.msg || "无法移除所有进行中任务" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, inProgress: false }))
    }
  }

  const handleForceLoadAllTasks = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, pending: true }))
    try {
      const result = await apiRequestWithAuth("/forceLoadAllTask", token, {
        method: "POST",
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "操作成功", description: "所有任务已强制同步" })
        await fetchTasks("pending")
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.msg || "无法强制同步所有任务" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, pending: false }))
    }
  }

  const handleStartTempCoolDownTask = async (task: TempCoolDownTask) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, coolingDown: true }))
    try {
      const removeResult = await apiRequestWithAuth("/tempRemoveTask", token, {
        method: "POST",
        body: JSON.stringify({ id: task.id }),
      })
      if (removeResult.code !== 200) {
        toast({ variant: "destructive", title: "操作失败", description: removeResult.msg || `无法移出临时冷却 ${task.name}` })
        return
      }

      const startResult = await apiRequestWithAuth("/startAccountByAdmin", token, {
        method: "POST",
        body: JSON.stringify({ id: task.id }),
      })
      if (startResult.code === 200) {
        toast({ variant: "success", title: "操作成功", description: `用户 ${task.name} 已立即开始作战` })
        await fetchTasks("pending")
        await fetchTasks("coolingDown")
        await fetchTasks("inProgress")
      } else {
        toast({ variant: "destructive", title: "操作失败", description: startResult.msg || `无法立即启动 ${task.name}` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, coolingDown: false }))
    }
  }

  const handleRemoveTempCoolDownTask = async (task: TempCoolDownTask) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, coolingDown: true }))
    try {
      const result = await apiRequestWithAuth("/tempRemoveTask", token, {
        method: "POST",
        body: JSON.stringify({ id: task.id }),
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "操作成功", description: `用户 ${task.name} 已移出临时冷却` })
        await fetchTasks("pending")
        await fetchTasks("coolingDown")
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.msg || `无法移出临时冷却 ${task.name}` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, coolingDown: false }))
    }
  }

  const handleStartFrozenTask = async (task: FrozenTask) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, coolingDown: true }))
    try {
      const unfreezeResult = await apiRequestWithAuth("/updateAccount", token, {
        method: "POST",
        body: JSON.stringify({ id: task.id, freeze: 0 }),
      })
      if (unfreezeResult.code !== 200) {
        toast({ variant: "destructive", title: "操作失败", description: unfreezeResult.msg || `无法解除冻结 ${task.name}` })
        return
      }

      const startResult = await apiRequestWithAuth("/startAccountByAdmin", token, {
        method: "POST",
        body: JSON.stringify({ id: task.id }),
      })
      if (startResult.code === 200) {
        toast({ variant: "success", title: "操作成功", description: `用户 ${task.name} 已解除冻结并立即开始作战` })
        await fetchTasks("pending")
        await fetchTasks("coolingDown")
        await fetchTasks("inProgress")
      } else {
        toast({ variant: "destructive", title: "操作失败", description: startResult.msg || `无法立即启动 ${task.name}` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, coolingDown: false }))
    }
  }

  const handleRemoveFrozenTask = async (task: FrozenTask) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading((prev) => ({ ...prev, coolingDown: true }))
    try {
      const result = await apiRequestWithAuth("/updateAccount", token, {
        method: "POST",
        body: JSON.stringify({ id: task.id, freeze: 0 }),
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "操作成功", description: `用户 ${task.name} 已解除冻结` })
        await fetchTasks("coolingDown")
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.msg || `无法解除冻结 ${task.name}` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: "操作失败" })
    } finally {
      setLoading((prev) => ({ ...prev, coolingDown: false }))
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">任务管理</h1>
        <p className="text-gray-600 dark:text-gray-400">查看和管理当前系统中的任务队列</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending">待处理 ({freeTasks.length})</TabsTrigger>
          <TabsTrigger value="inProgress">进行中 ({lockTasks.length})</TabsTrigger>
          <TabsTrigger value="coolingDown">{coolingDownTabLabel}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">待处理任务</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} disabled={loading.pending} size="sm" variant="outline">
                  <RefreshCw className={loading.pending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                  刷新
                </Button>
                <Button onClick={handleForceLoadAllTasks} disabled={loading.pending} size="sm" variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  强制同步所有任务
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading.pending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="dark:text-white">加载中...</span>
                </div>
              ) : freeTasks.length > 0 ? (
                <div className="space-y-4">
                  {freeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 dark:border-gray-600"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500 dark:text-gray-400">ID:</span>
                          <span className="font-medium dark:text-white">{task.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" /> {/* Icon added */}
                          <span className="text-gray-500 dark:text-gray-400">名称:</span>
                          <span className="font-medium dark:text-white">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-500" /> {/* Icon added */}
                          <span className="text-gray-500 dark:text-gray-400">账号:</span>
                          <span className="font-medium dark:text-white">{task.account}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <List className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500 dark:text-gray-400">类型:</span>
                          <span className="font-medium dark:text-white">{getTaskTypeName(task.taskType)}</span>
                        </div>
                        {task.agent && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">代理:</span>
                            <span className="font-medium dark:text-white">{task.agent}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 md:mt-0">
                        <Button
                          size="sm"
                          onClick={() => handleTempInsertTask(task.id)}
                          disabled={loading.pending}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <ArrowUp className="mr-2 h-4 w-4" />
                          插队
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={loading.pending}
                          onClick={() => {
                            setFreeTasks((prev) => prev.filter((t) => t.id !== task.id))
                            handleTempRemoveTask(task.id, "pending")
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          移除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">暂无待处理任务</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inProgress">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">进行中任务</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} disabled={loading.inProgress} size="sm" variant="outline">
                  <RefreshCw className={loading.inProgress ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                  刷新
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={loading.inProgress}>
                      <XCircle className="mr-2 h-4 w-4" />
                      移除全部
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="dark:bg-gray-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="dark:text-white">确认移除全部进行中任务？</AlertDialogTitle>
                      <AlertDialogDescription className="dark:text-gray-400">
                        此操作将强制停止所有当前正在运行的任务。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="dark:border-gray-600 dark:text-white">取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleForceUnlockAllTasks}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        确认移除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading.inProgress ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="dark:text-white">加载中...</span>
                </div>
              ) : lockTasks.length > 0 ? (
                <div className="space-y-4">
                  {lockTasks.map((task) => (
                    <div
                      key={task.deviceToken}
                      className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 dark:border-gray-600"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500 dark:text-gray-400">设备Token:</span>
                          <span className="font-medium dark:text-white break-all">{task.deviceToken}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" /> {/* Icon added */}
                          <span className="text-gray-500 dark:text-gray-400">账户名称:</span>
                          <span className="font-medium dark:text-white">{task.account.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-500" /> {/* Icon added */}
                          <span className="text-gray-500 dark:text-gray-400">游戏账号:</span>
                          <span className="font-medium dark:text-white">{task.account.account}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500 dark:text-gray-400">到期时间:</span>
                          <span className="font-medium dark:text-white">
                            {new Date(task.expirationTime).toLocaleString("zh-CN")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 md:mt-0">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={loading.inProgress}>
                              <XCircle className="mr-2 h-4 w-4" />
                              移除任务
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="dark:bg-gray-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="dark:text-white">确认移除任务？</AlertDialogTitle>
                              <AlertDialogDescription className="dark:text-gray-400">
                                此操作将强制停止设备 {task.deviceToken} 上的任务。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="dark:border-gray-600 dark:text-white">
                                取消
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleForceUnlockOneTask(task.deviceToken)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                移除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">暂无进行中任务</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coolingDown">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">{"冷却/冻结任务"}</CardTitle>
              <Button onClick={handleRefresh} disabled={loading.coolingDown} size="sm" variant="outline">
                <RefreshCw className={loading.coolingDown ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                {"刷新"}
              </Button>
            </CardHeader>
            <CardContent>
              {loading.coolingDown ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="dark:text-white">{"加载中..."}</span>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {"临时冷却队列"} ({tempCoolDownTasks.length})
                    </h3>
                    {tempCoolDownTasks.length > 0 ? (
                      tempCoolDownTasks.map((task) => (
                        <div
                          key={`temp-${task.id}`}
                          className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 dark:border-gray-600"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500 dark:text-gray-400">{"名称:"}</span>
                              <span className="font-medium dark:text-white">{task.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500 dark:text-gray-400">{"账号:"}</span>
                              <span className="font-medium dark:text-white">{task.account}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <List className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500 dark:text-gray-400">{"类型:"}</span>
                              <span className="font-medium dark:text-white">{getTaskTypeName(task.taskType)}</span>
                            </div>
                            {task.agent && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">{"代理:"}</span>
                                <span className="font-medium dark:text-white">{task.agent}</span>
                              </div>
                            )}
                            {task.freezeUntil && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-500 dark:text-gray-400">{"冷却到:"}</span>
                                <span className="font-medium dark:text-white">
                                  {new Date(task.freezeUntil).toLocaleString("zh-CN")}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0">
                            <Button
                              size="sm"
                              onClick={() => handleStartTempCoolDownTask(task)}
                              disabled={loading.coolingDown}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {"立即作战"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" disabled={loading.coolingDown}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {"移出冷却"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="dark:bg-gray-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="dark:text-white">{"确认移出临时冷却？"}</AlertDialogTitle>
                                  <AlertDialogDescription className="dark:text-gray-400">
                                    {"此操作将移除用户 "}{task.name} ({task.account}) {" 的临时冷却状态。"}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="dark:border-gray-600 dark:text-white">
                                    {"取消"}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveTempCoolDownTask(task)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {"移出冷却"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border rounded-lg dark:border-gray-600">
                        <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">{"暂无临时冷却账号"}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {"数据库冻结账号"} ({frozenTasks.length})
                    </h3>
                    {frozenTasks.length > 0 ? (
                      frozenTasks.map((task) => (
                        <div
                          key={`frozen-${task.id}`}
                          className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 dark:border-gray-600"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500 dark:text-gray-400">{"名称:"}</span>
                              <span className="font-medium dark:text-white">{task.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500 dark:text-gray-400">{"账号:"}</span>
                              <span className="font-medium dark:text-white">{task.account}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <List className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500 dark:text-gray-400">{"类型:"}</span>
                              <span className="font-medium dark:text-white">{getTaskTypeName(task.taskType)}</span>
                            </div>
                            {task.agent && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">{"代理:"}</span>
                                <span className="font-medium dark:text-white">{task.agent}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500 dark:text-gray-400">{"到期:"}</span>
                              <span className="font-medium dark:text-white">
                                {new Date(task.expireTime).toLocaleString("zh-CN")}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0">
                            <Button
                              size="sm"
                              onClick={() => handleStartFrozenTask(task)}
                              disabled={loading.coolingDown}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {"解冻并作战"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" disabled={loading.coolingDown}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {"仅解冻"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="dark:bg-gray-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="dark:text-white">{"确认解除冻结？"}</AlertDialogTitle>
                                  <AlertDialogDescription className="dark:text-gray-400">
                                    {"此操作将解除用户 "}{task.name} ({task.account}) {" 的数据库冻结状态。"}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="dark:border-gray-600 dark:text-white">
                                    {"取消"}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveFrozenTask(task)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {"仅解冻"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border rounded-lg dark:border-gray-600">
                        <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">{"暂无数据库冻结账号"}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
