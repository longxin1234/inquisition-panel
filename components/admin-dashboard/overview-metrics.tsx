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
      accent: "text-foreground",
    },
    {
      label: "今日已登录",
      value: `${overview.accounts.loggedToday}/${overview.accounts.eligibleDaily}`,
      detail: `未登录 ${overview.accounts.missingLogin} · ${overview.accounts.loginRate}%`,
      href: "/admin/users?login=missing",
      icon: LogIn,
      accent: overview.accounts.missingLogin > 0 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-success))]",
    },
    {
      label: "待处理",
      value: overview.tasks.pending + overview.tasks.urgent,
      detail: `加急 ${overview.tasks.urgent} · 定时 ${overview.tasks.scheduledWaiting}`,
      href: "/admin/tasks?tab=pending",
      icon: ListTodo,
      accent: overview.tasks.urgent > 0 ? "text-[hsl(var(--status-warning))]" : "text-muted-foreground",
    },
    {
      label: "进行中",
      value: overview.tasks.inProgress,
      detail: `超过2小时 ${overview.tasks.longRunning}`,
      href: "/admin/tasks?tab=inProgress",
      icon: PlayCircle,
      accent: "text-[hsl(var(--status-info))]",
    },
    {
      label: "在线设备",
      value: `${overview.devices.online}/${overview.devices.total}`,
      detail: `空闲 ${overview.devices.idle} · 忙碌 ${overview.devices.busy} · 离线 ${overview.devices.offline}`,
      href: "/admin/devices",
      icon: MonitorCheck,
      accent: overview.devices.offline > 0 ? "text-red-600 dark:text-red-400" : "text-[hsl(var(--status-success))]",
    },
    {
      label: "异常项",
      value: overview.alertCount,
      detail: overview.alertCount === 0 ? "当前正常" : "需要处理",
      href: overview.alertCount === 0 ? "/admin/dashboard" : "#dashboard-alerts",
      icon: AlertTriangle,
      accent: overview.alertCount === 0
        ? "text-[hsl(var(--status-success))]"
        : "text-destructive",
    },
  ]

  return (
    <section
      className="grid overflow-hidden rounded-lg border border-border bg-card text-card-foreground sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
      aria-label="运营指标"
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="group relative flex min-h-24 min-w-0 flex-col justify-between border-b border-border px-4 py-3.5 transition-colors hover:bg-accent/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:border-r md:min-h-28 xl:border-b-0 xl:last:border-r-0"
        >
          <div className="flex items-center gap-2">
            <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.accent}`} aria-hidden="true" />
            <span className="truncate text-xs font-medium text-muted-foreground">{item.label}</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {item.value}
            </div>
            <div className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
              {item.detail}
            </div>
          </div>
          <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform group-hover:scale-x-100" aria-hidden="true" />
        </Link>
      ))}
    </section>
  )
}
