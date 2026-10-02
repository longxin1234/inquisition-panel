import Link from "next/link"
import { ArrowRight, Monitor, PauseCircle, Wifi, WifiOff } from "lucide-react"

import type { AdminDashboardOverview, DashboardDeviceItem } from "@/lib/admin-dashboard"
import { formatDashboardTime, getDeviceStatusMeta } from "@/lib/admin-dashboard"

interface DeviceSnapshotProps {
  devices: AdminDashboardOverview["devices"]
}

function DeviceStateIcon({ state }: { state: DashboardDeviceItem["runtimeState"] }) {
  if (state === "OFFLINE") return <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
  if (state === "SUSPENDED") return <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
  return <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
}

function stateClassName(state: DashboardDeviceItem["runtimeState"]): string {
  if (state === "OFFLINE") return "border-destructive/25 bg-destructive/10 text-destructive"
  if (state === "SUSPENDED") return "border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))]"
  if (state === "BUSY") return "border-[hsl(var(--status-info)/0.25)] bg-[hsl(var(--status-info)/0.1)] text-[hsl(var(--status-info))]"
  return "border-[hsl(var(--status-success)/0.25)] bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]"
}

function stateTime(device: DashboardDeviceItem): string {
  if (device.runtimeState === "OFFLINE") return `离线自 ${formatDashboardTime(device.offlineSince)}`
  if (device.runtimeState === "SUSPENDED") return `暂停至 ${formatDashboardTime(device.suspendedUntil)}`
  return `心跳 ${formatDashboardTime(device.lastHeartbeatAt)}`
}

export function DeviceSnapshot({ devices }: DeviceSnapshotProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <div className="flex min-h-14 items-center gap-2 border-b border-border px-4">
        <Monitor className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">设备状态</h2>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>在线 <strong className="font-semibold text-foreground">{devices.online}/{devices.total}</strong></span>
          <Link href="/admin/devices" className="flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            查看全部
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {devices.items.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">暂无设备</div>
      ) : (
        <div className="divide-y divide-border">
          {devices.items.map((device) => {
            const meta = getDeviceStatusMeta(device.runtimeState)
            return (
              <div key={device.deviceId} className="min-h-16 px-4 py-3 transition-colors hover:bg-accent/40">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {device.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">...{device.tokenSuffix}</span>
                  <span className={`flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium ${stateClassName(device.runtimeState)}`}>
                    <DeviceStateIcon state={device.runtimeState} />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate">{device.currentAccountName || "暂无任务"}</span>
                  <span className="shrink-0 whitespace-nowrap">{stateTime(device)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
