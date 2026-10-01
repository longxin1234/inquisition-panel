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

function DashboardLayoutContent({ children, contentClassName = "max-w-7xl" }: DashboardLayoutProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const { userType } = useAuth()
  const role = userType as WorkspaceRole | null
  const { collapsed } = useSidebarState()

  return (
    <div className="flex h-dvh min-h-[36rem] overflow-hidden bg-background">
      <a
        href="#workspace-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        跳到主要内容
      </a>

      <div
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border transition-all duration-300 ease-in-out lg:block",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <Sidebar />
      </div>

      <Sheet open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
        <SheetContent side="left" className="w-[min(88vw,19rem)] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">工作台导航</SheetTitle>
          <SheetDescription className="sr-only">移动端工作台抽屉导航菜单</SheetDescription>
          <Sidebar onClose={() => setIsNavigationOpen(false)} isMobileDrawer />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar role={role} onOpenNavigation={() => setIsNavigationOpen(true)} />
        <ConnectivityNotice />
        <main
          id="workspace-content"
          tabIndex={-1}
          className="workspace-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className={cn("mx-auto w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8", contentClassName)}>
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
