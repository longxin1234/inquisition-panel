"use client"

import { CardDescription } from "@/components/ui/card"
import { useState, useEffect, useMemo, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, RotateCcw } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { apiRequestWithAuth, getStoredToken } from "@/lib/api-config"

interface CDK {
  id: number
  cdk: string
  type: "daily" | "rouge" | "sand_fire"
  param: number
  tag: string
  used: 0 | 1
}

interface CDKListResponse {
  code: number
  msg: string
  data: {
    cdkList: CDK[]
  }
}

interface CreateCDKPayload {
  type: "daily" | "rouge" | "sand_fire"
  param: number
  tag: string
  count: number
}

export default function ClientCdkPage() {
  const { toast } = useToast()
  const [allCDKs, setAllCDKs] = useState<CDK[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isAddCDKDialogOpen, setIsAddCDKDialogOpen] = useState(false)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("add") === "true") {
      setIsAddCDKDialogOpen(true)
    }
  }, [])
  const [newCdkType, setNewCdkType] = useState<"daily" | "rouge" | "sand_fire">("daily")
  const [newCdkParam, setNewCdkParam] = useState<number>(30)
  const [newCdkTag, setNewCdkTag] = useState("")
  const [newCdkCount, setNewCdkCount] = useState<number>(1)
  const [creatingCdk, setCreatingCdk] = useState(false)
  const [goToPageInput, setGoToPageInput] = useState("")
  const [searchType, setSearchType] = useState<string>("daily")
  const [searchTag, setSearchTag] = useState<string>("")
  const [searchCdkString, setSearchCdkString] = useState<string>("")
  const [filterUsed, setFilterUsed] = useState<string>("all")
  const [filterParam, setFilterParam] = useState<string>("")

  const fetchCDKs = async () => {
    setError(null)
    const token = getStoredToken()
    if (!token) {
      setError("未找到认证令牌，请重新登录。")
      return
    }
    try {
      const result: CDKListResponse = await apiRequestWithAuth("/getProUserInventoryCdk", token)
      if (result.code === 200 && Array.isArray(result.data?.cdkList)) {
        setAllCDKs(result.data.cdkList)
      } else {
        setAllCDKs([])
        setError(result.msg || "获取CDK失败：数据格式无效。")
      }
    } catch (err: any) {
      setError(`获取CDK失败。${err.message || "请重试。"}`)
      setAllCDKs([])
    }
  }

  useEffect(() => {
    startTransition(() => {
      fetchCDKs()
    })
  }, [])

  const filteredCDKs = useMemo(() => {
    let tempCDKs = allCDKs
    if (searchCdkString) {
      tempCDKs = tempCDKs.filter((cdk) => cdk.cdk.toLowerCase().includes(searchCdkString.toLowerCase()))
    }
    if (searchType) {
      tempCDKs = tempCDKs.filter((cdk) => cdk.type === searchType)
    }
    if (searchTag) {
      tempCDKs = tempCDKs.filter((cdk) => cdk.tag.includes(searchTag))
    }
    if (filterUsed !== "all") {
      const usedValue = Number.parseInt(filterUsed)
      tempCDKs = tempCDKs.filter((cdk) => cdk.used === usedValue)
    }
    if (filterParam) {
      const paramValue = Number.parseInt(filterParam)
      if (!isNaN(paramValue)) {
        tempCDKs = tempCDKs.filter((cdk) => cdk.param === paramValue)
      }
    }
    return tempCDKs
  }, [allCDKs, searchCdkString, searchType, searchTag, filterUsed, filterParam])

  const totalPages = Math.ceil(filteredCDKs.length / itemsPerPage)
  const paginatedCDKs = filteredCDKs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleResetFilters = () => {
    setSearchType("daily")
    setSearchTag("")
    setSearchCdkString("")
    setFilterUsed("all")
    setFilterParam("")
    setCurrentPage(1)
    startTransition(() => {
      fetchCDKs()
    })
  }

  const handleCreateCDK = async () => {
    setCreatingCdk(true)
    const token = getStoredToken()
    if (!token) {
      toast({
        title: "创建失败",
        description: "未找到认证令牌，请重新登录。",
        variant: "destructive",
      })
      setCreatingCdk(false)
      return
    }
    try {
      const payload: CreateCDKPayload = {
        type: newCdkType,
        param: newCdkParam,
        tag: newCdkTag,
        count: newCdkCount,
      }
      const result = await apiRequestWithAuth("/createCdkByProUser", token, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (result.code === 200) {
        toast({
          title: "CDK创建成功",
          description: result.msg || `成功创建 ${newCdkCount} 个CDK。`,
        })
        setIsAddCDKDialogOpen(false)
        setNewCdkType("daily")
        setNewCdkParam(30)
        setNewCdkTag("")
        setNewCdkCount(1)
        await fetchCDKs()
      } else {
        toast({
          title: "CDK创建失败",
          description: result.msg || "创建CDK时发生错误。",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "CDK创建失败",
        description: `网络错误或服务器无响应。${err.message || ""}`,
        variant: "destructive",
      })
    } finally {
      setCreatingCdk(false)
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
    handlePageChange(pageNum)
    setGoToPageInput("")
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CDK 管理</h1>
        <p className="text-gray-600 dark:text-gray-400">管理您的CDK</p>
      </div>
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">搜索与筛选</CardTitle>
          <CardDescription className="dark:text-gray-400">根据条件查找 CDK</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="searchType" className="dark:text-white">按类型查询</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger id="searchType" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-popover-foreground">
                  <SelectItem value="daily">日常任务</SelectItem>
                  <SelectItem value="rouge">肉鸽任务</SelectItem>
                  <SelectItem value="sand_fire">生息演算</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchTag" className="dark:text-white">按标签查询</Label>
              <Input id="searchTag" placeholder="输入标签" value={searchTag} onChange={e => setSearchTag(e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchCdkString" className="dark:text-white">本地CDK查询</Label>
              <Input id="searchCdkString" placeholder="输入CDK字符串" value={searchCdkString} onChange={e => setSearchCdkString(e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterUsed" className="dark:text-white">是否已使用</Label>
              <Select value={filterUsed} onValueChange={setFilterUsed}>
                <SelectTrigger id="filterUsed" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-popover-foreground">
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="1">已使用</SelectItem>
                  <SelectItem value="0">未使用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterParam" className="dark:text-white">激活时长</Label>
              <Input id="filterParam" type="number" placeholder="输入时长" value={filterParam} onChange={e => setFilterParam(e.target.value)} className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handleResetFilters} variant="outline" disabled={loading}>
              <RotateCcw className="mr-2 h-4 w-4" />重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-col space-y-2 pb-2">
          <div className="flex flex-row items-center justify-between w-full">
            <CardTitle className="text-2xl font-bold tracking-tight dark:text-white">CDK 列表</CardTitle>
            <Button onClick={() => setIsAddCDKDialogOpen(true)} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />创建 CDK
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 items-center mt-2">
            <Input
              placeholder="CDK码"
              value={searchCdkString}
              onChange={e => setSearchCdkString(e.target.value)}
              className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-popover-foreground">
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="daily">日常任务</SelectItem>
                <SelectItem value="rouge">肉鸽任务</SelectItem>
                <SelectItem value="sand_fire">生息演算</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="标签"
              value={searchTag}
              onChange={e => setSearchTag(e.target.value)}
              className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Select value={filterUsed} onValueChange={setFilterUsed}>
              <SelectTrigger className="w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="是否已使用" />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-popover-foreground">
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">是</SelectItem>
                <SelectItem value="0">否</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 ml-2"><RotateCcw className="mr-1 h-4 w-4" />重置</Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isPending) ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500 dark:text-gray-400">加载中...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 h-40 flex items-center justify-center">{error}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">ID</TableHead>
                    <TableHead className="dark:text-gray-300">CDK</TableHead>
                    <TableHead className="dark:text-gray-300">类型</TableHead>
                    <TableHead className="dark:text-gray-300">激活时长</TableHead>
                    <TableHead className="dark:text-gray-300">标签</TableHead>
                    <TableHead className="dark:text-gray-300">是否已使用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCDKs.length > 0 ? (
                    paginatedCDKs.map((cdk) => (
                      <TableRow key={cdk.id} className="dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-white">{cdk.id}</TableCell>
                        <TableCell className="dark:text-white">{cdk.cdk}</TableCell>
                        <TableCell className="dark:text-white">{cdk.type}</TableCell>
                        <TableCell className="dark:text-white">{cdk.param}</TableCell>
                        <TableCell className="dark:text-white">{cdk.tag}</TableCell>
                        <TableCell className="dark:text-white">{cdk.used === 1 ? "是" : "否"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400">无 CDK 数据。</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredCDKs.length > itemsPerPage && (
                <div className="flex justify-end items-center space-x-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">上一页</Button>
                  <span className="flex items-center px-3 text-sm dark:text-white">第 {currentPage} / {totalPages} 页</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">下一页</Button>
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
                  <Button size="sm" onClick={handleGoToPage} disabled={loading}>跳转</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={isAddCDKDialogOpen} onOpenChange={setIsAddCDKDialogOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">创建新 CDK</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCdkType" className="text-right dark:text-white">类型</Label>
              <Select value={newCdkType} onValueChange={(value) => setNewCdkType(value as "daily" | "rouge" | "sand_fire")}>
                <SelectTrigger className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-popover-foreground">
                  <SelectItem value="daily">日常任务</SelectItem>
                  <SelectItem value="rouge">肉鸽任务</SelectItem>
                  <SelectItem value="sand_fire">生息演算</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCdkParam" className="text-right dark:text-white">激活时长</Label>
              <Input id="newCdkParam" type="number" value={newCdkParam} onChange={(e) => setNewCdkParam(Number.parseInt(e.target.value) || 0)} className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCdkTag" className="text-right dark:text-white">标签</Label>
              <Input id="newCdkTag" value={newCdkTag} onChange={(e) => setNewCdkTag(e.target.value)} className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCdkCount" className="text-right dark:text-white">生成数量</Label>
              <Input id="newCdkCount" type="number" value={newCdkCount} onChange={(e) => setNewCdkCount(Number.parseInt(e.target.value) || 1)} min={1} className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAddCDKDialogOpen(false)} variant="outline" className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">取消</Button>
            <Button onClick={handleCreateCDK} disabled={creatingCdk}>{creatingCdk && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
