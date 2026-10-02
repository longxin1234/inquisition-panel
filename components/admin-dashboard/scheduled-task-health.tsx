import Link from "next/link"
import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react"

import type { AdminDashboardOverview } from "@/lib/admin-dashboard"
import { formatDashboardTime } from "@/lib/admin-dashboard"
import { getTaskStatusMeta } from "@/lib/scheduled-task"

interface ScheduledTaskHealthProps {
  scheduledTasks: AdminDashboardOverview["scheduledTasks"]
}

function statusClassName(status: string): string {
  if (status === "STALLED") return "border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]"
  return "border-destructive/25 bg-destructive/10 text-destructive"
}

export function ScheduledTaskHealth({ scheduledTasks }: ScheduledTaskHealthProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <div className="flex min-h-14 items-center gap-2 border-b border-border px-4">
        <CalendarClock className="h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">脚本任务健康</h2>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>正常 <strong className="font-semibold text-foreground">{scheduledTasks.healthy}/{scheduledTasks.total}</strong></span>
          <Link href="/admin/scheduled-tasks?filter=ABNORMAL" className="flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            查看全部
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-border bg-muted/30 text-center text-xs sm:grid-cols-6">
        {[
          ["全部", scheduledTasks.total],
          ["正常", scheduledTasks.healthy],
          ["运行", scheduledTasks.running],
          ["异常", scheduledTasks.abnormal],
          ["等待", scheduledTasks.waiting],
          ["停用", scheduledTasks.disabled],
        ].map(([label, value]) => (
          <div key={label} className="min-h-14 border-b border-r border-border px-2 py-2 last:border-r-0 sm:border-b-0">
            <div className="text-muted-foreground">{label}</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {scheduledTasks.abnormalItems.length === 0 ? (
        <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-[hsl(var(--status-success))]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          脚本任务运行正常
        </div>
      ) : (
        <div className="divide-y divide-border">
          {scheduledTasks.abnormalItems.map((task) => {
            const meta = getTaskStatusMeta(task.status)
            return (
              <div key={task.key} className="min-h-16 px-4 py-3 transition-colors hover:bg-accent/40">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{task.name}</span>
                  <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-xs font-medium ${statusClassName(task.status)}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate" title={task.lastError || undefined}>{task.lastError || "无错误摘要"}</span>
                  <span className="shrink-0 whitespace-nowrap">下次 {formatDashboardTime(task.nextRunAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
