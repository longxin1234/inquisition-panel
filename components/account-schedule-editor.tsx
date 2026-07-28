"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  formatNextScheduledAt,
  getScheduleStatusLabel,
  normalizeScheduleTime,
} from "@/lib/account-dispatch"
import { CalendarClock, CircleGauge, Clock3, Plus, Trash2 } from "lucide-react"

const MAX_SCHEDULE_TIMES = 3

interface AccountScheduleEditorProps {
  scheduleTimes: string[]
  onChange: (scheduleTimes: string[]) => void
  nextScheduledAt?: string | null
  scheduleStatus?: string | null
  error?: string
}

export function AccountScheduleEditor({
  scheduleTimes,
  onChange,
  nextScheduledAt,
  scheduleStatus,
  error,
}: AccountScheduleEditorProps) {
  const addTime = () => {
    if (scheduleTimes.length < MAX_SCHEDULE_TIMES) onChange([...scheduleTimes, ""])
  }

  const updateTime = (index: number, value: string) => {
    const next = scheduleTimes.map((time, itemIndex) => (itemIndex === index ? value : time))
    const allTimesAreComplete = next.every((time) => normalizeScheduleTime(time))
    onChange(allTimesAreComplete ? [...next].sort((left, right) => left.localeCompare(right)) : next)
  }

  const removeTime = (index: number) => {
    onChange(scheduleTimes.filter((_, itemIndex) => itemIndex !== index))
  }

  const errorId = error ? "scheduleTimesError" : undefined

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0 space-y-3">
        <div className="flex min-h-9 items-center justify-between gap-3">
          <Label className="dark:text-white">运行时间</Label>
          {scheduleTimes.length < MAX_SCHEDULE_TIMES && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={addTime}
                    aria-label="添加运行时间"
                    className="h-9 w-9 shrink-0 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>添加运行时间</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {scheduleTimes.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scheduleTimes.map((time, index) => (
              <div key={index} className="min-w-0 space-y-1.5">
                <div className="flex h-8 items-center justify-between gap-2">
                  <Label htmlFor={`scheduleTime-${index}`} className="text-xs text-gray-500 dark:text-gray-400">
                    时段 {index + 1}
                  </Label>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTime(index)}
                          aria-label={`删除时段 ${index + 1}`}
                          className="h-8 w-8 shrink-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除运行时间</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id={`scheduleTime-${index}`}
                  type="time"
                  value={time}
                  onChange={(event) => updateTime(index, event.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={errorId}
                  className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-16 items-center justify-center rounded-md border border-dashed text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            尚未设置运行时间
          </div>
        )}

        {error && (
          <p id="scheduleTimesError" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 dark:border-gray-600">
        <div className="min-w-0">
          <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <CalendarClock className="h-3.5 w-3.5" />
            下次运行
          </dt>
          <dd className="mt-1 font-medium text-gray-900 dark:text-white">
            {formatNextScheduledAt(nextScheduledAt)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock3 className="h-3.5 w-3.5" />
            时段数量
          </dt>
          <dd className="mt-1 font-medium text-gray-900 dark:text-white">{scheduleTimes.length} 个</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <CircleGauge className="h-3.5 w-3.5" />
            当前状态
          </dt>
          <dd className="mt-1 font-medium text-gray-900 dark:text-white">
            {getScheduleStatusLabel(scheduleStatus)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
