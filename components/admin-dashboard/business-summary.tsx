import { CircleDollarSign, UserPlus, UsersRound, WalletCards } from "lucide-react"

import type { AdminDashboardOverview } from "@/lib/admin-dashboard"

interface BusinessSummaryProps {
  business: AdminDashboardOverview["business"]
}

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
})

export function BusinessSummary({ business }: BusinessSummaryProps) {
  const items = [
    { label: "今日新增", value: business.newAccountsToday, icon: UserPlus, accent: "text-cyan-700 dark:text-cyan-300" },
    { label: "有效账号", value: business.validAccounts, icon: UsersRound, accent: "text-teal-700 dark:text-teal-300" },
    { label: "今日收入", value: currency.format(business.dayIncome), icon: WalletCards, accent: "text-emerald-700 dark:text-emerald-300" },
    { label: "本月收入", value: currency.format(business.monthIncome), icon: CircleDollarSign, accent: "text-amber-700 dark:text-amber-300" },
  ]

  return (
    <section className="grid overflow-hidden rounded-md border border-gray-200 bg-white sm:grid-cols-2 xl:grid-cols-4 dark:border-gray-700 dark:bg-gray-800" aria-label="经营数据">
      {items.map((item) => (
        <div key={item.label} className="flex min-h-20 items-center gap-3 border-b border-r border-gray-100 px-4 last:border-r-0 dark:border-gray-700 sm:border-b-0">
          <item.icon className={`h-5 w-5 shrink-0 ${item.accent}`} aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
            <div className="mt-1 truncate text-lg font-semibold tabular-nums text-gray-950 dark:text-white">{item.value}</div>
          </div>
        </div>
      ))}
    </section>
  )
}
