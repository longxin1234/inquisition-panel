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
        className="flex min-h-14 items-center gap-3 rounded-lg border border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.07)] px-4 text-sm text-[hsl(var(--status-success))]"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[hsl(var(--status-success)/0.12)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <span>
          <strong className="font-semibold">异常队列已清空</strong>
          <span className="ml-2 text-xs text-muted-foreground">当前没有需要处理的异常</span>
        </span>
      </section>
    )
  }

  return (
    <section id="dashboard-alerts" className="overflow-hidden rounded-lg border border-destructive/25 bg-card text-card-foreground">
      <div className="flex min-h-12 items-center gap-2 border-b border-destructive/20 bg-destructive/5 px-4 text-sm font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        优先处理
        <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-xs tabular-nums">{alerts.length} 项</span>
      </div>
      <div className="divide-y divide-border">
        {alerts.map((alert, index) => (
          <Link
            key={`${alert.type}-${alert.title}-${index}`}
            href={alert.href}
            className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className={`h-2 w-2 rounded-full ${alert.severity === "CRITICAL" ? "bg-destructive" : "bg-[hsl(var(--status-warning))]"}`} />
            <span className="min-w-0">
              <span className="block break-words text-sm font-medium text-foreground">{alert.title}</span>
              <span className="mt-0.5 block break-words text-xs leading-5 text-muted-foreground">
                {alert.detail || "-"} · {formatDashboardTime(alert.since)}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
