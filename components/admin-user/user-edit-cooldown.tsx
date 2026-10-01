"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Clock, ShieldAlert } from "lucide-react"

interface UserEditCooldownProps {
  cooldownUntil?: string | null
  onChange: (patch: Record<string, any>) => void
}

export function UserEditCooldown({ cooldownUntil, onChange }: UserEditCooldownProps) {
  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return ""
    if (dateString.includes("T") && !dateString.endsWith("Z")) {
      return dateString.slice(0, 16)
    }
    try {
      const d = new Date(dateString)
      if (Number.isNaN(d.getTime())) return dateString
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000)
      return local.toISOString().slice(0, 16)
    } catch {
      return ""
    }
  }

  const applyCooldownHours = (hours: number) => {
    const next = new Date(Date.now() + hours * 60 * 60 * 1000)
    const local = new Date(next.getTime() - next.getTimezoneOffset() * 60 * 1000)
    onChange({ cooldownUntil: local.toISOString().slice(0, 16) })
  }

  const isCooldownActive = Boolean(
    cooldownUntil && new Date(cooldownUntil).getTime() > Date.now()
  )

  return (
    <div className="space-y-5 py-3">
      <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <Label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              临时冷却截止时间
            </Label>
          </div>
          {isCooldownActive && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldAlert className="h-3 w-3" />
              当前处于冷却中
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          设置临时冷却后，在截止时间之前调度系统将跳过该账号的自动执行，直至冷却期结束。
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground font-medium mr-1">快捷延后:</span>
          {[0.5, 1, 2, 4, 12, 24].map((h) => (
            <Button
              key={h}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyCooldownHours(h)}
              className="h-8 rounded-lg px-3 text-xs hover:border-sky-400 hover:text-sky-600 transition-colors"
            >
              +{h < 1 ? "30分钟" : `${h}小时`}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ cooldownUntil: "" })}
            className="h-8 rounded-lg px-3 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 transition-colors ml-auto"
          >
            清除冷却
          </Button>
        </div>

        <div className="pt-2">
          <Input
            type="datetime-local"
            value={formatDateForInput(cooldownUntil)}
            onChange={(e) => onChange({ cooldownUntil: e.target.value })}
            className="h-9 rounded-lg border-input bg-background text-sm"
          />
        </div>
      </div>
    </div>
  )
}
