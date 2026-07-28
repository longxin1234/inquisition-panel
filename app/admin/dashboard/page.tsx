"use client"

import { DashboardLayout } from "@/components/dashboard-layout"

export default function AdminDashboard() {
  return (
    <DashboardLayout contentClassName="max-w-[1600px]">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950 dark:text-white">管理员总览</h1>
        </div>
      </div>
    </DashboardLayout>
  )
}
