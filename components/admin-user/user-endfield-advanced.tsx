"use client"

import React, { useState } from "react"
import { EndfieldScriptAdvanced, type SettingsPanel } from "@/components/endfield-script-advanced"
import {
  Factory,
  PackageSearch,
  ShoppingBag,
  Store,
  TicketCheck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ADVANCED_TABS: Array<{
  value: SettingsPanel
  title: string
  icon: React.ComponentType<{ className?: string }>
  desc: string
}> = [
  { value: "depot", title: "仓储节点", icon: Warehouse, desc: "地区与装箱" },
  { value: "credit", title: "信用刷新", icon: ShoppingBag, desc: "刷新轮次与保留" },
  { value: "login", title: "上号时间", icon: Users, desc: "每周执行日" },
  { value: "base", title: "基建培养", icon: Factory, desc: "培养舱与线索" },
  { value: "outpost", title: "据点交易", icon: Store, desc: "选品策略与保留" },
  { value: "sell", title: "价格售卖", icon: TicketCheck, desc: "地区与溢出处理" },
  { value: "voucher", title: "弹性物资", icon: Zap, desc: "周期与地区阈值" },
  { value: "stable", title: "稳定物资", icon: PackageSearch, desc: "目录上限与折扣" },
]

interface UserEndfieldAdvancedProps {
  advancedConfig: any
  onChange: (updated: any) => void
}

export function UserEndfieldAdvanced({ advancedConfig, onChange }: UserEndfieldAdvancedProps) {
  const [activeTab, setActiveTab] = useState<SettingsPanel>("depot")

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          高级自动化策略 (按需点选)
        </span>
        <span className="text-xs text-muted-foreground">
          点击下方按钮切换配置面板
        </span>
      </div>

      {/* 2x4 网格按钮组 (1:1 还原用户手绘图 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ADVANCED_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all cursor-pointer select-none",
                isActive
                  ? "border-sky-500 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-xs"
                  : "border-border/80 bg-background hover:border-border hover:bg-muted/40 text-slate-700 dark:text-slate-300"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn("h-4 w-4", isActive ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground")} />
                <span className="text-xs font-semibold">{tab.title}</span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate max-w-full">
                {tab.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* 动态展示选中的配置表单面板 (与用户端完全一致) */}
      <div className="mt-3 rounded-xl border border-border/80 bg-background/80 p-4 min-h-[160px]">
        <EndfieldScriptAdvanced
          panel={activeTab}
          value={advancedConfig || {}}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
