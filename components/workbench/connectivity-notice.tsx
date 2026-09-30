"use client"

import { WifiOff } from "lucide-react"
import { useConnectivity } from "@/components/workbench/use-connectivity"

export function ConnectivityNotice() {
  const isOnline = useConnectivity()

  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-2 text-sm font-medium text-foreground"
    >
      <WifiOff className="h-4 w-4 text-destructive" aria-hidden="true" />
      网络连接已断开，当前内容可能不是最新状态。
    </div>
  )
}
