"use client"

import React from "react"
import { SCRIPT_TASKS, type ScriptSelection } from "@/lib/endfield-script-config"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface UserEndfieldTasksProps {
  selection: ScriptSelection
  onUpdateTask: (taskId: string, enabled: boolean) => void
  onSetAllTasks: (enabled: boolean) => void
}

export function UserEndfieldTasks({ selection, onUpdateTask, onSetAllTasks }: UserEndfieldTasksProps) {
  const enabledCount = SCRIPT_TASKS.filter((t) => selection[t.id]).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm dark:text-white">终末地任务队列</span>
          <Badge variant="outline" className="text-xs">
            已启用 {enabledCount} / {SCRIPT_TASKS.length} 项
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetAllTasks(true)}
            className="h-7 text-xs"
          >
            全部启用
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetAllTasks(false)}
            className="h-7 text-xs"
          >
            全部取消
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {SCRIPT_TASKS.map((task) => {
          const isChecked = Boolean(selection[task.id])
          return (
            <div
              key={task.id}
              onClick={() => onUpdateTask(task.id, !isChecked)}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                isChecked
                  ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                  : "border-border bg-card hover:border-gray-300 dark:hover:border-gray-600 opacity-80"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isChecked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 bg-background"
                }`}
              >
                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-none text-foreground">{task.label}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
