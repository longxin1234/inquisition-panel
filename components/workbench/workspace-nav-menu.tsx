"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  FileText,
  Gift,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Shield,
  SlidersHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  getWorkspaceNavigation,
  type WorkspaceRole,
} from "@/components/workbench/navigation"

interface WorkspaceNavMenuProps {
  role: WorkspaceRole | null
}

export function WorkspaceNavMenu({ role }: WorkspaceNavMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // 针对普通用户（user），高精度还原图 2 的优雅菜单体系
  const isUserRole = !role || role === "user"

  // 统一用户端导航项
  const userMenuItems = [
    { title: "控制台首页", href: "/user/dashboard", icon: LayoutDashboard },
    { title: "运行记录", href: "/user/logs", icon: FileText },
    { title: "CDK续费", href: "/user/cdk", icon: Gift },
    { title: "邮箱通知", href: "/user/notice", icon: Mail },
    { title: "使用说明", href: "/user/guide", icon: BookOpen },
    { title: "工单反馈", href: "/user/feedback", icon: MessageSquare },
    { title: "修改密码", href: "/user/settings", icon: Lock },
  ]

  // 其他角色（admin / prouser）按原有导航渲染
  const otherNavigation = getWorkspaceNavigation(role)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl border border-border/70 bg-muted/40 text-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80 focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="功能菜单"
          title="功能菜单"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      {/* 对齐图 2：大圆角、精美立体阴影、毛玻璃卡片 */}
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-48 rounded-2xl border border-border/80 bg-card/98 p-1.5 shadow-2xl backdrop-blur-md"
      >
        {isUserRole ? (
          <div className="space-y-0.5">
            {userMenuItems.map((item) => {
              const active =
                Boolean(pathname) && (
                  pathname === item.href ||
                  (item.href !== "/user/dashboard" && typeof pathname === "string" && pathname.startsWith(`${item.href}/`))
                )

              return (
                <DropdownMenuItem asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer select-none",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-foreground/70")} />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
        ) : (
          <div className="space-y-0.5">
            {(otherNavigation || []).flatMap((g) => g?.items || []).map((item) => {
              const active = pathname === item.href

              return (
                <DropdownMenuItem asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer select-none",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-foreground/70" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}

        <DropdownMenuSeparator className="my-1.5 bg-border/60" />

        {/* 对齐图 2：红色退出登录 */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-500 transition-colors cursor-pointer select-none hover:bg-rose-500/10 hover:text-rose-600 focus:bg-rose-500/10 focus:text-rose-600"
        >
          <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
