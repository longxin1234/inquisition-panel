import Link from "next/link"
import { AlertTriangle, ListTodo, LogIn, MonitorCheck, PlayCircle, Users } from "lucide-react"

import type { AdminDashboardOverview } from "@/lib/admin-dashboard"

interface OverviewMetricsProps {
  overview: AdminDashboardOverview
}

export function OverviewMetrics({ overview }: OverviewMetricsProps) {
  const items = [
    {
      label: "有效日常",
      value: overview.accounts.eligibleDaily,
      detail: `有效账号 ${overview.business.validAccounts}`,
      href: "/admin/users",
      icon: Users,
      accent: "text-teal-700 dark:text-teal-300",
    },
    {
      label: "今日已登录",
      value: `${overview.accounts.loggedToday}/${overview.accounts.eligibleDaily}`,
      detail: `未登录 ${overview.accounts.missingLogin} · ${overview.accounts.loginRate}%`,
      href: "/admin/users?login=missing",
      icon: LogIn,
      accent: "text-cyan-700 dark:text-cyan-300",
    },
    {
      label: "待处理",
      value: overview.tasks.pending + overview.tasks.urgent,
      detail: `加急 ${overview.tasks.urgent} · 定时 ${overview.tasks.scheduledWaiting}`,
      href: "/admin/tasks?tab=pending",
      icon: ListTodo,
      accent: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "进行中",
      value: overview.tasks.inProgress,
      detail: `超过2小时 ${overview.tasks.longRunning}`,
      href: "/admin/tasks?tab=inProgress",
      icon: PlayCircle,
      accent: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "在线设备",
      value: `${overview.devices.online}/${overview.devices.total}`,
      detail: `空闲 ${overview.devices.idle} · 忙碌 ${overview.devices.busy} · 离线 ${overview.devices.offline}`,
      href: "/admin/devices",
      icon: MonitorCheck,
      accent: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "异常项",
      value: overview.alertCount,
      detail: overview.alertCount === 0 ? "当前正常" : "需要处理",
      href: overview.alertCount === 0 ? "/admin/dashboard" : "#dashboard-alerts",
      icon: AlertTriangle,
      accent: overview.alertCount === 0
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-red-700 dark:text-red-300",
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="运营指标">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex min-h-28 min-w-0 flex-col justify-between rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-800/80"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
            <item.icon className={`h-4 w-4 shrink-0 ${item.accent}`} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold tabular-nums text-gray-950 dark:text-white">
              {item.value}
            </div>
            <div className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500 dark:text-gray-400">
              {item.detail}
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}
