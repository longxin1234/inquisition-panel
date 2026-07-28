"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

interface DashboardLayoutProps {
  children: React.ReactNode
  contentClassName?: string
}

export function DashboardLayout({ children, contentClassName = "max-w-7xl" }: DashboardLayoutProps) {
  const isMobile = useMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {!isMobile && (
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
          <Sidebar />
        </div>
      )}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 dark:text-white" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">审判庭管理系统</h1>
          <div className="w-10"></div>
        </div>
      )}

      <div className={`flex-1 p-6 overflow-auto ${isMobile ? "pt-20" : ""}`}>
        <div className={`${contentClassName} mx-auto`}>{children}</div>
      </div>
    </div>
  )
}
