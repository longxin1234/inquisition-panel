import Link from "next/link"
import { ArrowRight, Clock3, ListChecks, Zap } from "lucide-react"

import type { AdminDashboardOverview, DashboardTaskItem } from "@/lib/admin-dashboard"
import { formatDashboardTime, formatRunningMinutes } from "@/lib/admin-dashboard"
import { getDispatchSourceLabel } from "@/lib/task-board"

interface TaskSnapshotProps {
  tasks: AdminDashboardOverview["tasks"]
}

function RunningRow({ task }: { task: DashboardTaskItem }) {
  return (
    <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(8rem,0.7fr)_minmax(8rem,0.7fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {task.urgent && <Zap className="h-4 w-4 shrink-0 text-orange-600" aria-label="加急任务" />}
          <span className="truncate text-sm font-medium text-gray-950 dark:text-white">{task.name}</span>
        </div>
        <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
          ID {task.accountId} · {getDispatchSourceLabel(task.dispatchSource) || "自动分配"}
        </div>
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="truncate text-sm text-gray-800 dark:text-gray-200">{task.deviceName || "等待设备"}</div>
        <div className="mt-1 truncate text-xs text-gray-500">{formatDashboardTime(task.assignedAt)}</div>
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="truncate text-sm text-gray-800 dark:text-gray-200">{task.lastProgressTitle || "等待进度"}</div>
        <div className="mt-1 truncate text-xs text-gray-500">{formatRunningMinutes(task.runningMinutes)}</div>
      </div>
      <div className="flex items-center gap-1 self-start whitespace-nowrap text-xs font-medium text-gray-600 sm:self-auto dark:text-gray-300">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {formatRunningMinutes(task.runningMinutes)}
      </div>
    </div>
  )
}

export function TaskSnapshot({ tasks }: TaskSnapshotProps) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-h-12 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
        <ListChecks className="h-4 w-4 text-blue-700 dark:text-blue-300" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-950 dark:text-white">任务运行情况</h2>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>待处理 <strong className="font-semibold text-gray-900 dark:text-white">{tasks.pending + tasks.urgent}</strong></span>
          <span>进行中 <strong className="font-semibold text-gray-900 dark:text-white">{tasks.inProgress}</strong></span>
          <Link href="/admin/tasks" className="flex items-center gap-1 font-medium text-blue-700 hover:underline dark:text-blue-300">
            查看全部
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {tasks.runningItems.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">暂无进行中的任务</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {tasks.runningItems.map((task, index) => (
            <RunningRow key={task.assignmentId || `${task.accountId}-${index}`} task={task} />
          ))}
        </div>
      )}

      {tasks.priorityWaitingItems.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex min-h-9 items-center gap-2 px-4 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            高优先等待
            <span className="ml-auto tabular-nums">{tasks.priorityWaitingItems.length}</span>
          </div>
          <div className="divide-y divide-amber-100 dark:divide-amber-900/60">
            {tasks.priorityWaitingItems.map((task, index) => (
              <div key={`${task.accountId}-${index}`} className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-gray-950 dark:text-white">{task.name}</span>
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {getDispatchSourceLabel(task.dispatchSource) || "高优先级"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
