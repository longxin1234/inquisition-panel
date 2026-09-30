"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const label = mounted ? (isDark ? "切换到浅色主题" : "切换到深色主题") : "切换主题"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
    >
      {isDark ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
    </Button>
  )
}
