"use client"

import type React from "react"
import Link from "next/link"
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useSidebarState } from "@/components/sidebar-context"
import { cn } from "@/lib/utils"
import {
  getWorkspaceNavigation,
  rolePresentation,
  type WorkspaceRole,
} from "@/components/workbench/navigation"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
  isMobileDrawer?: boolean
}

function isItemActive(pathname: string | null | undefined, href: string) {
  if (!pathname || typeof pathname !== "string" || !href) return false
  if (pathname === href) return true
  if (href.endsWith("/dashboard")) return false
  return pathname.startsWith(`${href}/`)
}

export function Sidebar({ className, onClose, isMobileDrawer = false, ...props }: SidebarProps) {
  const { userType, logout } = useAuth()
  const { collapsed, toggleCollapsed } = useSidebarState()
  const router = useRouter()
  const pathname = usePathname()
  const role = userType as WorkspaceRole | null
  const navigation = getWorkspaceNavigation(role)
  const presentation = role ? rolePresentation[role] : null
  const RoleIcon = presentation?.icon

  // 移动端抽屉始终展开，桌面端根据状态折叠
  const isCollapsed = !isMobileDrawer && collapsed

  const handleLogout = () => {
    logout()
    onClose?.()
    router.push("/")
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        className
      )}
      aria-label="主导航"
      {...props}
    >
      {/* 顶部 Logo 与收起/展开控制栏 */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border transition-all duration-300",
          isCollapsed ? "flex-col justify-center gap-1 px-1 py-2" : "justify-between px-3"
        )}
      >
        <div className={cn("flex items-center min-w-0", isCollapsed ? "justify-center" : "gap-3 flex-1")}>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent shadow-sm">
            <img
              src="/icon.png"
              alt="终末地控制台"
              className="h-full w-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">终末地控制台</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-sidebar-foreground/60">
                {RoleIcon && <RoleIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                {presentation?.label ?? "控制工作台"}
              </p>
            </div>
          )}
        </div>

        {/* 顶部红框位置：收起/展开按钮（移动端隐藏） */}
        {!isMobileDrawer && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className={cn(
              "h-8 w-8 shrink-0 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              isCollapsed && "h-6 w-6 mt-0.5"
            )}
            title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
            aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      {/* 导航菜单列表（统一平铺无分组） */}
      <nav className={cn("workspace-scrollbar min-h-0 flex-1 overflow-y-auto py-3", isCollapsed ? "px-1.5" : "px-2.5")}>
        {navigation.map((group, groupIndex) => (
          <div key={group.label || groupIndex} className={cn(groupIndex > 0 && group.label && "mt-4")}>
            {group.label && !isCollapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.title : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-9 items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                      isCollapsed ? "justify-center px-0 py-2 w-full" : "gap-2.5 px-2.5 py-2",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 底部退出登录 */}
      <div className={cn("shrink-0 border-t border-sidebar-border", isCollapsed ? "p-1.5" : "p-2.5")}>
        <Button
          type="button"
          variant="ghost"
          title={isCollapsed ? "退出登录" : undefined}
          className={cn(
            "h-9 text-sidebar-foreground/65 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors",
            isCollapsed ? "w-full justify-center px-0" : "w-full justify-start px-2.5"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span className="ml-2.5 truncate">退出登录</span>}
        </Button>
      </div>
    </aside>
  )
}
