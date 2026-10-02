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
    { label: "今日新增", value: business.newAccountsToday, icon: UserPlus, color: "text-cyan-500" },
    { label: "有效账号", value: business.validAccounts, icon: UsersRound, color: "text-emerald-500" },
    { label: "今日收入", value: currency.format(business.dayIncome), icon: WalletCards, color: "text-emerald-500" },
    { label: "本月收入", value: currency.format(business.monthIncome), icon: CircleDollarSign, color: "text-amber-500" },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex min-h-20 items-center gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:border-r xl:border-b-0 xl:last:border-r-0">
            <item.icon className={`h-5 w-5 shrink-0 ${item.color}`} aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="mt-0.5 truncate text-lg font-semibold tabular-nums text-foreground">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
