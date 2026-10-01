"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, ArrowUp, ArrowDown, Trash2, Zap } from "lucide-react"
import { STAMINA_TYPES, STAMINA_LEVELS, STAMINA_CARD_LIMIT } from "@/lib/endfield-script-config"

interface UserEndfieldStaminaProps {
  staminaClear: any
  onChange: (updated: any) => void
}

export function UserEndfieldStamina({ staminaClear, onChange }: UserEndfieldStaminaProps) {
  const stageItems: any[] = Array.isArray(staminaClear?.stage_items) ? staminaClear.stage_items : []
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

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
    const next = [...stageItems]
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    updateItems(next.map((item, idx) => ({ ...item, order: idx + 1 })))
    setExpandedIndex(target)
  }

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = stageItems.filter((_, idx) => idx !== index)
    updateItems(next.map((item, idx) => ({ ...item, order: idx + 1 })))
    setExpandedIndex(null)
  }

  const handleAdd = () => {
    if (stageItems.length >= STAMINA_CARD_LIMIT) return
    const newCard = {
      stage_type: "干员经验",
      stage_name: "干员经验",
      stage_level: null,
      max_runs: 99,
      enabled: true,
      order: stageItems.length + 1,
    }
    const next = [...stageItems, newCard]
    updateItems(next)
    setExpandedIndex(next.length - 1)
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

      <div className="space-y-2">
        {stageItems.map((item, index) => {
          const type = item.stage_type || item.stage_name || "干员经验"
          const levels = STAMINA_LEVELS[type] || ["自动选关"]
          const isExpanded = expandedIndex === index
          return (
            <div
              key={index}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? "border-amber-400 bg-amber-50/15 p-3 dark:border-amber-500 dark:bg-amber-950/20"
                  : "border-border bg-card p-3 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                    #{index + 1} {type}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.stage_level || "自动选关"}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">×{item.max_runs ?? 99}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={(e) => handleMove(index, -1, e)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === stageItems.length - 1} onClick={(e) => handleMove(index, 1, e)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={(e) => handleRemove(index, e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

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
            </div>
          )
        })}
      </div>
    </div>
  )
}
