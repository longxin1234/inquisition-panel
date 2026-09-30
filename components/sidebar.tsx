"use client"

import type React from "react"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  getWorkspaceNavigation,
  rolePresentation,
  type WorkspaceRole,
} from "@/components/workbench/navigation"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

function isItemActive(pathname: string, href: string) {
  if (pathname === href) return true
  if (href.endsWith("/dashboard")) return false
  return pathname.startsWith(`${href}/`)
}

export function Sidebar({ className, onClose, ...props }: SidebarProps) {
  const { userType, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const role = userType as WorkspaceRole | null
  const navigation = getWorkspaceNavigation(role)
  const presentation = role ? rolePresentation[role] : null
  const RoleIcon = presentation?.icon

  const handleLogout = () => {
    logout()
    onClose?.()
    router.push("/")
  }

  return (
    <aside
      className={cn("flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground", className)}
      aria-label="主导航"
      {...props}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-black tracking-tight text-sidebar-primary-foreground">
          终
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">终末地控制台</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-sidebar-foreground/60">
            {RoleIcon && <RoleIcon className="h-3.5 w-3.5" aria-hidden="true" />}
            {presentation?.label ?? "控制工作台"}
          </p>
        </div>
      </div>

      <nav className="workspace-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && "mt-5")}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full justify-start px-2.5 text-sidebar-foreground/65 hover:bg-red-500/10 hover:text-red-300"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          退出登录
        </Button>
      </div>
    </aside>
  )
}
