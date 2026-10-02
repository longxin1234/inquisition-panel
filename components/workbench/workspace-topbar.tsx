"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Bell, Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { AnnouncementDialog } from "@/components/announcement-dialog"
import { WorkspaceNavMenu } from "@/components/workbench/workspace-nav-menu"
import {
  getCurrentNavigationItem,
  rolePresentation,
  type WorkspaceRole,
} from "@/components/workbench/navigation"
import { useConnectivity } from "@/components/workbench/use-connectivity"

interface WorkspaceTopbarProps {
  role: WorkspaceRole | null
  onOpenNavigation?: () => void
}

export function WorkspaceTopbar({ role, onOpenNavigation }: WorkspaceTopbarProps) {
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const pathname = usePathname()
  const currentItem = getCurrentNavigationItem(role, pathname)
  const roleLabel = role ? rolePresentation[role].label : "终末地控制台"
  const isOnline = useConnectivity()
  const isAdmin = role === "admin" || (typeof pathname === "string" && pathname.startsWith("/admin"))

  return (
    <header className={cn(
      "surface-divider sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6 lg:px-8",
      isAdmin && "lg:hidden"
    )}>
      {/* 左侧：三条横线侧边栏触发按钮与当前模块标题 */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenNavigation && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenNavigation}
            className="h-9 w-9 shrink-0 rounded-xl border border-border/70 bg-muted/40 text-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 lg:hidden"
            aria-label="打开侧边栏"
            title="打开侧边栏"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {isAdmin ? (
          currentItem && (
            <div className="flex items-center min-w-0 pl-1">
              <span className="text-sm font-semibold tracking-tight text-foreground truncate">
                {currentItem.title}
              </span>
            </div>
          )
        ) : (
          <Link
            href="/user/dashboard"
            className="group flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
              <img
                src="/icon.png"
                alt="终末地控制台"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                终末地控制台
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {roleLabel}
              </p>
            </div>
          </Link>
        )}

        {!isAdmin && currentItem && (
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border/60">
            <span className="text-xs font-medium text-muted-foreground/70">/</span>
            <span className="text-xs font-medium text-foreground/90">{currentItem.title}</span>
          </div>
        )}
      </div>

      {/* 右侧操作区：网络状态、搜索、主题、公告铃铛、图2汉堡弹窗菜单 */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-1.5 px-2 text-xs text-muted-foreground xl:flex">
          <span
            className={
              isOnline
                ? "h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))]"
                : "h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-error))]"
            }
            aria-hidden="true"
          />
          {isOnline ? "网络正常" : "已离线"}
        </div>
        <ThemeToggle />

        {/* 公告铃铛按钮（对齐图 2 黄色质感铃铛） */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setAnnouncementOpen(true)}
          className="relative h-9 w-9 rounded-xl border border-border/70 bg-muted/40 text-amber-500 hover:bg-muted hover:text-amber-600 transition-all active:scale-95"
          aria-label="查看系统公告"
          title="系统公告"
        >
          <Bell className="h-4 w-4 fill-amber-500/20" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        </Button>

        {/* 非管理端保留功能菜单弹窗 */}
        {!isAdmin && <WorkspaceNavMenu role={role} />}
      </div>

      <AnnouncementDialog
        open={announcementOpen}
        onOpenChange={setAnnouncementOpen}
      />
    </header>
  )
}
