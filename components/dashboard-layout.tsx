"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { SidebarProvider, useSidebarState } from "@/components/sidebar-context"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { ConnectivityNotice } from "@/components/workbench/connectivity-notice"
import { WorkspaceTopbar } from "@/components/workbench/workspace-topbar"
import type { WorkspaceRole } from "@/components/workbench/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
  contentClassName?: string
}

function DashboardLayoutContent({ children, contentClassName = "w-full max-w-[1680px]" }: DashboardLayoutProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const { userType } = useAuth()
  const role = userType as WorkspaceRole | null
  const { collapsed } = useSidebarState()

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#workspace-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        跳到主要内容
      </a>

      {/* 桌面端常驻左侧侧边栏 */}
      <div
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:block",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <Sidebar className="sticky top-0 h-dvh" />
      </div>

      {/* 点击左侧三条横线呼出的移动端抽屉侧边栏 */}
      <Sheet open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
        <SheetContent side="left" className="w-[min(88vw,19rem)] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">工作台导航</SheetTitle>
          <SheetDescription className="sr-only">工作台侧边栏抽屉导航菜单</SheetDescription>
          <Sidebar onClose={() => setIsNavigationOpen(false)} isMobileDrawer />
        </SheetContent>
      </Sheet>

      {/* 右侧主工作区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar role={role} onOpenNavigation={() => setIsNavigationOpen(true)} />
        <ConnectivityNotice />
        <main id="workspace-content" tabIndex={-1} className="flex-1">
          <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8", contentClassName)}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent {...props} />
    </SidebarProvider>
  )
}
