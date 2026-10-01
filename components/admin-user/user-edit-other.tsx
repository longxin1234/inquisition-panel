"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SlidersHorizontal } from "lucide-react"

interface UserEditOtherProps {
  form: Record<string, any>
  onChange: (patch: Record<string, any>) => void
}

export function UserEditOther({ form, onChange }: UserEditOtherProps) {
  return (
    <div className="space-y-4 py-3">
      <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <Label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            高级运行与调度策略
          </Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">调度触发模式</Label>
            <Select
              value={form.dispatchMode || "automatic"}
              onValueChange={(val) => onChange({ dispatchMode: val })}
            >
              <SelectTrigger className="h-9 rounded-lg border-input bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">自动调度 (系统全自动分配执行)</SelectItem>
                <SelectItem value="scheduled">定时调度 (固定时间段执行)</SelectItem>
                <SelectItem value="manual">手动调度 (仅由用户/管理员手动触发)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">所属分组或备注</Label>
            <Input
              value={form.groupName || ""}
              onChange={(e) => onChange({ groupName: e.target.value })}
              placeholder="可选分组标签"
              className="h-9 rounded-lg border-input bg-background text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
