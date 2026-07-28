import Link from "next/link"
import { ArrowRight, CalendarClock, LogIn } from "lucide-react"

import type { AdminDashboardOverview } from "@/lib/admin-dashboard"
import { clampRate, formatDashboardTime } from "@/lib/admin-dashboard"

interface AccountProgressProps {
  accounts: AdminDashboardOverview["accounts"]
}

function taskStateLabel(state: string): string {
  if (state === "RUNNING") return "进行中"
  if (state === "PENDING") return "等待分配"
  if (state === "COOLDOWN") return "冷却中"
  return "待处理"
}

function dispatchLabel(mode: string): string {
  return mode === "SCHEDULED" ? "定时运行" : "自动分配"
}

export function AccountProgress({ accounts }: AccountProgressProps) {
  const rate = clampRate(accounts.loginRate)
  return (
    <section className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-h-12 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
        <LogIn className="h-4 w-4 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-950 dark:text-white">今日账号进度</h2>
        <Link href="/admin/users?login=missing" className="ml-auto flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">
          查看未登录
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-700">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">登录覆盖率</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-950 dark:text-white">{rate}%</div>
          </div>
          <div className="text-right text-sm tabular-nums text-gray-600 dark:text-gray-300">
            {accounts.loggedToday} / {accounts.eligibleDaily}
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded bg-gray-100 dark:bg-gray-700" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate}>
          <div className="h-full rounded bg-cyan-600 transition-[width]" style={{ width: `${rate}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <span className="text-gray-500">未登录 <strong className="ml-1 text-gray-900 dark:text-white">{accounts.missingLogin}</strong></span>
          <span className="text-gray-500">冻结 <strong className="ml-1 text-gray-900 dark:text-white">{accounts.frozen}</strong></span>
          <span className="text-gray-500">冷却 <strong className="ml-1 text-gray-900 dark:text-white">{accounts.coolingDown}</strong></span>
          <span className="text-gray-500">7天内到期 <strong className="ml-1 text-gray-900 dark:text-white">{accounts.expiringWithinSevenDays}</strong></span>
        </div>
      </div>

      {accounts.missingItems.length === 0 ? (
        <div className="flex min-h-24 items-center justify-center text-sm text-gray-500 dark:text-gray-400">今日账号均已登录</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {accounts.missingItems.map((account) => (
            <div key={account.accountId} className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-950 dark:text-white">{account.name}</div>
                <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  ID {account.accountId} · {dispatchLabel(account.dispatchMode)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{taskStateLabel(account.currentTaskState)}</div>
                {account.nextScheduledAt && (
                  <div className="mt-0.5 flex items-center justify-end gap-1 whitespace-nowrap text-xs text-gray-500">
                    <CalendarClock className="h-3 w-3" aria-hidden="true" />
                    {formatDashboardTime(account.nextScheduledAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
