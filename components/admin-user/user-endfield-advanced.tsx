"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Building2, Package, Coins } from "lucide-react"

interface UserEndfieldAdvancedProps {
  advancedConfig: any
  onChange: (updated: any) => void
}

export function UserEndfieldAdvanced({ advancedConfig, onChange }: UserEndfieldAdvancedProps) {
  const updateSection = (section: string, patch: Record<string, any>) => {
    onChange({
      ...advancedConfig,
      [section]: {
        ...(advancedConfig?.[section] || {}),
        ...patch,
      },
    })
  }

  const dijiang = advancedConfig?.dijiang || {}
  const creditReserve = advancedConfig?.credit_reserve ?? 150
  const depotAreas = advancedConfig?.depot_areas || { area_4: true, wuling: true }
  const outpost = advancedConfig?.outpost_trade || {}

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 帝江号基建 */}
        <Card className="dark:bg-gray-800/80 border-border">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sky-500" />
              帝江号基建策略
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">自动恢复干员心情</Label>
              <Switch
                checked={dijiang.recovery_emotion !== false}
                onCheckedChange={(c) => updateSection("dijiang", { recovery_emotion: c })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-xs">线索留存数量</Label>
              <Input
                type="number"
                min="0"
                max="2"
                value={dijiang.clue_keep_count ?? 2}
                onChange={(e) => updateSection("dijiang", { clue_keep_count: Number(e.target.value) || 0 })}
                className="h-7 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-xs">赠送好友上限</Label>
              <Input
                type="number"
                min="0"
                max="99"
                value={dijiang.send_max ?? 3}
                onChange={(e) => updateSection("dijiang", { send_max: Number(e.target.value) || 0 })}
                className="h-7 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 信用商店与仓储 */}
        <Card className="dark:bg-gray-800/80 border-border">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              商店与仓储
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-xs">信用点保留底限</Label>
              <Input
                type="number"
                min="0"
                value={creditReserve}
                onChange={(e) => onChange({ ...advancedConfig, credit_reserve: Number(e.target.value) || 0 })}
                className="h-7 text-xs"
              />
            </div>
            <div className="pt-2 border-t dark:border-gray-700/60">
              <Label className="text-xs font-semibold block mb-2">仓储启用区域</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depotAreas.area_4 !== false}
                    onChange={(e) => updateSection("depot_areas", { area_4: e.target.checked })}
                    className="rounded"
                  />
                  <span>四号谷地</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depotAreas.wuling !== false}
                    onChange={(e) => updateSection("depot_areas", { wuling: e.target.checked })}
                    className="rounded"
                  />
                  <span>武陵区域</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center pt-2 border-t dark:border-gray-700/60">
              <Label className="text-xs">据点选品策略</Label>
              <Select
                value={outpost.selection_strategy || "price"}
                onValueChange={(val) => updateSection("outpost_trade", { selection_strategy: val })}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">最高价格优先</SelectItem>
                  <SelectItem value="rarity">高稀有度优先</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
