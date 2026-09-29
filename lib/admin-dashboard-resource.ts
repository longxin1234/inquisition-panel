import type { AdminDashboardOverview } from "@/lib/admin-dashboard"
import { apiRequestWithAuth } from "@/lib/api-config"
import {
  createAdminDashboardResource,
  type DashboardLoadOptions,
} from "@/lib/admin-dashboard-resource-core"

const adminDashboardResource = createAdminDashboardResource(async (token) => {
  const result = await apiRequestWithAuth<AdminDashboardOverview>("/getDashboardOverview", token, {
    method: "GET",
  })
  if (result.code !== 200 || !result.data) {
    throw new Error(result.msg || "获取总览失败")
  }
  return result.data
})

export function getCachedAdminDashboardOverview(token: string): AdminDashboardOverview | null {
  return adminDashboardResource.getCached(token)
}

export function getAdminDashboardOverviewSnapshot(token: string): AdminDashboardOverview | null {
  return adminDashboardResource.getSnapshot(token)
}

export function loadAdminDashboardOverview(token: string, options?: DashboardLoadOptions): Promise<AdminDashboardOverview> {
  return adminDashboardResource.load(token, options)
}

export function preloadAdminDashboardOverview(token: string): Promise<AdminDashboardOverview | undefined> {
  return adminDashboardResource.load(token).catch(() => undefined)
}
