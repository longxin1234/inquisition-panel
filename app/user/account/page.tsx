"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Calendar, Zap, RefreshCw, Server, Shield, Mail, MessageSquare, List, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import React from "react"
import CreatableSelect from 'react-select/creatable'
import { useTheme } from "next-themes"

export interface UserAccountInfo {
  id: number
  name: string
  account: string
  password: string
  freeze: number
  server: number
  taskType: string
  config: {
    daily: {
      fight: Array<{
        level: string
        num: number
      }>
      sanity: {
        drug: number
        stone: number
      }
      mail: boolean
      offer: {
        enable: boolean
        car: boolean
        star4: boolean
        star5: boolean
        star6: boolean
        other: boolean
      }
      friend: boolean
      infrastructure: {
        harvest: boolean
        shift: boolean
        acceleration: boolean
        communication: boolean
        deputy: boolean
      }
      credit: boolean
      task: boolean
      activity: boolean
      cultivation: boolean
      cultivation_plan: any[]
      fight_enable: boolean
    }
    rogue: {
      operator: {
        index: number
        num: number
        skill: number
      }
      level: number
      coin: number
      type: number
      skip: {
        coin: boolean
        beast: boolean
        daily: boolean
        sensitive: boolean
        illusion: boolean
        survive: boolean
      }
    }
  }
  active: {
    monday: { enable: boolean; detail: any[] }
    tuesday: { enable: boolean; detail: any[] }
    wednesday: { enable: boolean; detail: any[] }
    thursday: { enable: boolean; detail: any[] }
    friday: { enable: boolean; detail: any[] }
    saturday: { enable: boolean; detail: any[] }
    sunday: { enable: boolean; detail: any[] }
  }
  notice: {
    wxUID: { text: string; enable: boolean }
    qq: { text: string; enable: boolean }
    mail: { text: string; enable: boolean }
  }
  refresh: number
  agent: string | null
  createTime: string
  updateTime: string
  expireTime: string
  delete: number
  blimitDevice: any[]
}

export default function UserAccount() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [accountInfo, setAccountInfo] = useState<UserAccountInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setEditAccount] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [sanity, setSanity] = useState<string>("")

  const [baseConfig, setBaseConfig] = useState<{
    friend: boolean
    credit: boolean
    mail: boolean
    activity: boolean
    task: boolean
    fight_enable: boolean
    fight: Array<{ level: string; num: number }>
    infrastructure: {
      shift: boolean
      harvest: boolean
      acceleration: boolean
      communication: boolean
      deputy: boolean
      [key: string]: boolean
    }
    wxUIDText: string | null
    wxUIDEnable: boolean | null
    qqText: string | null
    qqEnable: boolean | null
    mailText: string | null
    mailEnable: boolean | null
    mondayEnable: boolean | null
    tuesdayEnable: boolean | null
    wednesdayEnable: boolean | null
    thursdayEnable: boolean | null
    fridayEnable: boolean | null
    saturdayEnable: boolean | null
    sundayEnable: boolean | null
    offer: {
      enable: boolean;
      car: boolean;
      other: boolean;
      star4: boolean;
      star5: boolean;
      star6: boolean;
      [key: string]: boolean;
    } | null;
    sanityStone?: number
    sanityDrug?: number
    [key: string]: any
  }>(
    {
      friend: false,
      credit: false,
      mail: false,
      activity: false,
      task: false,
      fight_enable: false,
      fight: [],
      infrastructure: {
        shift: false,
        harvest: false,
        acceleration: false,
        communication: false,
        deputy: false,
      },
      wxUIDText: null,
      wxUIDEnable: null,
      qqText: null,
      qqEnable: null,
      mailText: null,
      mailEnable: null,
      mondayEnable: true,
      tuesdayEnable: true,
      wednesdayEnable: true,
      thursdayEnable: true,
      fridayEnable: true,
      saturdayEnable: true,
      sundayEnable: true,
      offer: null,
      sanityStone: 0,
      sanityDrug: 0,
    }
  )

  const getToken = () => contextToken || getStoredToken()

  const fetchAccountInfo = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await apiRequestWithAuth("/showMyAccount", token, { method: "GET" })
      if (result.code === 200) {
        const data = result.data as UserAccountInfo
        setAccountInfo(data)
        setEditAccount(data?.account || "")
        setBaseConfig(prev => ({
          ...prev,
          wxUIDText: data.notice?.wxUID?.text || null,
          wxUIDEnable: data.notice?.wxUID?.enable || null,
          qqText: data.notice?.qq?.text || null,
          qqEnable: data.notice?.qq?.enable || null,
          mailText: data.notice?.mail?.text || null,
          mailEnable: data.notice?.mail?.enable || null,
          mondayEnable: data.active?.monday?.enable ?? true,
          tuesdayEnable: data.active?.tuesday?.enable ?? true,
          wednesdayEnable: data.active?.wednesday?.enable ?? true,
          thursdayEnable: data.active?.thursday?.enable ?? true,
          fridayEnable: data.active?.friday?.enable ?? true,
          saturdayEnable: data.active?.saturday?.enable ?? true,
          sundayEnable: data.active?.sunday?.enable ?? true,
          offer: data.config?.daily?.offer ?? null,
          sanityStone: data.config?.daily?.sanity?.stone ?? 0,
          sanityDrug: data.config?.daily?.sanity?.drug ?? 0,
        }))
      } else {
        toast({ variant: "destructive", title: "获取失败", description: result.msg })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: error instanceof Error ? error.message : "获取失败" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accountInfo) {
      setBaseConfig({
        friend: accountInfo.config?.daily?.friend ?? false,
        credit: accountInfo.config?.daily?.credit ?? false,
        mail: accountInfo.config?.daily?.mail ?? false,
        activity: accountInfo.config?.daily?.activity ?? false,
        task: accountInfo.config?.daily?.task ?? false,
        fight_enable: accountInfo.config?.daily?.fight_enable ?? false,
        fight: accountInfo.config?.daily?.fight ?? [],
        infrastructure: accountInfo.config?.daily?.infrastructure ?? {
          shift: false,
          harvest: false,
          acceleration: false,
          communication: false,
          deputy: false,
        },
        wxUIDText: accountInfo.notice?.wxUID?.text || null,
        wxUIDEnable: accountInfo.notice?.wxUID?.enable || null,
        qqText: accountInfo.notice?.qq?.text || null,
        qqEnable: accountInfo.notice?.qq?.enable || null,
        mailText: accountInfo.notice?.mail?.text || null,
        mailEnable: accountInfo.notice?.mail?.enable || null,
        mondayEnable: accountInfo.active?.monday?.enable ?? true,
        tuesdayEnable: accountInfo.active?.tuesday?.enable ?? true,
        wednesdayEnable: accountInfo.active?.wednesday?.enable ?? true,
        thursdayEnable: accountInfo.active?.thursday?.enable ?? true,
        fridayEnable: accountInfo.active?.friday?.enable ?? true,
        saturdayEnable: accountInfo.active?.saturday?.enable ?? true,
        sundayEnable: accountInfo.active?.sunday?.enable ?? true,
        offer: accountInfo.config?.daily?.offer ?? null,
        sanityStone: accountInfo.config?.daily?.sanity?.stone ?? 0,
        sanityDrug: accountInfo.config?.daily?.sanity?.drug ?? 0,
      })
    }
  }, [accountInfo])

  const handleSaveBaseConfig = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token) || !accountInfo) return
    setUpdateLoading(true)
    try {
      const newConfig = {
        ...accountInfo.config,
        daily: {
          ...accountInfo.config.daily,
          ...baseConfig,
          sanity: {
            ...accountInfo.config.daily.sanity,
            stone: baseConfig.sanityStone ?? accountInfo.config.daily.sanity?.stone ?? 0,
            drug: baseConfig.sanityDrug ?? accountInfo.config.daily.sanity?.drug ?? 0,
          },
        },
      }
      const newNotice = {
        wxUID: {
          text: baseConfig.wxUIDText ?? accountInfo.notice.wxUID.text,
          enable: baseConfig.wxUIDEnable ?? accountInfo.notice.wxUID.enable,
        },
        qq: {
          text: baseConfig.qqText ?? accountInfo.notice.qq.text,
          enable: baseConfig.qqEnable ?? accountInfo.notice.qq.enable,
        },
        mail: {
          text: baseConfig.mailText ?? accountInfo.notice.mail.text,
          enable: baseConfig.mailEnable ?? accountInfo.notice.mail.enable,
        },
      }
      const newActive = {
        monday: { ...accountInfo.active.monday, enable: baseConfig.mondayEnable ?? accountInfo.active.monday.enable },
        tuesday: { ...accountInfo.active.tuesday, enable: baseConfig.tuesdayEnable ?? accountInfo.active.tuesday.enable },
        wednesday: { ...accountInfo.active.wednesday, enable: baseConfig.wednesdayEnable ?? accountInfo.active.wednesday.enable },
        thursday: { ...accountInfo.active.thursday, enable: baseConfig.thursdayEnable ?? accountInfo.active.thursday.enable },
        friday: { ...accountInfo.active.friday, enable: baseConfig.fridayEnable ?? accountInfo.active.friday.enable },
        saturday: { ...accountInfo.active.saturday, enable: baseConfig.saturdayEnable ?? accountInfo.active.saturday.enable },
        sunday: { ...accountInfo.active.sunday, enable: baseConfig.sundayEnable ?? accountInfo.active.sunday.enable },
      }
      const result = await apiRequestWithAuth("/updateMyAccount", token, {
        method: "POST",
        body: JSON.stringify({
          config: newConfig,
          notice: newNotice,
          active: newActive,
        }),
        headers: { "Content-Type": "application/json" },
      })
      if (result.code === 200) {
        toast({ variant: "success", title: "保存成功", description: result.msg })
        await fetchAccountInfo()
      } else {
        toast({ variant: "destructive", title: "保存失败", description: result.msg })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "网络错误", description: error instanceof Error ? error.message : "保存失败" })
    } finally {
      setUpdateLoading(false)
    }
  }

  useEffect(() => {
    fetchAccountInfo()
    fetchSanity()
  }, [])

  const fetchSanity = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) return
    try {
      const result = await apiRequestWithAuth("/showMySan", token, { method: "GET" })
      if (result.code === 200) {
        setSanity(String(result.data))
      } else {
        setSanity("-")
      }
    } catch {
      setSanity("-")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN")
  }
  const isExpired = (expireTime: string) => {
    return new Date(expireTime) < new Date()
  }
  const getTaskTypeName = (taskType: string) => {
    const taskTypes: Record<string, string> = {
      daily: "日常任务",
      rogue: "肉鸽任务",
      sand_fire: "生息演算",
    }
    return taskTypes[taskType] || taskType
  }

  const stageOptions = [
    { value: 'jm', label: '剿灭' },
    { value: 'ce', label: '龙门币' },
    { value: 'ls', label: '经验卡' },
    { value: 'ap', label: '红票' },
    { value: 'ca', label: '技能书' },
    { value: '1-7', label: '1-7' },
    { value: 'hd', label: '活动材料关' },
    { value: 'pr2', label: '大芯片任意' },
    { value: 'pr1', label: '小芯片任意' },
    { value: 'hd-10', label: '活动第十关' },
    { value: 'hd-9', label: '活动第九关' },
    { value: 'hd-8', label: '活动第八关' },
    { value: 'hd-7', label: '活动第七关' },
    { value: 'hd-6', label: '活动第六关' },
    { value: 'hd-5', label: '活动第五关' },
    { value: '近卫2', label: '近卫芯片[大]' },
    { value: '近卫1', label: '近卫芯片[小]' },
    { value: '特种2', label: '特种芯片[大]' },
    { value: '特种1', label: '特种芯片[小]' },
    { value: '医疗2', label: '医疗芯片[大]' },
    { value: '医疗1', label: '医疗芯片[小]' },
    { value: '重装2', label: '重装芯片[大]' },
    { value: '重装1', label: '重装芯片[小]' },
    { value: '辅助2', label: '辅助芯片[大]' },
    { value: '辅助1', label: '辅助芯片[小]' },
    { value: '狙击2', label: '狙击芯片[大]' },
    { value: '狙击1', label: '狙击芯片[小]' },
    { value: '术士2', label: '术士芯片[大]' },
    { value: '术士1', label: '术士芯片[小]' },
    { value: '先锋2', label: '先锋芯片[大]' },
    { value: '先锋1', label: '先锋芯片[小]' }
  ]

  function StageCombobox({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled?: boolean }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [inputValue, setInputValue] = useState(value);
    useEffect(() => { setInputValue(value) }, [value]);
    return (
      <div className="w-40">
        <CreatableSelect
          isClearable
          isDisabled={disabled}
          value={value ? { value, label: value } : null}
          inputValue={inputValue}
          options={stageOptions}
          onChange={opt => {
            onChange(opt ? opt.value : "");
          }}
          onInputChange={(input, action) => {
            setInputValue(input);
          }}
          placeholder="关卡名/编号"
          formatCreateLabel={input => `自定义: ${input}`}
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: 40,
              fontSize: 14,
              backgroundColor: isDark ? '#23272f' : '#fff',
              color: isDark ? '#fff' : '#222',
              borderColor: state.isFocused ? '#2563eb' : (isDark ? '#444' : '#d1d5db'),
              boxShadow: state.isFocused ? '0 0 0 1.5px #2563eb' : undefined,
            }),
            menu: (base) => ({
              ...base,
              zIndex: 100,
              backgroundColor: isDark ? '#23272f' : '#fff',
              color: isDark ? '#fff' : '#222',
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected
                ? (isDark ? '#2563eb' : '#e0e7ff')
                : state.isFocused
                  ? (isDark ? '#1e293b' : '#f1f5f9')
                  : (isDark ? '#23272f' : '#fff'),
              color: isDark ? '#fff' : '#222',
              cursor: 'pointer',
            }),
            singleValue: (base) => ({ ...base, color: isDark ? '#fff' : '#222' }),
            input: (base) => ({ ...base, color: isDark ? '#fff' : '#222' }),
            placeholder: (base) => ({ ...base, color: isDark ? '#888' : '#888' }),
            menuList: (base) => ({ ...base, backgroundColor: isDark ? '#23272f' : '#fff' }),
          }}
          theme={theme => ({
            ...theme,
            borderRadius: 6,
            colors: {
              ...theme.colors,
              primary: '#2563eb',
              neutral0: isDark ? '#23272f' : '#fff',
              neutral80: isDark ? '#fff' : '#222',
              neutral20: isDark ? '#444' : '#d1d5db',
              neutral30: isDark ? '#444' : '#d1d5db',
            },
          })}
          noOptionsMessage={() => '无匹配'}
        />
      </div>
    )
  }
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">账户信息</h1>
          <p className="text-gray-600 dark:text-gray-400">查看和修改您的账户信息</p>
        </div>
        <Button onClick={handleSaveBaseConfig} disabled={updateLoading} className="h-10 px-6">
          {updateLoading ? "保存中..." : "保存配置"}
        </Button>
      </div>
      <Card className="dark:bg-gray-800 dark:border-gray-700 w-full h-full min-h-[70vh] p-4 md:p-8">
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <User className="h-5 w-5" /> 账户详情
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {loading ? (
            <div>加载中...</div>
          ) : accountInfo ? (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">用户名:</span>
                      <span className="font-medium dark:text-white">{accountInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">账号:</span>
                      <span className="font-medium dark:text-white">{accountInfo.account}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">服务器:</span>
                      <span className="font-medium dark:text-white">{accountInfo.server === 0 ? "官服" : "B服"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">任务类型:</span>
                      <span className="font-medium dark:text-white">{getTaskTypeName(accountInfo.taskType)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">状态:</span>
                      <Badge variant={accountInfo.freeze ? "destructive" : "default"}>{accountInfo.freeze ? "已冻结" : "正常"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">理智:</span>
                      <span className="font-medium dark:text-white">{sanity || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">刷新次数:</span>
                      <span className="font-medium dark:text-white">{accountInfo.refresh}</span>
                    </div>
                    {Number(accountInfo.agent) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">代理:</span>
                        <span className="font-medium dark:text-white">{accountInfo.agent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Separator className="dark:bg-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">基础配置</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: "friend", label: "好友访问" },
                      { key: "credit", label: "信用商店" },
                      { key: "mail", label: "邮件收取" },
                      { key: "activity", label: "限时活动" },
                      { key: "task", label: "任务领取" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-24">{item.label}</span>
                        <Switch
                          checked={baseConfig[item.key as keyof typeof baseConfig] as boolean}
                          onCheckedChange={v => setBaseConfig(cfg => ({ ...cfg, [item.key]: v }))}
                          disabled={updateLoading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Separator className="dark:bg-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">作战配置</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-24">作战开关</span>
                    <Switch
                      checked={baseConfig.fight_enable}
                      onCheckedChange={v => setBaseConfig(cfg => ({ ...cfg, fight_enable: v }))}
                      disabled={updateLoading}
                    />
                  </div>
                  <div>
                    <div className="flex items-center mb-2 gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">作战列表</span>
                      <span style={{ width: 6, display: 'inline-block' }}></span>
                      <Button
                        size="sm"
                        style={{ backgroundColor: '#2563eb', color: '#fff' }}
                        onClick={() => setBaseConfig(cfg => ({
                          ...cfg,
                          fight: [
                            ...(cfg.fight || []),
                            { level: "", num: 1 },
                          ],
                        }))}
                        disabled={updateLoading}
                      >
                        新增作战
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(baseConfig.fight || []).length === 0 && (
                        <div className="text-xs text-gray-400">暂无作战，请点击“新增作战”</div>
                      )}
                      {(baseConfig.fight || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <StageCombobox
                            value={item.level}
                            onChange={v => setBaseConfig(cfg => {
                              const fight = [...(cfg.fight || [])]
                              fight[idx] = { ...fight[idx], level: v }
                              return { ...cfg, fight }
                            })}
                            disabled={updateLoading}
                          />
                          <Input
                            className="w-20"
                            type="number"
                            min={1}
                            max={99}
                            value={item.num}
                            onChange={e => setBaseConfig(cfg => {
                              const fight = [...(cfg.fight || [])]
                              let val = Number(e.target.value)
                              if (val > 99) val = 99
                              if (val < 1) val = 1
                              fight[idx] = { ...fight[idx], num: val }
                              return { ...cfg, fight }
                            })}
                            disabled={updateLoading}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setBaseConfig(cfg => {
                              if (idx === 0) return cfg
                              const fight = [...(cfg.fight || [])]
                              const temp = fight[idx - 1]
                              fight[idx - 1] = fight[idx]
                              fight[idx] = temp
                              return { ...cfg, fight }
                            })}
                            disabled={updateLoading || idx === 0}
                            title="上移"
                          >
                            ↑
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setBaseConfig(cfg => {
                              if (idx === cfg.fight.length - 1) return cfg
                              const fight = [...cfg.fight]
                              const temp = fight[idx + 1]
                              fight[idx + 1] = fight[idx]
                              fight[idx] = temp
                              return { ...cfg, fight }
                            })}
                            disabled={updateLoading || idx === baseConfig.fight.length - 1}
                            title="下移"
                          >
                            ↓
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setBaseConfig(cfg => {
                              const fight = [...cfg.fight]
                              fight.splice(idx, 1)
                              return { ...cfg, fight }
                            })}
                            disabled={updateLoading}
                            title="删除"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2">
                刷关顺序为从上到下。上面为常用关卡，如需刷主线等，写代号11-12,9-8等。<br />
                故事集关卡掉率低，而且所有关均掉落代币，所以不会刷。<br />
                活动材料关指能刷蓝色材料的关卡（通常是6，7，8三关）。
              </p>
              <Separator className="dark:bg-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">药水配置</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-24">碎石次数</span>
                      <Input
                        className="w-20"
                        type="number"
                        min={0}
                        max={99}
                        value={baseConfig.sanityStone ?? accountInfo?.config?.daily?.sanity?.stone ?? 0}
                        onChange={e => {
                          let val = Number(e.target.value)
                          if (val > 99) val = 99
                          if (val < 0) val = 0
                          setBaseConfig(cfg => ({ ...cfg, sanityStone: val }))
                        }}
                        disabled={updateLoading}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">次/天</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-24">吃药次数</span>
                      <Input
                        className="w-20"
                        type="number"
                        min={0}
                        max={99}
                        value={baseConfig.sanityDrug ?? accountInfo?.config?.daily?.sanity?.drug ?? 0}
                        onChange={e => {
                          let val = Number(e.target.value)
                          if (val > 99) val = 99
                          if (val < 0) val = 0
                          setBaseConfig(cfg => ({ ...cfg, sanityDrug: val }))
                        }}
                        disabled={updateLoading}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">次/天</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-red-500 mt-2">请于任务完成后将本项改回0，否则每次上线都会碎石和使用药水</p>
              <Separator className="dark:bg-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">基建配置</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: "shift", label: "基建排班" },
                      { key: "harvest", label: "基建收获" },
                      { key: "deputy", label: "副手换人" },
                      { key: "acceleration", label: "制造站加速" },
                      { key: "communication", label: "线索交流" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-24">{item.label}</span>
                        <Switch
                          checked={baseConfig.infrastructure?.[item.key as keyof typeof baseConfig.infrastructure] ?? false}
                          onCheckedChange={v => setBaseConfig(cfg => ({
                            ...cfg,
                            infrastructure: {
                              ...cfg.infrastructure,
                              [item.key]: v
                            }
                          }))}
                          disabled={updateLoading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Separator className="dark:bg-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">公招配置</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "offer", label: "启用公招" },
                    { key: "car", label: "招募小车" },
                    { key: "other", label: "招募三星" },
                    { key: "star4", label: "招募四星" },
                    { key: "star5", label: "招募五星" },
                    { key: "star6", label: "招募六星" },
                  ].map(item => {
                    const offerObj = baseConfig.offer ?? accountInfo.config?.daily?.offer ?? {};
                    const checked = item.key === "offer"
                      ? (offerObj.enable ?? false)
                      : (offerObj[item.key as keyof typeof offerObj] ?? false);
                    return (
                      <div key={item.key} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-24">{item.label}</span>
                        <Switch
                          checked={checked}
                          onCheckedChange={v => {
                            setBaseConfig(cfg => {
                              const prevOffer = cfg.offer ?? accountInfo.config?.daily?.offer ?? {};
                              const newOffer = {
                                ...prevOffer,
                                [item.key]: v,
                              };
                              return {
                                ...cfg,
                                offer: newOffer,
                              };
                            });
                          }}
                          disabled={updateLoading}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  勾选哪一项表示会自动招募哪一项，五星/六星不勾选会默认保留，可在日志中看到。
                </p>
              </div>
              <Separator className="dark:bg-gray-600" />
              {accountInfo.notice && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 dark:text-white">通知设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="wxEnable"
                        checked={baseConfig.wxUIDEnable ?? accountInfo.notice.wxUID.enable}
                        onCheckedChange={v => setBaseConfig(cfg => ({ ...cfg, wxUIDEnable: !!v }))}
                        disabled={updateLoading}
                      />
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-8">微信</span>
                      <Input
                        className="w-32"
                        value={baseConfig.wxUIDText ?? accountInfo.notice.wxUID.text}
                        onChange={e => setBaseConfig(cfg => ({ ...cfg, wxUIDText: e.target.value }))}
                        placeholder="微信UID"
                        disabled={updateLoading}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="qqEnable"
                        checked={baseConfig.qqEnable ?? accountInfo.notice.qq.enable}
                        onCheckedChange={v => setBaseConfig(cfg => ({ ...cfg, qqEnable: !!v }))}
                        disabled={updateLoading}
                      />
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-8">QQ</span>
                      <Input
                        className="w-32"
                        value={baseConfig.qqText ?? accountInfo.notice.qq.text}
                        onChange={e => setBaseConfig(cfg => ({ ...cfg, qqText: e.target.value }))}
                        placeholder="QQ号"
                        disabled={updateLoading}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mailEnable"
                        checked={baseConfig.mailEnable ?? accountInfo.notice.mail.enable}
                        onCheckedChange={v => setBaseConfig(cfg => ({ ...cfg, mailEnable: !!v }))}
                        disabled={updateLoading}
                      />
                      <Mail className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-8">邮件</span>
                      <Input
                        className="w-32"
                        value={baseConfig.mailText ?? accountInfo.notice.mail.text}
                        onChange={e => setBaseConfig(cfg => ({ ...cfg, mailText: e.target.value }))}
                        placeholder="邮箱"
                        disabled={updateLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
              <Separator className="dark:bg-gray-600" />
              {accountInfo.active && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 dark:text-white">上号时间设置</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {Object.entries(accountInfo.active).map(([day, config]: [string, any]) => {
                      const dayNames: Record<string, string> = {
                        monday: "周一",
                        tuesday: "周二",
                        wednesday: "周三",
                        thursday: "周四",
                        friday: "周五",
                        saturday: "周六",
                        sunday: "周日",
                      };
                      const key = (day + "Enable") as keyof typeof baseConfig;
                      return (
                        <div key={day} className="flex items-center space-x-2 p-3 border rounded-lg dark:border-gray-600">
                          <Checkbox
                            id={`active_${day}`}
                            checked={(baseConfig[key] as boolean | null) ?? config.enable}
                            onCheckedChange={v => setBaseConfig(cfg => ({ ...cfg, [key]: v }))}
                            disabled={updateLoading}
                          />
                          <label htmlFor={`active_${day}`} className="text-sm font-medium dark:text-white select-none cursor-pointer">{dayNames[day]}</label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <Separator className="dark:bg-gray-600" />
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">时间信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">创建时间</p>
                      <p className="font-medium dark:text-white">{formatDate(accountInfo.createTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">更新时间</p>
                      <p className="font-medium dark:text-white">{formatDate(accountInfo.updateTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">到期时间</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium dark:text-white">{formatDate(accountInfo.expireTime)}</p>
                        <Badge variant={isExpired(accountInfo.expireTime) ? "destructive" : "default"}>
                          {isExpired(accountInfo.expireTime) ? "已到期" : "有效"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>未获取到账户信息</div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
