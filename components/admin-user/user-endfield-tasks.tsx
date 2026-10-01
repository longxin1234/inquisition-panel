"use client"

import React from "react"
import { SCRIPT_TASKS, type ScriptSelection } from "@/lib/endfield-script-config"
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
    <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4">
      {/* 头部：标题与全选/取消（对齐用户端） */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            终末地任务队列
          </span>
          <Badge variant="secondary" className="text-xs font-normal">
            已启用 {enabledCount} / {SCRIPT_TASKS.length} 项
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSetAllTasks(true)}
            className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            全部启用
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            type="button"
            onClick={() => onSetAllTasks(false)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            全部取消
          </button>
        </div>
      </div>

      {/* 纯净 3 列纯文本与圆环复选框（对齐参考图小圆圈尺寸与细蓝线） */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 pt-1">
        {SCRIPT_TASKS.map((task) => {
          const isChecked = Boolean(selection[task.id])
          return (
            <div
              key={task.id}
              onClick={() => onUpdateTask(task.id, !isChecked)}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault()
                  onUpdateTask(task.id, !isChecked)
                }
              }}
              className="group flex items-center gap-2 cursor-pointer select-none py-1 transition-opacity hover:opacity-85 min-w-0"
            >
              <span
                className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isChecked
                    ? "bg-blue-600 text-white"
                    : "border border-blue-600/70 dark:border-blue-400/70 group-hover:border-blue-600"
                }`}
              >
                {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </span>
              <span className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">
                {task.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
