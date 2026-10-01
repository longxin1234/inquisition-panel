"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { ConnectivityNotice } from "@/components/workbench/connectivity-notice"
import { WorkspaceTopbar } from "@/components/workbench/workspace-topbar"
import type { WorkspaceRole } from "@/components/workbench/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
  contentClassName?: string
}

export function DashboardLayout({ children, contentClassName = "max-w-7xl" }: DashboardLayoutProps) {
  const { userType } = useAuth()
  const role = userType as WorkspaceRole | null

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#workspace-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        跳到主要内容
      </a>

      {/* 顶部通栏导航（包含品牌Logo、快捷搜索、主题切换、公告铃铛、图2同款浮动菜单） */}
      <WorkspaceTopbar role={role} />
      <ConnectivityNotice />

      {/* 全宽主工作区：彻底移除左侧边栏，解放横向视野 */}
      <main
        id="workspace-content"
        tabIndex={-1}
        className="workspace-scrollbar flex-1 overflow-y-auto overscroll-contain"
      >
        <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8", contentClassName)}>
          {children}
        </div>
      </main>
    </div>
  )
}
