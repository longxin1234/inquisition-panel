"use client"

import {Suspense, useCallback, useEffect, useMemo, useState} from "react"
import {useRouter, useSearchParams} from "next/navigation"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {
  CalendarDays,
  CheckCircle2,
  Edit,
  Hash,
  Loader2,
  Mountain,
  PauseCircle,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Swords,
  Trash,
  Wifi,
  WifiOff,
} from "lucide-react"
import {apiRequestWithAuth, getStoredToken, isTokenValid} from "@/lib/api-config"
import {useToast} from "@/hooks/use-toast"
import {DashboardLayout} from "@/components/dashboard-layout"
import {useAuth} from "@/contexts/auth-context"
import {DeviceEditDialog} from "@/components/device-edit-dialog"
import {DeviceAddDialog} from "@/components/device-add-dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Label} from "@/components/ui/label"
import {
  type DashboardDeviceFilter,
  formatDashboardTime,
  getDeviceStatusMeta,
  parseDeviceState,
  replaceSearchParam,
} from "@/lib/admin-dashboard"

interface Device {
  id: number
  deviceName: string
  deviceToken: string
  chinac: number
  region: string | null
  expireTime: string | null
  delete: number
  status?: number
  runtimeState?: "IDLE" | "BUSY" | "SUSPENDED" | "OFFLINE"
  lastHeartbeatAt?: string | null
  offlineSince?: string | null
  suspendedUntil?: string | null
  currentAccountId?: number | null
  currentAccountName?: string | null
}

interface DeviceListResponse {
  code: number
  msg: string
  data: {
    current: number
    page: number
    total: number
    records: Device[]
  }
}

interface RawLoadedDevice {
  isChinac?: string
  chinac?: string | number
  expireTime: string | null
  id: string | number
  region: string | null
  deviceName: string
  deviceToken: string
  status: string | number
  runtimeState?: "IDLE" | "BUSY" | "SUSPENDED" | "OFFLINE"
  lastHeartbeatAt?: string | null
  offlineSince?: string | null
  suspendedUntil?: string | null
  currentAccountId?: string | number | null
  currentAccountName?: string | null
}

interface DeviceArrayResponse {
  code: number
  msg: string
  data: {
    loadDeviceList: RawLoadedDevice[]
  }
}

export default function DevicesPage() {
  return (
    <Suspense fallback={null}>
      <DevicesPageContent />
    </Suspense>
  )
}

function DevicesPageContent() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlStateFilter = parseDeviceState(searchParams.get("state"))
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0,
    page: 0,
  })

  const [searchKeyword, setSearchKeyword] = useState("")
  const [showDeletedFilter, setShowDeletedFilter] = useState<"all" | "active">("active")
  const [runtimeStateFilter, setRuntimeStateFilter] = useState<DashboardDeviceFilter>(urlStateFilter)
  const [goToPageInput, setGoToPageInput] = useState("")

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const getToken = () => {
    return contextToken || getStoredToken()
  }

  const fetchDevices = useCallback(
    async (pageToFetch: number, filterOption: "all" | "active") => {
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
        if (filterOption === "active") {
          const res = (await apiRequestWithAuth("/showLoadedDevice", token, {
            method: "GET",
          })) as DeviceArrayResponse

          if (res.code === 200 && res.data && Array.isArray(res.data.loadDeviceList)) {
            const mappedDevices: Device[] = res.data.loadDeviceList.map((rawDevice) => ({
              id: Number(rawDevice.id),
              deviceName: rawDevice.deviceName,
              deviceToken: rawDevice.deviceToken,
              chinac: Number(rawDevice.chinac ?? rawDevice.isChinac ?? 0),
              region: rawDevice.region === "null" ? null : rawDevice.region,
              expireTime: rawDevice.expireTime === "null" ? null : rawDevice.expireTime,
              delete: 0,
              status: Number(rawDevice.status),
              runtimeState: rawDevice.runtimeState,
              lastHeartbeatAt: rawDevice.lastHeartbeatAt,
              offlineSince: rawDevice.offlineSince,
              suspendedUntil: rawDevice.suspendedUntil,
              currentAccountId: rawDevice.currentAccountId == null ? null : Number(rawDevice.currentAccountId),
              currentAccountName: rawDevice.currentAccountName,
            }))
            setAllDevices(mappedDevices)
            setPagination({
              current: 1,
              size: mappedDevices.length,
              total: mappedDevices.length,
              page: 1,
            })
          } else {
            setAllDevices([])
            setPagination({ current: 1, size: 10, total: 0, page: 0 })
            toast({
              variant: "destructive",
              title: "获取设备列表失败",
              description: res.msg || "无法获取设备数据",
            })
          }
        } else {
          const params = new URLSearchParams({
            current: pageToFetch.toString(),
            size: pagination.size.toString(),
          })
          const res = (await apiRequestWithAuth(`/showInventoryDevice?${params.toString()}`, token, {
            method: "GET",
          })) as DeviceListResponse

          if (res.code === 200 && res.data && Array.isArray(res.data.records)) {
            setAllDevices(res.data.records)
            setPagination({
              current: res.data.current,
              size: pagination.size,
              total: res.data.total,
              page: res.data.page,
            })
          } else {
            setAllDevices([])
            setPagination({ current: 1, size: 10, total: 0, page: 0 })
            toast({
              variant: "destructive",
              title: "获取设备列表失败",
              description: res.msg || "无法获取设备数据",
            })
          }
        }
      } catch (error) {
        setAllDevices([])
        setPagination({ current: 1, size: 10, total: 0, page: 0 })
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
    fetchDevices(pagination.current, showDeletedFilter)
  }, [contextToken, fetchDevices, showDeletedFilter])

  useEffect(() => {
    setRuntimeStateFilter(urlStateFilter)
    if (urlStateFilter !== "all") {
      setShowDeletedFilter("active")
    }
    setPagination((current) => ({ ...current, current: 1 }))
  }, [urlStateFilter])

  const displayedDevices = useMemo(() => {
    const filtered = allDevices.filter((device) => {
      const matchesKeyword = device.deviceName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        device.deviceToken.toLowerCase().includes(searchKeyword.toLowerCase())
      const matchesRuntimeState = runtimeStateFilter === "all" ||
        device.runtimeState?.toLowerCase() === runtimeStateFilter
      return matchesKeyword && matchesRuntimeState
    })
    if (showDeletedFilter === "all") {
      const startIndex = (pagination.current - 1) * pagination.size
      const endIndex = startIndex + pagination.size
      return filtered.slice(startIndex, endIndex)
    }
    return filtered
  }, [allDevices, searchKeyword, pagination.current, pagination.size, runtimeStateFilter, showDeletedFilter])

  const localTotalPages = useMemo(() => {
    if (showDeletedFilter === "active") {
      const filteredCount = allDevices.filter((device) =>
        (device.deviceName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          device.deviceToken.toLowerCase().includes(searchKeyword.toLowerCase())) &&
        (runtimeStateFilter === "all" || device.runtimeState?.toLowerCase() === runtimeStateFilter)).length
      return Math.ceil(filteredCount / pagination.size) || 1
    }
    return pagination.page
  }, [allDevices, searchKeyword, pagination.size, pagination.page, runtimeStateFilter, showDeletedFilter])

  const localTotalRecords = useMemo(() => {
    if (showDeletedFilter === "active") {
      return allDevices.filter((device) =>
        (device.deviceName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          device.deviceToken.toLowerCase().includes(searchKeyword.toLowerCase())) &&
        (runtimeStateFilter === "all" || device.runtimeState?.toLowerCase() === runtimeStateFilter)).length
    }
    return pagination.total
  }, [allDevices, searchKeyword, pagination.total, runtimeStateFilter, showDeletedFilter])

  const handleSearch = () => {
    if (showDeletedFilter === "active") {
      setPagination((prev) => ({ ...prev, current: 1 }))
    }
  }

  const handleFilterChange = (value: "all" | "active") => {
    setShowDeletedFilter(value)
    setSearchKeyword("")
    setPagination({ ...pagination, current: 1 })
    if (value === "all") {
      setRuntimeStateFilter("all")
      const query = replaceSearchParam(new URLSearchParams(searchParams.toString()), "state", null)
      router.replace(query ? `/admin/devices?${query}` : "/admin/devices", {scroll: false})
    }
  }

  const handleRuntimeStateChange = (value: DashboardDeviceFilter) => {
    setRuntimeStateFilter(value)
    setShowDeletedFilter("active")
    setPagination((current) => ({ ...current, current: 1 }))
    const query = replaceSearchParam(new URLSearchParams(searchParams.toString()), "state", value, "all")
    router.replace(query ? `/admin/devices?${query}` : "/admin/devices", {scroll: false})
  }

  const handlePageChange = (newPage: number) => {
    if (showDeletedFilter === "active") {
      setPagination((prev) => ({ ...prev, current: newPage }))
    } else {
      setPagination((prev) => ({ ...prev, current: newPage }))
      fetchDevices(newPage, showDeletedFilter)
    }
  }

  const handleGoToPage = () => {
    const pageNum = Number.parseInt(goToPageInput)
    const maxPage = showDeletedFilter === "active" ? localTotalPages : pagination.page
    if (Number.isNaN(pageNum) || pageNum < 1 || pageNum > maxPage) {
      toast({
        variant: "destructive",
        title: "无效页码",
        description: `请输入 1 到 ${maxPage} 之间的有效页码。`,
      })
      return
    }
    handlePageChange(pageNum)
    setGoToPageInput("")
  }

  const handleAddDevice = async (newDeviceName: string) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/addDevice", token, {
        method: "POST",
        body: JSON.stringify({ deviceName: newDeviceName }),
      })

      if (result.code === 200) {
        toast({
          variant: "success",
          title: "添加成功",
          description: "新设备已成功添加",
        })
        await fetchDevices(1, showDeletedFilter)
        setShowAddDialog(false)
      } else {
        toast({
          variant: "destructive",
          title: "添加失败",
          description: result.msg || "添加新设备时发生错误",
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

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async (updatedData: { id: number; deviceName: string; delete: number }) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return
    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/updateDevice", token, {
        method: "POST",
        body: JSON.stringify(updatedData),
      })

      if (result.code === 200) {
        toast({
          variant: "success",
          title: "保存成功",
          description: "设备信息已更新",
        })
        fetchDevices(pagination.current, showDeletedFilter)
        setShowEditDialog(false)
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.msg || "更新设备信息时发生错误",
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

  const handleChangeDeleteStatus = async (id: number, newStatus: 0 | 1, deviceName: string) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return

    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/updateDevice", token, {
        method: "POST",
        body: JSON.stringify({ id, deviceName, delete: newStatus }),
      })

      if (result.code === 200) {
        toast({
          variant: "success",
          title: "操作成功",
          description: `设备 ${deviceName} 已${newStatus === 1 ? "标记为删除" : "恢复正常"}`,
        })
        setAllDevices((prev) =>
          newStatus === 1
            ? prev.filter((d) => d.id !== id)
            : prev.map((d) => (d.id === id ? { ...d, delete: 0 } : d))
        )
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.msg || `无法${newStatus === 1 ? "标记为删除" : "恢复正常"}设备 ${deviceName}`,
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

  const getDeviceStatusDisplay = (device: Device) => {
    if (device.runtimeState) {
      const meta = getDeviceStatusMeta(device.runtimeState)
      const stateClasses = {
        IDLE: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        BUSY: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
        SUSPENDED: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        OFFLINE: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
      }
      const StateIcon = device.runtimeState === "OFFLINE"
        ? WifiOff : device.runtimeState === "SUSPENDED" ? PauseCircle : Wifi
      return (
        <Badge variant="outline" className={`flex items-center gap-1 ${stateClasses[device.runtimeState]}`}>
          <StateIcon className="h-3 w-3" />
          {meta.label}
        </Badge>
      )
    }

    if (typeof device.status !== "number") {
      return (
        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
          未知状态
        </Badge>
      )
    }

    switch (device.status) {
      case 0:
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <WifiOff className="h-3 w-3" />
            离线
          </Badge>
        )
      case 1:
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            在线 (无任务)
          </Badge>
        )
      case 1001:
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 flex items-center gap-1"
          >
            <CalendarDays className="h-3 w-3" />
            日常任务
          </Badge>
        )
      case 1002:
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 flex items-center gap-1"
          >
            <Swords className="h-3 w-3" />
            肉鸽任务
          </Badge>
        )
      case 1003:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 flex items-center gap-1"
          >
            <Mountain className="h-3 w-3" />
            生息演算
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
            未知状态
          </Badge>
        )
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">设备管理</h1>
        <p className="text-gray-600 dark:text-gray-400">管理系统中的所有设备</p>
      </div>
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">搜索与筛选</CardTitle>
          <CardDescription className="dark:text-gray-400">根据条件查找设备</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="keyword" className="dark:text-white">
                关键词搜索
              </Label>
              <Input
                id="keyword"
                placeholder="设备名称或Token"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="dark:text-white">显示已删除设备</Label>
              <Select value={showDeletedFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择显示状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">不显示已删除</SelectItem>
                  <SelectItem value="all">显示所有</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-white">运行状态</Label>
              <Select value={runtimeStateFilter} onValueChange={(value) => handleRuntimeStateChange(value as DashboardDeviceFilter)}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择运行状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="idle">空闲</SelectItem>
                  <SelectItem value="busy">忙碌</SelectItem>
                  <SelectItem value="suspended">暂停</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              本地搜索
            </Button>
            <Button
              onClick={() => {
                setSearchKeyword("")
                if (showDeletedFilter === "active") {
                  fetchDevices(1, "active")
                }
              }}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重置搜索
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between dark:text-white">
            <div className="flex items-center gap-2">
              <span>设备列表</span>
              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                共 {localTotalRecords} 个设备
              </Badge>
            </div>
            <Button onClick={() => setShowAddDialog(true)} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              添加设备
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="dark:text-white">加载中...</span>
            </div>
          ) : displayedDevices.length > 0 ? (
            <div className="space-y-4">
              {displayedDevices.map((device) => (
                <div
                  key={device.id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500 dark:text-gray-400">设备名称:</span>
                      <span className="font-medium dark:text-white">{device.deviceName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500 dark:text-gray-400">设备Token:</span>
                      <span className="font-medium dark:text-white break-all">{device.deviceToken}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trash className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500 dark:text-gray-400">删除状态:</span>
                      <Badge variant={device.delete === 1 ? "destructive" : "default"}>
                        {device.delete === 1 ? "已删除" : "正常"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">设备状态:</span>
                      {getDeviceStatusDisplay(device)}
                    </div>
                    {showDeletedFilter === "active" && (
                      <>
                        <div className="flex min-w-0 items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-gray-500" />
                          <span className="shrink-0 text-gray-500 dark:text-gray-400">当前账号:</span>
                          <span className="min-w-0 break-words font-medium dark:text-white">
                            {device.currentAccountName || "暂无任务"}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0 text-gray-500" />
                          <span className="shrink-0 text-gray-500 dark:text-gray-400">最后心跳:</span>
                          <span className="min-w-0 break-words font-medium dark:text-white">
                            {formatDashboardTime(device.lastHeartbeatAt)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button
                      size="sm"
                      onClick={() => handleEditDevice(device)}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </Button>
                    {device.delete === 0 ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loading}
                        onClick={() => handleChangeDeleteStatus(device.id, 1, device.deviceName)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        标记为删除
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => handleChangeDeleteStatus(device.id, 0, device.deviceName)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        恢复正常
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  显示第 {(pagination.current - 1) * pagination.size + 1} -{" "}
                  {Math.min(pagination.current * pagination.size, localTotalRecords)} 条，共 {localTotalRecords} 条
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
                    第 {pagination.current} / {localTotalPages} 页
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current >= localTotalPages}
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
              <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">暂无设备数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DeviceEditDialog
        device={selectedDevice}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveEdit}
      />
      <DeviceAddDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSave={handleAddDevice} />
    </DashboardLayout>
  )
}
