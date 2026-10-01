"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, ArrowUp, ArrowDown, Trash2, Zap, GripVertical } from "lucide-react"
import { STAMINA_TYPES, STAMINA_LEVELS, STAMINA_CARD_LIMIT } from "@/lib/endfield-script-config"
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface UserEndfieldStaminaProps {
  staminaClear: any
  onChange: (updated: any) => void
}

function SortableAdminStaminaRow({
  id,
  item,
  index,
  isExpanded,
  totalItems,
  onToggleExpand,
  onMove,
  onRemove,
  children,
}: {
  id: string
  item: any
  index: number
  isExpanded: boolean
  totalItems: number
  onToggleExpand: () => void
  onMove: (dir: -1 | 1, e: React.MouseEvent) => void
  onRemove: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const type = item.stage_type || item.stage_name || "干员经验"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "rounded-xl border",
        isDragging && "z-20 shadow-md ring-2 ring-sky-400 opacity-90",
        isExpanded
          ? "border-amber-400 bg-amber-50/15 p-3 dark:border-amber-500 dark:bg-amber-950/20"
          : "border-border bg-card p-3 hover:border-sky-200 dark:hover:border-sky-800"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label="拖动排序"
            className="flex h-7 w-7 shrink-0 touch-none cursor-grab active:cursor-grabbing items-center justify-center rounded-md border border-dashed border-border/80 text-muted-foreground transition hover:bg-muted hover:text-sky-600"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none" onClick={onToggleExpand}>
            <span className="inline-flex items-center shrink-0 rounded-md px-2 py-0.5 text-xs font-medium border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300">
              {type}
            </span>
            <span className="text-xs text-muted-foreground truncate">{item.stage_level || "自动选关"}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">×{item.max_runs ?? 99}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={(e) => onMove(-1, e)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === totalItems - 1} onClick={(e) => onMove(1, e)}>
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {children}
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

  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  const handleMove = (index: number, dir: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = index + dir
    if (target < 0 || target >= stageItems.length) return
    const next = arrayMove(stageItems, index, target)
    updateItems(next.map((item, idx) => ({ ...item, order: idx + 1 })))
  }

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const removed = stageItems[index]
    const next = stageItems.filter((_, idx) => idx !== index)
    updateItems(next.map((item, idx) => ({ ...item, order: idx + 1 })))
    if (removed && expandedId === removed.id) setExpandedId(null)
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
    setExpandedId(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-sm dark:text-white flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            刷体力关卡队列 ({stageItems.length}/{STAMINA_CARD_LIMIT})
          </h3>
          <p className="text-xs text-muted-foreground">按照队列次序消耗理智，关卡体力耗尽后自动切换下一项</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={stageItems.length >= STAMINA_CARD_LIMIT}
          className="h-8 gap-1 text-xs"
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
              const isExpanded = expandedId === item.id
              return (
                <SortableAdminStaminaRow
                  key={item.id}
                  id={item.id}
                  item={item}
                  index={index}
                  isExpanded={isExpanded}
                  totalItems={stageItems.length}
                  onToggleExpand={() => setExpandedId(isExpanded ? null : item.id)}
                  onMove={(dir, e) => handleMove(index, dir, e)}
                  onRemove={(e) => handleRemove(index, e)}
                >

              {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t dark:border-gray-700/60 text-xs">
                  <div>
                    <Label className="text-xs">关卡类别</Label>
                    <Select value={type} onValueChange={(val) => updateCard(index, { stage_type: val, stage_name: val, stage_level: null })}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAMINA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">具体关卡</Label>
                    <Select value={item.stage_level || "自动选关"} onValueChange={(val) => updateCard(index, { stage_level: val === "自动选关" ? null : val })}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{levels.map((lvl) => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">最大次数</Label>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={item.max_runs ?? 99}
                      onChange={(e) => updateCard(index, { max_runs: Math.max(1, Number.parseInt(e.target.value) || 1) })}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
              )}
                </SortableAdminStaminaRow>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
