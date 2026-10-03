"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, LogOut, PanelLeftClose, PanelLeftOpen, Shield, UserCheck } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useSidebarState } from "@/components/sidebar-context"
import { apiRequest, isTokenValid } from "@/lib/api-config"
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

const BOUND_USER_ACCOUNT = "1654458136@qq.com"
const STORAGE_BOUND_USER_PWD_KEY = "admin_bound_user_password"
const STORAGE_BOUND_USER_TOKEN_KEY = "admin_bound_user_token"
const STORAGE_ADMIN_RETURN_TOKEN_KEY = "admin_return_token"

export function Sidebar({ className, onClose, isMobileDrawer = false, ...props }: SidebarProps) {
  const { userType, token, login, logout } = useAuth()
  const { collapsed, toggleCollapsed } = useSidebarState()
  const router = useRouter()
  const pathname = usePathname()
  const role = userType as WorkspaceRole | null
  const navigation = getWorkspaceNavigation(role)
  const presentation = role ? rolePresentation[role] : null
  const RoleIcon = presentation?.icon

  // 移动端抽屉始终展开，桌面端根据状态折叠
  const isCollapsed = !isMobileDrawer && collapsed

  const [isSwitching, setIsSwitching] = useState(false)
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [rememberPassword, setRememberPassword] = useState(true)
  const [switchError, setSwitchError] = useState<string | null>(null)
  const [canReturnToAdmin, setCanReturnToAdmin] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSwitched = localStorage.getItem("admin_switched_mode") === "user"
      const hasReturnToken = Boolean(localStorage.getItem(STORAGE_ADMIN_RETURN_TOKEN_KEY))
      setCanReturnToAdmin(isSwitched && hasReturnToken)
    }
  }, [role, pathname])

  const executeSwitchToUser = (userToken: string) => {
    try {
      if (token) localStorage.setItem(STORAGE_ADMIN_RETURN_TOKEN_KEY, token)
      localStorage.setItem("admin_switched_mode", "user")
      localStorage.setItem(STORAGE_BOUND_USER_TOKEN_KEY, userToken)
    } catch {}
    login(userToken, "user")
    onClose?.()
    router.push("/user/dashboard")
  }

  const handleSwitchToTestUser = async () => {
    if (isSwitching) return
    try {
      const cachedToken = localStorage.getItem(STORAGE_BOUND_USER_TOKEN_KEY)
      if (cachedToken && isTokenValid(cachedToken)) {
        executeSwitchToUser(cachedToken)
        return
      }
    } catch {}

    let savedPwd = ""
    try {
      savedPwd = localStorage.getItem(STORAGE_BOUND_USER_PWD_KEY) || ""
    } catch {}

    if (savedPwd) {
      setIsSwitching(true)
      try {
        const res = await apiRequest<{ token?: string }>("/userLogin", {
          method: "POST",
          body: JSON.stringify({ account: BOUND_USER_ACCOUNT, password: savedPwd }),
        })
        if (res?.code === 200 && res.data?.token) {
          executeSwitchToUser(res.data.token)
          return
        }
      } catch {
        // 静默登录失败时打开输入框
      } finally {
        setIsSwitching(false)
      }
    }

    setPasswordInput(savedPwd)
    setSwitchError(null)
    setSwitchDialogOpen(true)
  }

  const handleConfirmSwitchLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!passwordInput.trim()) {
      setSwitchError("请输入该用户账号的登录密码")
      return
    }
    setIsSwitching(true)
    setSwitchError(null)
    try {
      const res = await apiRequest<{ token?: string }>("/userLogin", {
        method: "POST",
        body: JSON.stringify({ account: BOUND_USER_ACCOUNT, password: passwordInput.trim() }),
      })
      if (res?.code === 200 && res.data?.token) {
        if (rememberPassword) {
          try {
            localStorage.setItem(STORAGE_BOUND_USER_PWD_KEY, passwordInput.trim())
          } catch {}
        } else {
          try {
            localStorage.removeItem(STORAGE_BOUND_USER_PWD_KEY)
          } catch {}
        }
        setSwitchDialogOpen(false)
        executeSwitchToUser(res.data.token)
      } else {
        setSwitchError(res?.msg || "密码错误或登录失败，请重试")
      }
    } catch (err: any) {
      setSwitchError(err?.message || "登录请求失败，请检查网络")
    } finally {
      setIsSwitching(false)
    }
  }

  const handleSwitchToAdmin = () => {
    let returnToken = token
    try {
      const savedToken = localStorage.getItem(STORAGE_ADMIN_RETURN_TOKEN_KEY)
      if (savedToken) returnToken = savedToken
      localStorage.removeItem("admin_switched_mode")
      localStorage.removeItem(STORAGE_ADMIN_RETURN_TOKEN_KEY)
    } catch {}
    setCanReturnToAdmin(false)
    login(returnToken || "demo-admin-token", "admin")
    onClose?.()
    router.push("/admin/dashboard")
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("admin_switched_mode")
      localStorage.removeItem(STORAGE_ADMIN_RETURN_TOKEN_KEY)
    } catch {}
    setCanReturnToAdmin(false)
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
        {role === "admin" ? (
          <div className={cn("flex w-full items-center", isCollapsed ? "justify-center" : "justify-between gap-1")}>
            <div
              className={cn("flex items-center gap-2 min-w-0", isCollapsed && "cursor-pointer select-none")}
              onClick={isCollapsed ? toggleCollapsed : undefined}
              title={isCollapsed ? "点击展开侧边栏" : undefined}
            >
              <Shield className="h-5 w-5 shrink-0 text-sidebar-foreground" />
              {!isCollapsed && (
                <span className="truncate text-base font-semibold tracking-tight text-sidebar-foreground">
                  管理员面板
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle />
                {!isMobileDrawer && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapsed}
                    className="h-8 w-8 shrink-0 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    title="收起侧边栏"
                    aria-label="收起侧边栏"
                  >
                    <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn("flex items-center min-w-0", isCollapsed ? "justify-center cursor-pointer select-none" : "gap-3 flex-1")}
            onClick={isCollapsed ? toggleCollapsed : undefined}
            title={isCollapsed ? "点击展开侧边栏" : undefined}
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent shadow-sm">
              <img src="/icon.png" alt="终末地控制台" className="h-full w-full object-cover" />
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
        )}

        {/* 顶部收起/展开按钮（仅桌面端有效） */}
        {!isMobileDrawer && (
          isCollapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="h-7 w-7 shrink-0 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              title="展开侧边栏"
              aria-label="展开侧边栏"
            >
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : role !== "admin" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="h-8 w-8 shrink-0 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              title="收起侧边栏"
              aria-label="收起侧边栏"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null
        )}
      </div>

      {/* 导航菜单列表（统一平铺无分组主标题） */}
      <nav className={cn("workspace-scrollbar min-h-0 flex-1 overflow-y-auto py-3", isCollapsed ? "px-1.5" : "px-2.5")}>
        <div className="space-y-1">
          {navigation.flatMap((group) => group.items).map((item) => {
            const active = isItemActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.title : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-9 items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
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
      </nav>

      {/* 底部快捷互切与退出登录 */}
      <div className={cn("shrink-0 border-t border-sidebar-border space-y-1", isCollapsed ? "p-1.5" : "p-2.5")}>
        {role === "admin" ? (
          <Button
            type="button"
            variant="ghost"
            title={isCollapsed ? `切换到用户端 (${BOUND_USER_ACCOUNT})` : undefined}
            disabled={isSwitching}
            className={cn(
              "h-9 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              isCollapsed ? "w-full justify-center px-0" : "w-full justify-start px-2.5"
            )}
            onClick={handleSwitchToTestUser}
          >
            {isSwitching ? (
              <Loader2 className="h-4 w-4 shrink-0 text-blue-500 animate-spin" aria-hidden="true" />
            ) : (
              <UserCheck className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
            )}
            {!isCollapsed && (
              <span className="ml-2.5 truncate">
                {isSwitching ? "正在切入用户端..." : "切换到用户端"}
              </span>
            )}
          </Button>
        ) : canReturnToAdmin ? (
          <Button
            type="button"
            variant="ghost"
            title={isCollapsed ? "返回管理端" : undefined}
            className={cn(
              "h-9 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              isCollapsed ? "w-full justify-center px-0" : "w-full justify-start px-2.5"
            )}
            onClick={handleSwitchToAdmin}
          >
            <Shield className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            {!isCollapsed && <span className="ml-2.5 truncate">返回管理端</span>}
          </Button>
        ) : null}

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

      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleConfirmSwitchLogin}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <UserCheck className="h-5 w-5 text-blue-500" />
                切换至用户工作台
              </DialogTitle>
              <DialogDescription className="text-xs">
                将以绑定用户身份进入用户端，查看该用户的角色状态与自动化任务。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div className="space-y-1">
                <Label htmlFor="bound-user-account" className="text-xs text-muted-foreground">
                  绑定用户账号
                </Label>
                <Input
                  id="bound-user-account"
                  value={BOUND_USER_ACCOUNT}
                  disabled
                  className="h-9 bg-muted/50 text-xs cursor-not-allowed select-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bound-user-password" className="text-xs">登录密码</Label>
                <Input
                  id="bound-user-password"
                  type="password"
                  autoFocus
                  placeholder="请输入该账号登录密码"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value)
                    setSwitchError(null)
                  }}
                  disabled={isSwitching}
                  className="h-9 text-xs"
                />
                {switchError && (
                  <p className="text-[11px] text-destructive font-medium">{switchError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-0.5">
                <Checkbox
                  id="remember-switch-password"
                  checked={rememberPassword}
                  onCheckedChange={(checked) => setRememberPassword(!!checked)}
                />
                <Label
                  htmlFor="remember-switch-password"
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  记住密码（下次切换时全自动静默登录）
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSwitchDialogOpen(false)}
                disabled={isSwitching}
              >
                取消
              </Button>
              <Button type="submit" size="sm" disabled={isSwitching || !passwordInput.trim()}>
                {isSwitching && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                登录并进入
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
