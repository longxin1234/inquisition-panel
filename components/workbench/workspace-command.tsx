"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { getWorkspaceNavigation, type WorkspaceRole } from "@/components/workbench/navigation"

interface WorkspaceCommandProps {
  role: WorkspaceRole | null
  className?: string
}

export function WorkspaceCommand({ role, className }: WorkspaceCommandProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const groups = getWorkspaceNavigation(role)

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", handleShortcut)
    return () => document.removeEventListener("keydown", handleShortcut)
  }, [])

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        aria-label="搜索工作台页面"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-w-48 sm:justify-between",
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">搜索页面</span>
        </span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="输入页面名称或功能关键词..." />
        <CommandList>
          <CommandEmpty>没有找到匹配的页面</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={[item.title, item.description, ...(item.keywords ?? [])].join(" ")}
                  onSelect={() => navigate(item.href)}
                >
                  <item.icon aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <CommandShortcut>打开</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
