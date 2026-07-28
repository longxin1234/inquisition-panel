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
  if (state === "OFFLINE") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
  if (state === "SUSPENDED") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
  if (state === "BUSY") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
}

function stateTime(device: DashboardDeviceItem): string {
  if (device.runtimeState === "OFFLINE") return `离线自 ${formatDashboardTime(device.offlineSince)}`
  if (device.runtimeState === "SUSPENDED") return `暂停至 ${formatDashboardTime(device.suspendedUntil)}`
  return `心跳 ${formatDashboardTime(device.lastHeartbeatAt)}`
}

export function DeviceSnapshot({ devices }: DeviceSnapshotProps) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-h-12 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
        <Monitor className="h-4 w-4 text-teal-700 dark:text-teal-300" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-950 dark:text-white">设备状态</h2>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          在线 <strong className="font-semibold text-gray-900 dark:text-white">{devices.online}/{devices.total}</strong>
        </span>
        <Link href="/admin/devices" className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">
          查看全部
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {devices.items.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">暂无设备</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {devices.items.map((device) => {
            const meta = getDeviceStatusMeta(device.runtimeState)
            return (
              <div key={device.deviceId} className="min-h-16 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-950 dark:text-white">
                    {device.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-gray-400">...{device.tokenSuffix}</span>
                  <span className={`flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${stateClassName(device.runtimeState)}`}>
                    <DeviceStateIcon state={device.runtimeState} />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
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
