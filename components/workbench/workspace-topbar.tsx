"use client"

import { Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { WorkspaceCommand } from "@/components/workbench/workspace-command"
import {
  getCurrentNavigationItem,
  rolePresentation,
  type WorkspaceRole,
} from "@/components/workbench/navigation"
import { useConnectivity } from "@/components/workbench/use-connectivity"

interface WorkspaceTopbarProps {
  role: WorkspaceRole | null
  onOpenNavigation: () => void
}

export function WorkspaceTopbar({ role, onOpenNavigation }: WorkspaceTopbarProps) {
  const pathname = usePathname()
  const currentItem = getCurrentNavigationItem(role, pathname)
  const roleLabel = role ? rolePresentation[role].label : "终末地控制台"
  const isOnline = useConnectivity()

  return (
    <header className="surface-divider z-30 flex h-14 shrink-0 items-center gap-3 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onOpenNavigation}
        className="h-9 w-9 lg:hidden"
        aria-label="打开导航"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {roleLabel}
        </p>
        <h1 className="truncate text-sm font-semibold leading-tight text-foreground">
          {currentItem?.title ?? "工作区"}
        </h1>
      </div>

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
        <WorkspaceCommand role={role} />
        <ThemeToggle />
      </div>
    </header>
  )
}
