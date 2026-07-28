import Link from "next/link"
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react"

import type { DashboardAlertItem } from "@/lib/admin-dashboard"
import { formatDashboardTime } from "@/lib/admin-dashboard"

interface AlertStripProps {
  alerts: DashboardAlertItem[]
}

export function AlertStrip({ alerts }: AlertStripProps) {
  if (alerts.length === 0) {
    return (
      <section
        id="dashboard-alerts"
        className="flex min-h-11 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        当前没有需要处理的异常
      </section>
    )
  }

  return (
    <section id="dashboard-alerts" className="overflow-hidden rounded-md border border-red-200 bg-white dark:border-red-900 dark:bg-gray-800">
      <div className="flex min-h-11 items-center gap-2 border-b border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        异常与提醒
        <span className="ml-auto tabular-nums">{alerts.length} 项</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {alerts.map((alert, index) => (
          <Link
            key={`${alert.type}-${alert.title}-${index}`}
            href={alert.href}
            className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-gray-700/50"
          >
            <span className={`h-2 w-2 rounded-full ${alert.severity === "CRITICAL" ? "bg-red-600" : "bg-amber-500"}`} />
            <span className="min-w-0">
              <span className="block break-words text-sm font-medium text-gray-950 dark:text-white">{alert.title}</span>
              <span className="mt-0.5 block break-words text-xs text-gray-500 dark:text-gray-400">
                {alert.detail || "-"} · {formatDashboardTime(alert.since)}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
