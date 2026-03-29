"use client"

import {useCallback, useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {ImageIcon, RefreshCw, Search, Trash, User} from "lucide-react"
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
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"

interface LogEntry {
  id: number
  level: string
  taskType: string
  title: string
  detail: string
  imageUrl: string
  from: string
  server: number
  name: string
  account: string
  password: null
  time: string
  delete: number
}

interface LogListResponse {
  code: number
  msg: string
  data: {
    current: number
    page: number
    total: number
    records: LogEntry[]
  }
}

export default function LogsPage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0,
    page: 0,
  })

  const [searchAccount, setSearchAccount] = useState("")
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  useEffect(() => {
    if (searchParams) {
      const keywordParam = searchParams.get("keyword") || searchParams.get("account")
      if (keywordParam) {
        setSearchAccount(keywordParam)
        setPagination((prev) => ({ ...prev, current: 1 }))
        fetchLogs(1, keywordParam)
      }
    }
  }, [])

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState("")

  const getToken = () => {
    return contextToken || getStoredToken()
  }

  const fetchLogs = useCallback(
    async (pageToFetch: number, accountKeyword = "") => {
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
        let endpoint: string
        const params = new URLSearchParams({
          current: pageToFetch.toString(),
          size: pagination.size.toString(),
        })
        if (accountKeyword.trim()) {
          endpoint = "/searchLog"
          params.append("keyword", accountKeyword.trim())
        } else {
          endpoint = "/showLog"
        }
        const result: LogListResponse = await apiRequestWithAuth(`${endpoint}?${params.toString()}`, token, {
          method: "GET",
        })
        if (result.code === 200) {
          setLogs(result.data.records)
          setPagination({
            current: result.data.current,
            size: pagination.size,
            total: result.data.total,
            page: result.data.page,
          })
        } else {
          toast({
            variant: "destructive",
            title: "获取日志列表失败",
            description: result.msg || "无法获取日志数据",
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
      fetchLogs(pagination.current, searchAccount)
    }
  }, [contextToken, fetchLogs, searchAccount])

  const [goToPageInput, setGoToPageInput] = useState("")

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchLogs(1, searchAccount)
  }

  const handleReset = () => {
    setSearchAccount("")
    setPagination({ ...pagination, current: 1 })
    fetchLogs(1, "")
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, current: newPage })
    fetchLogs(newPage, searchAccount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN")
  }

  const getTaskTypeName = (taskType: string) => {
    const taskTypes: Record<string, string> = {
      daily: "日常任务",
      rogue: "肉鸽任务",
      sand_fire: "生息演算",
    }
    return taskTypes[taskType] || taskType
  }

  const handleDetail = (log: LogEntry) => {
    setSelectedLog(log)
    setShowDetailDialog(true)
  }

  const handleDeleteLog = async (id: number) => {
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
      const result = await apiRequestWithAuth("/delLog", token, {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (result.code === 200) {
        toast({
          variant: "success",
          title: "删除成功",
          description: `日志 ${id} 已被删除`,
        })
        await fetchLogs(pagination.current, searchAccount)
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.msg || `无法删除日志 ${id}`,
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
    if (Number.isNaN(pageNum) || pageNum < 1 || pageNum > pagination.page) {
      toast({
        variant: "destructive",
        title: "无效页码",
        description: `请输入 1 到 ${pagination.page} 之间的有效页码。`,
      })
      return
    }
    setPagination({ ...pagination, current: pageNum })
    fetchLogs(pageNum, searchAccount)
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">日志管理</h1>
        <p className="text-gray-600 dark:text-gray-400">查看和管理系统运行日志</p>
      </div>

      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">搜索日志</CardTitle>
          <CardDescription className="dark:text-gray-400">支持按用户名称或账号搜索日志</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="accountSearch" className="dark:text-white">
                名称 / 账号
              </Label>
              <Input
                id="accountSearch"
                placeholder="输入用户名称或账号片段"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
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

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between dark:text-white">
            <div className="flex items-center gap-2">
              <span>日志列表</span>
              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                共 {pagination.total} 条日志
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="dark:text-white">加载中...</span>
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg dark:text-white">{log.title}</h3>
                        <Badge variant={log.level === "ERROR" ? "destructive" : "default"}>{log.level}</Badge>
                        <Badge variant="secondary">{getTaskTypeName(log.taskType)}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">ID: </span>
                          <span className="dark:text-white">{log.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">时间: </span>
                          <span className="dark:text-white">{formatDate(log.time)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">账户名称: </span>
                          <span className="dark:text-white">{log.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">账户: </span>
                          <span className="dark:text-white">{log.account}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">来自设备: </span>
                          <span className="dark:text-white">{log.from}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">服务器: </span>
                          <span className="dark:text-white">{log.server === 0 ? "官服" : "B服"}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">详情: </span>
                        <span className="dark:text-white">{log.detail}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 md:mt-0">
                      <Button size="sm" variant="outline" onClick={() => handleDetail(log)} disabled={loading}>
                        详情
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={loading}>
                            <Trash className="mr-2 h-4 w-4" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="dark:bg-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="dark:text-white">确认删除日志？</AlertDialogTitle>
                            <AlertDialogDescription className="dark:text-gray-400">
                              此操作将永久删除日志 ID: {log.id}。此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:border-gray-600 dark:text-white">取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteLog(log.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              删除
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
                  {Math.min(pagination.current * pagination.size, pagination.total)} 条，共 {pagination.total} 条
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
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">暂无日志数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <ImageIcon className="h-5 w-5" />
              日志详情 - {selectedLog?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 text-sm dark:text-gray-300">
              <p>
                <span className="font-medium">ID:</span> {selectedLog.id}
              </p>
              <p>
                <span className="font-medium">级别:</span> {selectedLog.level}
              </p>
              <p>
                <span className="font-medium">任务类型:</span> {getTaskTypeName(selectedLog.taskType)}
              </p>
              <p>
                <span className="font-medium">标题:</span> {selectedLog.title}
              </p>
              <p>
                <span className="font-medium">详情:</span> {selectedLog.detail}
              </p>
              <p>
                <span className="font-medium">来自设备:</span> {selectedLog.from}
              </p>
              <p>
                <span className="font-medium">服务器:</span> {selectedLog.server === 0 ? "官服" : "B服"}
              </p>
              <p>
                <span className="font-medium">账户名称:</span> {selectedLog.name}
              </p>
              <p>
                <span className="font-medium">账户:</span> {selectedLog.account}
              </p>
              <p>
                <span className="font-medium">时间:</span> {formatDate(selectedLog.time)}
              </p>
              {selectedLog.imageUrl && (
                <div>
                  <p className="font-medium mb-2">图片:</p>
                  <div
                    className="cursor-pointer border rounded-lg overflow-hidden dark:border-gray-600"
                    onClick={() => {
                      setSelectedImageUrl(selectedLog.imageUrl)
                      setIsImageDialogOpen(true)
                    }}
                  >
                    <img
                      src={selectedLog.imageUrl || "/placeholder.svg"}
                      alt="Log Detail"
                      className="w-full h-auto object-contain max-h-96"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 dark:bg-gray-800">
          <img
            src={selectedImageUrl || "/placeholder.svg"}
            alt="Zoomed Log Image"
            className="w-full h-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
