import Link from "next/link"
import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react"

import type { AdminDashboardOverview } from "@/lib/admin-dashboard"
import { formatDashboardTime } from "@/lib/admin-dashboard"
import { getTaskStatusMeta } from "@/lib/scheduled-task"

interface ScheduledTaskHealthProps {
  scheduledTasks: AdminDashboardOverview["scheduledTasks"]
}

function statusClassName(status: string): string {
  if (status === "STALLED") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
}

export function ScheduledTaskHealth({ scheduledTasks }: ScheduledTaskHealthProps) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-h-12 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
        <CalendarClock className="h-4 w-4 text-violet-700 dark:text-violet-300" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-950 dark:text-white">脚本任务健康</h2>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          正常 <strong className="font-semibold text-gray-900 dark:text-white">{scheduledTasks.healthy}/{scheduledTasks.total}</strong>
        </span>
        <Link href="/admin/scheduled-tasks?filter=ABNORMAL" className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">
          查看全部
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-3 border-b border-gray-100 text-center text-xs dark:border-gray-700 sm:grid-cols-6">
        {[
          ["全部", scheduledTasks.total],
          ["正常", scheduledTasks.healthy],
          ["运行", scheduledTasks.running],
          ["异常", scheduledTasks.abnormal],
          ["等待", scheduledTasks.waiting],
          ["停用", scheduledTasks.disabled],
        ].map(([label, value]) => (
          <div key={label} className="min-h-14 border-b border-r border-gray-100 px-2 py-2 last:border-r-0 dark:border-gray-700 sm:border-b-0">
            <div className="text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-gray-950 dark:text-white">{value}</div>
          </div>
        ))}
      </div>

      {scheduledTasks.abnormalItems.length === 0 ? (
        <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          脚本任务运行正常
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {scheduledTasks.abnormalItems.map((task) => {
            const meta = getTaskStatusMeta(task.status)
            return (
              <div key={task.key} className="min-h-16 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-950 dark:text-white">{task.name}</span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium ${statusClassName(task.status)}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
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
