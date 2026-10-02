"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  RefreshCw,
  Search,
  TerminalSquare,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"

interface LogItem {
  id: number
  level: string
  taskType: string
  title: string
  detail: string
  imageUrl?: string
  from?: string | null
  server?: number
  name: string
  account: string
  stage?: string
  failureReason?: string
  time: string
  delete?: number
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false })
}

function isWarning(level: string) {
  return /warn|error|fail|异常|失败/i.test(level)
}

export default function UserLogs() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<LogItem | null>(null)

  const getToken = useCallback(() => contextToken || getStoredToken(), [contextToken])

  const fetchLogs = useCallback(async (pageNumber: number, background = false) => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      setError("登录状态已失效，请重新登录")
      setLoading(false)
      return
    }

    if (background) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await apiRequestWithAuth(`/admin/control/user-logs?current=${pageNumber}&size=${pageSize}`, token, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      if (result && result.code === 200 && result.data) {
        const data = result.data as { records?: LogItem[]; total?: number; current?: number }
        setLogs(data.records || [])
        setTotal(data.total || 0)
        setError(null)
      } else {
        setLogs([])
        setTotal(0)
        setError(null)
      }
    } catch {
      setLogs([])
      setTotal(0)
      setError(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getToken, pageSize, toast])

  useEffect(() => {
    void fetchLogs(page)
  }, [fetchLogs, page])

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return logs
    return logs.filter((log) => [log.title, log.detail, log.taskType, log.stage, log.failureReason]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized)))
  }, [logs, query])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <DashboardLayout contentClassName="max-w-[1320px]">
      <main className="space-y-5">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">RUN HISTORY</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">运行记录</h1>
            <p className="mt-2 text-sm text-muted-foreground">按时间回看任务结果、执行阶段、错误和现场截图。</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchLogs(page, true)} disabled={refreshing} className="self-start sm:self-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "刷新中" : "刷新记录"}
          </Button>
        </header>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选本页的任务、阶段或错误" className="h-9 pl-9" aria-label="筛选本页运行记录" />
            </div>
            <div className="text-xs text-muted-foreground">共 {total} 条 · 当前第 {page} 页</div>
          </div>

          {loading ? (
            <LogListSkeleton />
          ) : error ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">运行记录加载失败</h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => void fetchLogs(page)}>重新加载</Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground"><TerminalSquare className="h-5 w-5" /></div>
              <h2 className="font-semibold">还没有运行记录</h2>
              <p className="max-w-md text-sm text-muted-foreground">任务首次执行后，结果、阶段和错误信息会出现在这里。</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
              <Search className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">本页没有匹配结果</h2>
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>清除筛选</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <article key={log.id} className="grid gap-4 px-4 py-4 transition-colors hover:bg-muted/35 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:px-5">
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />{formatDate(log.time)}</div>
                    <div className="mt-2 truncate">{log.taskType || "任务记录"}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isWarning(log.level) ? "destructive" : "secondary"} className="h-5 px-1.5 text-[10px]">{log.level || "INFO"}</Badge>
                      {log.stage && <span className="text-xs text-muted-foreground">阶段：{log.stage}</span>}
                    </div>
                    <h2 className="mt-2 text-sm font-semibold">{log.title || "运行记录"}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{log.detail || "没有更多说明"}</p>
                    {log.failureReason && <p className="mt-2 text-sm text-destructive">失败原因：{log.failureReason}</p>}
                  </div>
                  <div className="flex items-start justify-end gap-2">
                    {log.imageUrl && (
                      <Button variant="outline" size="sm" onClick={() => setSelected(log)}>
                        <ImageIcon className="mr-2 h-4 w-4" />查看截图
                      </Button>
                    )}
                    {!isWarning(log.level) && <CheckCircle2 className="mt-2 h-4 w-4 text-emerald-600" aria-label="正常记录" />}
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                <ChevronLeft className="mr-1 h-4 w-4" />上一页
              </Button>
              <span className="text-xs text-muted-foreground">第 {page} / {totalPages} 页</span>
              <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
                下一页<ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      </main>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selected?.title || "运行截图"}</DialogTitle>
            <DialogDescription>{selected ? `${formatDate(selected.time)} · ${selected.taskType}` : ""}</DialogDescription>
          </DialogHeader>
          {selected?.imageUrl && <img src={selected.imageUrl} alt={`${selected.title || "运行记录"}截图`} className="max-h-[72vh] w-full rounded-lg border border-border object-contain" />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function LogListSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="正在加载运行记录">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid gap-4 px-5 py-5 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
          <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}
