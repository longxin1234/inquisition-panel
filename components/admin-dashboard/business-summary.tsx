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
    { label: "今日新增", value: business.newAccountsToday, icon: UserPlus },
    { label: "有效账号", value: business.validAccounts, icon: UsersRound },
    { label: "今日收入", value: currency.format(business.dayIncome), icon: WalletCards },
    { label: "本月收入", value: currency.format(business.monthIncome), icon: CircleDollarSign },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground" aria-labelledby="business-summary-title">
      <div className="flex min-h-12 items-center border-b border-border px-4">
        <h2 id="business-summary-title" className="text-sm font-semibold text-foreground">业务摘要</h2>
        <span className="ml-2 text-xs text-muted-foreground">账号与收入</span>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex min-h-20 items-center gap-3 border-b border-r border-border px-4 last:border-r-0 xl:border-b-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <item.icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="mt-1 truncate text-lg font-semibold tabular-nums text-foreground">{item.value}</div>
          </div>
        </div>
      ))}
      </div>
    </section>
  )
}
