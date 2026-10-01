import type { LucideIcon } from "lucide-react"
import {
  Bell,
  BookOpen,
  CalendarClock,
  Crown,
  FileText,
  Gift,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Settings,
  Shield,
  SlidersHorizontal,
  Smartphone,
  User,
  UserCog,
  Users,
} from "lucide-react"

export type WorkspaceRole = "user" | "admin" | "prouser"

export interface WorkspaceNavigationItem {
  title: string
  description: string
  href: string
  icon: LucideIcon
  keywords?: string[]
}

export interface WorkspaceNavigationGroup {
  label: string
  items: WorkspaceNavigationItem[]
}

const navigationByRole: Record<WorkspaceRole, WorkspaceNavigationGroup[]> = {
  user: [
    {
      label: "",
      items: [
        {
          title: "首页",
          description: "查看账号状态与任务配置",
          href: "/user/dashboard",
          icon: LayoutDashboard,
          keywords: ["总览", "状态", "配置", "任务"],
        },
        {
          title: "运行记录",
          description: "查询历史运行结果与日志",
          href: "/user/logs",
          icon: FileText,
          keywords: ["日志", "历史"],
        },
        {
          title: "CDK兑换",
          description: "输入并激活授权码以延长使用期",
          href: "/user/cdk",
          icon: KeyRound,
          keywords: ["CDK", "兑换", "激活", "授权"],
        },
        {
          title: "通知设置",
          description: "配置微信、QQ与邮件推送通知",
          href: "/user/notice",
          icon: Bell,
          keywords: ["通知", "微信", "QQ", "邮件", "推送"],
        },
        {
          title: "工单反馈",
          description: "提交问题反馈并查看处理说明",
          href: "/user/feedback",
          icon: MessageSquare,
          keywords: ["工单", "反馈", "问题"],
        },
        {
          title: "使用说明",
          description: "查看系统功能指南与常见问题说明",
          href: "/user/guide",
          icon: BookOpen,
          keywords: ["使用说明", "帮助", "指南", "手册", "教程"],
        },
        {
          title: "安全设置",
          description: "管理游戏账号登录凭据与服务器",
          href: "/user/settings",
          icon: SlidersHorizontal,
          keywords: ["密码", "游戏账号", "服务器", "设置"],
        },
      ],
    },
  ],
  admin: [
    {
      label: "运行",
      items: [
        {
          title: "总览",
          description: "查看系统健康度与待处理事项",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
          keywords: ["首页", "状态"],
        },
        {
          title: "任务队列",
          description: "定位运行中与等待中的任务",
          href: "/admin/tasks",
          icon: ListTodo,
          keywords: ["任务管理", "队列"],
        },
        {
          title: "设备",
          description: "查看和处理设备连接状态",
          href: "/admin/devices",
          icon: Smartphone,
          keywords: ["设备管理", "在线"],
        },
      ],
    },
    {
      label: "账号",
      items: [
        {
          title: "用户",
          description: "管理普通用户与账号状态",
          href: "/admin/users",
          icon: Users,
          keywords: ["用户管理", "账号"],
        },
        {
          title: "代理",
          description: "管理代理用户与下属账号",
          href: "/admin/agents",
          icon: UserCog,
          keywords: ["代理管理", "渠道"],
        },
      ],
    },
    {
      label: "自动化",
      items: [
        {
          title: "调度计划",
          description: "管理定时触发与执行计划",
          href: "/admin/scheduled-tasks",
          icon: CalendarClock,
          keywords: ["脚本任务", "定时任务"],
        },
      ],
    },
    {
      label: "业务",
      items: [
        {
          title: "授权与 CDK",
          description: "创建和管理授权兑换码",
          href: "/admin/cdk",
          icon: Gift,
          keywords: ["CDK管理", "兑换码"],
        },
      ],
    },
    {
      label: "记录",
      items: [
        {
          title: "运行记录",
          description: "检索系统与用户运行日志",
          href: "/admin/logs",
          icon: FileText,
          keywords: ["日志管理", "历史"],
        },
      ],
    },
    {
      label: "系统",
      items: [
        {
          title: "系统设置",
          description: "调整系统级运行参数",
          href: "/admin/settings",
          icon: Settings,
          keywords: ["其他设置", "配置"],
        },
      ],
    },
  ],
  prouser: [
    {
      label: "工作",
      items: [
        {
          title: "总览",
          description: "查看代理账号和业务概况",
          href: "/prouser/dashboard",
          icon: LayoutDashboard,
          keywords: ["首页", "状态"],
        },
        {
          title: "附属用户",
          description: "管理代理名下的用户",
          href: "/prouser/subusers",
          icon: Users,
          keywords: ["下属", "用户"],
        },
        {
          title: "授权与 CDK",
          description: "管理可用授权与兑换码",
          href: "/prouser/cdk",
          icon: Gift,
          keywords: ["CDK管理", "兑换码"],
        },
      ],
    },
    {
      label: "系统",
      items: [
        {
          title: "代理设置",
          description: "调整代理账号设置",
          href: "/prouser/settings",
          icon: SlidersHorizontal,
          keywords: ["其他设置", "账户"],
        },
      ],
    },
  ],
}

export const rolePresentation: Record<WorkspaceRole, { label: string; icon: LucideIcon }> = {
  admin: { label: "管理工作台", icon: Shield },
  user: { label: "用户工作台", icon: User },
  prouser: { label: "代理工作台", icon: Crown },
}

export function getWorkspaceNavigation(role: WorkspaceRole | null) {
  if (!role || typeof role !== "string" || !(role in navigationByRole)) {
    return []
  }
  return navigationByRole[role] || []
}

export function getCurrentNavigationItem(role: WorkspaceRole | null, pathname: string | null | undefined) {
  if (!pathname || typeof pathname !== "string") return null
  const navigation = getWorkspaceNavigation(role)
  if (!Array.isArray(navigation)) return null
  const items = navigation.flatMap((group) => group?.items || [])
  return items.find((item) => {
    if (!item?.href) return false
    if (pathname === item.href) return true
    if (item.href.endsWith("/dashboard")) return false
    return pathname.startsWith(`${item.href}/`)
  })
}
