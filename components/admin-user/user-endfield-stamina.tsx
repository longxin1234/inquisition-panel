"use client"

import React, { useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, GripVertical } from "lucide-react"
import { STAMINA_TYPES, STAMINA_LEVELS, STAMINA_CARD_LIMIT } from "@/lib/endfield-script-config"
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface UserEndfieldStaminaProps {
  staminaClear: any
  onChange: (updated: any) => void
}

type SortableShellProps = { id: string; className?: string; contentClassName?: string; children: React.ReactNode }

function SortableShell({ id, className, contentClassName, children }: SortableShellProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex gap-2 rounded border p-2 items-center dark:border-gray-600",
        isDragging && "z-10 shadow-md ring-2 ring-blue-200 dark:ring-blue-800",
        className
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="拖动排序"
        className="flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-md border border-dashed text-gray-500 transition hover:bg-gray-50 active:cursor-grabbing dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className={cn("min-w-0 flex-1", contentClassName)}>{children}</div>
    </div>
  )
}

export function UserEndfieldStamina({ staminaClear, onChange }: UserEndfieldStaminaProps) {
  const itemKeyMap = useRef(new WeakMap<object, string>())
  const idCounter = useRef(1)

  const getStableId = useCallback((item: any, fallbackIdx: number) => {
    if (item && typeof item === "object") {
      if (item.id) return String(item.id)
      let existing = itemKeyMap.current.get(item)
      if (!existing) {
        existing = `stamina-card-${fallbackIdx + 1}-${idCounter.current++}`
        itemKeyMap.current.set(item, existing)
      }
      return existing
    }
    return `stamina-card-${fallbackIdx + 1}`
  }, [])

  const rawItems: any[] = Array.isArray(staminaClear?.stage_items) ? staminaClear.stage_items : []
  const stageItems = useMemo(() => {
    return rawItems.map((item, idx) => ({
      ...item,
      id: getStableId(item, idx),
    }))
  }, [rawItems, getStableId])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const fromIndex = stageItems.findIndex((item) => item.id === active.id)
    const toIndex = stageItems.findIndex((item) => item.id === over.id)
    if (fromIndex < 0 || toIndex < 0) return
    const next = arrayMove(stageItems, fromIndex, toIndex)
    updateItems(next.map((item, idx) => ({ ...item, order: idx + 1 })))
  }

  const updateItems = (nextItems: any[]) => {
    onChange({
      ...(staminaClear || {}),
      stage_items: nextItems,
      entries: nextItems,
      stage_name: nextItems[0]?.stage_name || null,
    })
  }

  const updateCard = (index: number, patch: Record<string, any>) => {
    const next = stageItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    updateItems(next)
  }

  const handleRemove = (index: number) => {
    const next = stageItems.filter((_, idx) => idx !== index)
    updateItems(next.map((item, idx) => ({ ...item, order: idx + 1 })))
  }

  const handleAdd = () => {
    if (stageItems.length >= STAMINA_CARD_LIMIT) return
    const id = `stamina-card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const newCard = {
      id,
      stage_type: "干员经验",
      stage_name: "干员经验",
      stage_level: null,
      max_runs: 99,
      enabled: true,
      order: stageItems.length + 1,
    }
    const next = [...stageItems, newCard]
    updateItems(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium dark:text-white">
          刷体力关卡队列 ({stageItems.length}/{STAMINA_CARD_LIMIT})
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={stageItems.length >= STAMINA_CARD_LIMIT}
          className="h-8 gap-1 text-xs w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          添加关卡
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stageItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {stageItems.map((item, index) => {
              const type = item.stage_type || item.stage_name || "干员经验"
              const levels = STAMINA_LEVELS[type] || ["自动选关"]
              return (
                <SortableShell key={item.id} id={item.id} className="p-2 items-center" contentClassName="min-w-0">
                  <div className="grid min-w-0 grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_3.25rem_auto] gap-2 items-center sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_3.5rem_auto]">
                    <Select value={type} onValueChange={(val) => updateCard(index, { stage_type: val, stage_name: val, stage_level: null })}>
                      <SelectTrigger className="h-9 text-xs touch-auto min-w-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAMINA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={item.stage_level || "自动选关"} onValueChange={(val) => updateCard(index, { stage_level: val === "自动选关" ? null : val })}>
                      <SelectTrigger className="h-9 text-xs touch-auto min-w-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((lvl) => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      aria-label="次数"
                      value={item.max_runs ?? 99}
                      onChange={(e) => updateCard(index, { max_runs: Math.min(999, Math.max(1, Number.parseInt(e.target.value) || 1)) })}
                      className="w-[3.25rem] h-9 touch-auto px-1 text-center text-xs sm:w-14 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-9 whitespace-nowrap px-3 text-xs"
                      onClick={() => handleRemove(index)}
                    >
                      删除
                    </Button>
                  </div>
                </SortableShell>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
