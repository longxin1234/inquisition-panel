"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyPlanEditor } from "@/components/daily-plan-editor"
import { Save, X, Settings, Bell, Calendar, Sword, Target, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NewUserAccount {
  name: string
  account: string
  password?: string
  freeze: number
  server: number
  taskType: string
  refresh: number
  agent: string | null
  expireTime: string
  config: any
  active: any
  notice: any
  days: number
}

interface UserAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (user: NewUserAccount) => void
}

export function UserAddDialog({ open, onOpenChange, onSave }: UserAddDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [addForm, setAddForm] = useState<NewUserAccount>({
    name: "",
    account: "",
    password: "",
    freeze: 0,
    server: 0,
    taskType: "daily",
    refresh: 0,
    agent: null,
    expireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    config: {
      daily: {
        fight: [
          { level: "jm", num: 5 },
          { level: "hd", num: 99 },
          { level: "ce", num: 99 },
          { level: "1-7", num: 99 },
          { level: "ls", num: 99 },
        ],
        sanity: { drug: 1, stone: 0 },
        mail: true,
        friend: true,
        credit: true,
        task: true,
        activity: true,
        fight_enable: true,
        offer: { enable: true, car: false, star4: true, star5: false, star6: false, other: false },
        infrastructure: { harvest: true, shift: true, acceleration: true, communication: true, deputy: true },
      },
      rogue: {
        operator: { index: -1, num: 99, skill: 1 },
        level: 0,
        coin: 999,
        type: 1,
        skip: { coin: false, beast: false, daily: false, sensitive: false, illusion: false, survive: false },
      },
    },
    active: {
      monday: { enable: true },
      tuesday: { enable: true },
      wednesday: { enable: true },
      thursday: { enable: true },
      friday: { enable: true },
      saturday: { enable: true },
      sunday: { enable: true },
    },
    notice: {
      wxUID: { enable: false, text: "" },
      qq: { enable: false, text: "" },
      mail: { enable: false, text: "" },
    },
    days: 30,
  })

  useEffect(() => {
    if (open) {
      setAddForm({
        name: "",
        account: "",
        password: "",
        freeze: 0,
        server: 0,
        taskType: "daily",
        refresh: 0,
        agent: null,
        expireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        config: {
          daily: {
            fight: [
              { level: "jm", num: 5 },
              { level: "hd", num: 99 },
              { level: "ce", num: 99 },
              { level: "1-7", num: 99 },
              { level: "ls", num: 99 },
            ],
            sanity: { drug: 1, stone: 0 },
            mail: true,
            friend: true,
            credit: true,
            task: true,
            activity: true,
            fight_enable: true,
            offer: { enable: true, car: false, star4: true, star5: false, star6: false, other: false },
            infrastructure: { harvest: true, shift: true, acceleration: true, communication: true, deputy: true },
          },
          rogue: {
            operator: { index: -1, num: 99, skill: 1 },
            level: 0,
            coin: 999,
            type: 1,
            skip: { coin: false, beast: false, daily: false, sensitive: false, illusion: false, survive: false },
          },
        },
        active: {
          monday: { enable: true },
          tuesday: { enable: true },
          wednesday: { enable: true },
          thursday: { enable: true },
          friday: { enable: true },
          saturday: { enable: true },
          sunday: { enable: true },
        },
        notice: {
          wxUID: { enable: false, text: "" },
          qq: { enable: false, text: "" },
          mail: { enable: false, text: "" },
        },
        days: 30,
      })
    }
  }, [open])

  const handleSave = async () => {
    if (!addForm.name || !addForm.account || !addForm.password) {
      toast({
        variant: "destructive",
        title: "输入错误",
        description: "用户名、账号和密码为必填项。",
      })
      return
    }
    const now = new Date()
    const expireTime = new Date(now.getTime() + (addForm.days || 30) * 24 * 60 * 60 * 1000)
    onSave({ ...addForm, expireTime: expireTime.toISOString() })
    onOpenChange(false)
  }

  const updateNotice = (type: string, field: string, value: any) => {
    setAddForm((prev) => ({
      ...prev,
      notice: {
        ...prev.notice,
        [type]: {
          ...prev.notice?.[type],
          [field]: value,
        },
      },
    }))
  }

  const updateActive = (day: string, enabled: boolean) => {
    setAddForm((prev) => ({
      ...prev,
      active: {
        ...prev.active,
        [day]: {
          enable: enabled,
        },
      },
    }))
  }

  const updateConfig = (path: string[], value: any) => {
    setAddForm((prev) => {
      const newConfig = JSON.parse(JSON.stringify(prev.config))
      let current = newConfig
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      if (path[0] === "daily" && path[1] === "plan") {
        current.fight = []
      }
      return { ...prev, config: newConfig }
    })
  }

  const getConfigValue = (path: string[], defaultValue: any = null) => {
    let current = addForm.config
    for (const key of path) {
      if (current && typeof current === "object" && key in current) {
        current = current[key]
      } else {
        return defaultValue
      }
    }
    return current
  }

  const dayNames: Record<string, string> = {
    monday: "周一",
    tuesday: "周二",
    wednesday: "周三",
    thursday: "周四",
    friday: "周五",
    saturday: "周六",
    sunday: "周日",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Plus className="h-5 w-5" />
            添加新用户
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">填写新用户的详细信息和配置</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="config">任务配置</TabsTrigger>
            <TabsTrigger value="notice">通知设置</TabsTrigger>
            <TabsTrigger value="schedule">活跃时间</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-white">
                  用户名
                </Label>
                <Input
                  id="name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account" className="dark:text-white">
                  账号
                </Label>
                <Input
                  id="account"
                  value={addForm.account}
                  onChange={(e) => setAddForm({ ...addForm, account: e.target.value })}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-white">
                  密码
                </Label>
                <Input
                  id="password"
                  type="text"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="dark:text-white">任务类型</Label>
                <Select value={addForm.taskType} onValueChange={(value) => setAddForm({ ...addForm, taskType: value })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="选择任务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">日常任务</SelectItem>
                    <SelectItem value="rogue">肉鸽任务</SelectItem>
                    <SelectItem value="sand_fire">生息演算</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-white">服务器</Label>
                <Select
                  value={addForm.server?.toString()}
                  onValueChange={(value) => setAddForm({ ...addForm, server: Number.parseInt(value) })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="选择服务器" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">官服</SelectItem>
                    <SelectItem value="1">B服</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh" className="dark:text-white">
                  刷新次数
                </Label>
                <Input
                  id="refresh"
                  type="number"
                  value={addForm.refresh}
                  onChange={(e) => setAddForm({ ...addForm, refresh: Number.parseInt(e.target.value) || 0 })}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent" className="dark:text-white">
                  代理
                </Label>
                <Input
                  id="agent"
                  value={addForm.agent || ""}
                  onChange={(e) => setAddForm({ ...addForm, agent: e.target.value || null })}
                  placeholder="可选"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days" className="dark:text-white">
                  有效天数
                </Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  value={addForm.days || 30}
                  onChange={(e) => setAddForm({ ...addForm, days: Number.parseInt(e.target.value) || 1 })}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="freeze"
                checked={!!addForm.freeze}
                onCheckedChange={(checked) => setAddForm({ ...addForm, freeze: checked ? 1 : 0 })}
              />
              <Label htmlFor="freeze" className="dark:text-white">
                冻结账号
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                任务配置
              </h3>

              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Sword className="h-5 w-5" />
                    日常配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <DailyPlanEditor
                      plan={getConfigValue(["daily", "plan"], [])}
                      legacyFights={getConfigValue(["daily", "fight"], [])}
                      onChange={(plan) => updateConfig(["daily", "plan"], plan)}
                    />
                    {false && (
                      <>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium dark:text-white">作战配置</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const fights = getConfigValue(["daily", "fight"], [])
                          updateConfig(["daily", "fight"], [...fights, { level: "", num: 1 }])
                        }}
                        className="h-8"
                      >
                        添加作战
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(getConfigValue(["daily", "fight"], []) as any[]).map((fight, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded dark:border-gray-600">
                          <Input
                            placeholder="关卡代号"
                            value={fight.level || ""}
                            onChange={(e) => {
                              const fights = getConfigValue(["daily", "fight"], [])
                              const newFights = [...fights]
                              newFights[index] = { ...newFights[index], level: e.target.value }
                              updateConfig(["daily", "fight"], newFights)
                            }}
                            className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          />
                          <Input
                            type="number"
                            placeholder="次数"
                            min="1"
                            max="99"
                            value={fight.num || 1}
                            onChange={(e) => {
                              const fights = getConfigValue(["daily", "fight"], [])
                              const newFights = [...fights]
                              const num = Math.min(99, Math.max(1, Number.parseInt(e.target.value) || 1))
                              newFights[index] = { ...newFights[index], num }
                              updateConfig(["daily", "fight"], newFights)
                            }}
                            className="w-20 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const fights = getConfigValue(["daily", "fight"], [])
                              const newFights = fights.filter((_: any, i: number) => i !== index)
                              updateConfig(["daily", "fight"], newFights)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      {(getConfigValue(["daily", "fight"], []) as any[]).length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          暂无作战配置，点击"添加作战"开始配置
                        </div>
                      )}
                    </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium dark:text-white">吃药次数</Label>
                      <Input
                        type="number"
                        value={getConfigValue(["daily", "sanity", "drug"], 1)}
                        onChange={(e) =>
                          updateConfig(["daily", "sanity", "drug"], Number.parseInt(e.target.value) || 0)
                        }
                        className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium dark:text-white">碎石次数</Label>
                      <Input
                        type="number"
                        value={getConfigValue(["daily", "sanity", "stone"], 0)}
                        onChange={(e) =>
                          updateConfig(["daily", "sanity", "stone"], Number.parseInt(e.target.value) || 0)
                        }
                        className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: "mail", label: "邮件领取" },
                      { key: "friend", label: "好友访问" },
                      { key: "credit", label: "信用商店" },
                      { key: "task", label: "任务领取" },
                      { key: "activity", label: "限时活动" },
                      { key: "fight_enable", label: "开启作战" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`daily_${item.key}`}
                          checked={getConfigValue(["daily", item.key], false)}
                          onCheckedChange={(checked) => updateConfig(["daily", item.key], !!checked)}
                        />
                        <Label htmlFor={`daily_${item.key}`} className="text-sm dark:text-white">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="text-sm font-medium dark:text-white">招募配置</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="offer_enable"
                          checked={getConfigValue(["daily", "offer", "enable"], true)}
                          onCheckedChange={(checked) => updateConfig(["daily", "offer", "enable"], !!checked)}
                        />
                        <Label htmlFor="offer_enable" className="text-sm dark:text-white">
                          启用招募
                        </Label>
                      </div>
                      {[
                        { key: "car", label: "招募小车" },
                        { key: "star4", label: "招募4星" },
                        { key: "star5", label: "招募5星" },
                        { key: "star6", label: "招募6星" },
                        { key: "other", label: "招募其他" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`offer_${item.key}`}
                            checked={getConfigValue(["daily", "offer", item.key], false)}
                            onCheckedChange={(checked) => updateConfig(["daily", "offer", item.key], !!checked)}
                          />
                          <Label htmlFor={`offer_${item.key}`} className="text-sm dark:text-white">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium dark:text-white">基建设置</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: "harvest", label: "基建收货" },
                        { key: "shift", label: "基建换班" },
                        { key: "acceleration", label: "基建加速" },
                        { key: "communication", label: "线索交流" },
                        { key: "deputy", label: "基建副手" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`infra_${item.key}`}
                            checked={getConfigValue(["daily", "infrastructure", item.key], false)}
                            onCheckedChange={(checked) =>
                              updateConfig(["daily", "infrastructure", item.key], !!checked)
                            }
                          />
                          <Label htmlFor={`infra_${item.key}`} className="text-sm dark:text-white">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Target className="h-5 w-5" />
                    肉鸽配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium dark:text-white">干员选择</Label>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs dark:text-gray-300">干员位置</Label>
                        <Input
                          type="number"
                          value={getConfigValue(["rogue", "operator", "index"], -1)}
                          onChange={(e) =>
                            updateConfig(["rogue", "operator", "index"], Number.parseInt(e.target.value) || -1)
                          }
                          className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs dark:text-gray-300">开技能次数</Label>
                        <Input
                          type="number"
                          value={getConfigValue(["rogue", "operator", "num"], 99)}
                          onChange={(e) =>
                            updateConfig(["rogue", "operator", "num"], Number.parseInt(e.target.value) || 99)
                          }
                          className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs dark:text-gray-300">技能等级</Label>
                        <Input
                          type="number"
                          value={getConfigValue(["rogue", "operator", "skill"], 1)}
                          onChange={(e) =>
                            updateConfig(["rogue", "operator", "skill"], Number.parseInt(e.target.value) || 1)
                          }
                          className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium dark:text-white">目标等级</Label>
                      <Input
                        type="number"
                        value={getConfigValue(["rogue", "level"], 0)}
                        onChange={(e) => updateConfig(["rogue", "level"], Number.parseInt(e.target.value) || 0)}
                        className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium dark:text-white">目标投币</Label>
                      <Input
                        type="number"
                        value={getConfigValue(["rogue", "coin"], 999)}
                        onChange={(e) => updateConfig(["rogue", "coin"], Number.parseInt(e.target.value) || 999)}
                        className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium dark:text-white">肉鸽类型</Label>
                      <Select
                        value={getConfigValue(["rogue", "type"], 1).toString()}
                        onValueChange={(value) => updateConfig(["rogue", "type"], Number.parseInt(value))}
                      >
                        <SelectTrigger className="mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">肉鸽1</SelectItem>
                          <SelectItem value="2">肉鸽2</SelectItem>
                          <SelectItem value="3">肉鸽3</SelectItem>
                          <SelectItem value="4">肉鸽4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium dark:text-white">跳过选项</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: "coin", label: "跳过投币" },
                        { key: "beast", label: "跳过难关" },
                        { key: "daily", label: "跳过日常" },
                        { key: "sensitive", label: "可打敏感" },
                        { key: "illusion", label: "可打臆想" },
                        { key: "survive", label: "可打生存" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`skip_${item.key}`}
                            checked={getConfigValue(["rogue", "skip", item.key], false)}
                            onCheckedChange={(checked) => updateConfig(["rogue", "skip", item.key], !!checked)}
                          />
                          <Label htmlFor={`skip_${item.key}`} className="text-sm dark:text-white">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notice" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知设置
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg dark:border-gray-600">
                  <h4 className="font-medium mb-3 dark:text-white">微信通知</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wxEnable"
                        checked={addForm.notice?.wxUID?.enable || false}
                        onCheckedChange={(checked) => updateNotice("wxUID", "enable", !!checked)}
                      />
                      <Label htmlFor="wxEnable" className="dark:text-white">
                        启用微信通知
                      </Label>
                    </div>
                    <Input
                      placeholder="微信UID"
                      value={addForm.notice?.wxUID?.text || ""}
                      onChange={(e) => updateNotice("wxUID", "text", e.target.value)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg dark:border-gray-600">
                  <h4 className="font-medium mb-3 dark:text-white">QQ通知</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="qqEnable"
                        checked={addForm.notice?.qq?.enable || false}
                        onCheckedChange={(checked) => updateNotice("qq", "enable", !!checked)}
                      />
                      <Label htmlFor="qqEnable" className="dark:text-white">
                        启用QQ通知
                      </Label>
                    </div>
                    <Input
                      placeholder="QQ号"
                      value={addForm.notice?.qq?.text || ""}
                      onChange={(e) => updateNotice("qq", "text", e.target.value)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg dark:border-gray-600">
                  <h4 className="font-medium mb-3 dark:text-white">邮件通知</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mailEnable"
                        checked={addForm.notice?.mail?.enable || false}
                        onCheckedChange={(checked) => updateNotice("mail", "enable", !!checked)}
                      />
                      <Label htmlFor="mailEnable" className="dark:text-white">
                        启用邮件通知
                      </Label>
                    </div>
                    <Input
                      placeholder="邮箱地址"
                      type="email"
                      value={addForm.notice?.mail?.text || ""}
                      onChange={(e) => updateNotice("mail", "text", e.target.value)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                活跃时间设置
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.keys(dayNames).map((day) => (
                  <div key={day} className="flex items-center space-x-2 p-3 border rounded-lg dark:border-gray-600">
                    <Checkbox
                      id={`active_${day}`}
                      checked={addForm.active?.[day]?.enable || false}
                      onCheckedChange={(checked) => updateActive(day, !!checked)}
                    />
                    <Label htmlFor={`active_${day}`} className="dark:text-white">
                      {dayNames[day]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="mr-2 h-4 w-4" />
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "保存中..." : "添加用户"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
