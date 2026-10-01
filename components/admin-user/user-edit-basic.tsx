"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface UserEditBasicProps {
  form: Record<string, any>
  onChange: (patch: Record<string, any>) => void
}

export function UserEditBasic({ form, onChange }: UserEditBasicProps) {
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ""
    if (dateString.includes("T") && !dateString.endsWith("Z")) {
      return dateString.slice(0, 16)
    }
    try {
      return new Date(dateString).toISOString().slice(0, 16)
    } catch {
      return ""
    }
  }

  const applyCooldownHours = (hours: number) => {
    const next = new Date(Date.now() + hours * 60 * 60 * 1000)
    const local = new Date(next.getTime() - next.getTimezoneOffset() * 60 * 1000)
    onChange({ cooldownUntil: local.toISOString().slice(0, 16) })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="userName" className="text-xs dark:text-white">用户名</Label>
          <Input
            id="userName"
            value={form.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-8 text-xs dark:bg-gray-700"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="userGameName" className="text-xs dark:text-white">游戏昵称 (森空岛同步)</Label>
          <Input
            id="userGameName"
            value={form.gameName || ""}
            onChange={(e) => onChange({ gameName: e.target.value })}
            placeholder="执行任务时自动同步"
            className="h-8 text-xs dark:bg-gray-700"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="userAccount" className="text-xs dark:text-white">终末地游戏账号</Label>
          <Input
            id="userAccount"
            value={form.account || ""}
            onChange={(e) => onChange({ account: e.target.value })}
            className="h-8 text-xs dark:bg-gray-700"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="userPassword" className="text-xs dark:text-white">密码 (留空则不修改)</Label>
          <Input
            id="userPassword"
            type="text"
            placeholder="留空保持原密码不变"
            value={form.password || ""}
            onChange={(e) => onChange({ password: e.target.value })}
            className="h-8 text-xs dark:bg-gray-700"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs dark:text-white">服务器类型</Label>
          <Select
            value={String(form.server ?? 0)}
            onValueChange={(val) => onChange({ server: Number(val) })}
          >
            <SelectTrigger className="h-8 text-xs dark:bg-gray-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">官服</SelectItem>
              <SelectItem value="1">B服</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="userRefresh" className="text-xs dark:text-white">立刻作战可用次数</Label>
          <Input
            id="userRefresh"
            type="number"
            min="0"
            value={form.refresh ?? 1}
            onChange={(e) => onChange({ refresh: Number(e.target.value) || 0 })}
            className="h-8 text-xs dark:bg-gray-700"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="userExpireTime" className="text-xs dark:text-white">授权到期时间</Label>
          <Input
            id="userExpireTime"
            type="datetime-local"
            value={formatDateForInput(form.expireTime)}
            onChange={(e) => onChange({ expireTime: e.target.value })}
            className="h-8 text-xs dark:bg-gray-700"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="userAgent" className="text-xs dark:text-white">代理商 ID (可选)</Label>
          <Input
            id="userAgent"
            value={form.agent || ""}
            onChange={(e) => onChange({ agent: e.target.value || null })}
            placeholder="未绑定代理留空"
            className="h-8 text-xs dark:bg-gray-700"
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="userFreeze"
            checked={Boolean(form.freeze)}
            onCheckedChange={(c) => onChange({ freeze: c ? 1 : 0 })}
          />
          <Label htmlFor="userFreeze" className="text-xs font-semibold cursor-pointer dark:text-white">
            冻结该账号 (暂停一切调度)
          </Label>
        </div>
      </div>

      {/* 临时冷却控制 */}
      <div className="p-3 rounded-xl border bg-muted/20 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">临时冷却截止时间</Label>
          <div className="flex gap-1.5">
            {[0.5, 1, 2, 4, 12, 24].map((h) => (
              <Button
                key={h}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyCooldownHours(h)}
                className="h-6 px-2 text-[11px]"
              >
                +{h < 1 ? "30分" : `${h}小时`}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ cooldownUntil: "" })}
              className="h-6 px-2 text-[11px] text-muted-foreground"
            >
              清除
            </Button>
          </div>
        </div>
        <Input
          type="datetime-local"
          value={formatDateForInput(form.cooldownUntil)}
          onChange={(e) => onChange({ cooldownUntil: e.target.value })}
          className="h-8 text-xs dark:bg-gray-700"
        />
      </div>
    </div>
  )
}
