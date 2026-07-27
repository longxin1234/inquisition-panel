"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Smartphone,
  LogOut,
  User,
  Shield,
  Crown,
  Gift,
  UserCog,
  ScrollText,
  SlidersHorizontal,
  CalendarClock,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const { userType, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose?.()
  }

  const getMenuItems = () => {
    const baseItems = [
      {
        title: "总览",
        icon: LayoutDashboard,
        href: `/${userType}/dashboard`,
      },
    ]

    if (userType === "user") {
      return [
        ...baseItems,
        {
          title: "账户配置",
          icon: User,
          href: "/user/account",
        },
        {
          title: "我的日志",
          icon: FileText,
          href: "/user/logs",
        },
        {
          title: "其他设置",
          icon: SlidersHorizontal,
          href: "/user/settings",
        },
      ]
    }

    if (userType === "admin") {
      return [
        ...baseItems,
        {
          title: "用户管理",
          icon: Users,
          href: "/admin/users",
        },
        {
          title: "代理管理",
          icon: UserCog,
          href: "/admin/agents",
        },
        {
          title: "任务管理",
          icon: Settings,
          href: "/admin/tasks",
        },
        {
          title: "设备管理",
          icon: Smartphone,
          href: "/admin/devices",
        },
        {
          title: "CDK管理",
          icon: Gift,
          href: "/admin/cdk",
        },
        {
          title: "日志管理",
          icon: ScrollText,
          href: "/admin/logs",
        },
        {
          title: "脚本任务",
          icon: CalendarClock,
          href: "/admin/scheduled-tasks",
        },
        {
          title: "其他设置",
          icon: SlidersHorizontal,
          href: "/admin/settings",
        },
      ]
    }

    if (userType === "prouser") {
      return [
        ...baseItems,
        {
          title: "附属用户",
          icon: Users,
          href: "/prouser/subusers",
        },
        {
          title: "CDK管理",
          icon: Gift,
          href: "/prouser/cdk",
        },
        {
          title: "其他设置",
          icon: SlidersHorizontal,
          href: "/prouser/settings",
        },
      ]
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="space-y-4 py-4 mb-0 flex-1">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {userType === "admin" && <Shield className="w-5 h-5 dark:text-white" />}
              {userType === "user" && <User className="w-5 h-5 dark:text-white" />}
              {userType === "prouser" && <Crown className="w-5 h-5 dark:text-white" />}
              <h2 className="text-lg font-semibold tracking-tight dark:text-white">
                {userType === "admin" && "管理员面板"}
                {userType === "user" && "用户面板"}
                {userType === "prouser" && "代理用户面板"}
              </h2>
            </div>
            <ThemeToggle />
          </div>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "dark:text-white dark:hover:bg-gray-700 hover:bg-gray-100",
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="mt-auto px-3 pb-4 pt-2 border-t dark:border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </Button>
      </div>
    </div>
  )
}
