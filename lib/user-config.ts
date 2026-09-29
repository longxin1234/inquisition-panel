export type UserTaskConfig = Record<string, unknown>

export const USER_TASK_GROUPS = [
  { id: "daily", label: "日常任务", keys: ["mail", "friend", "infrastructure", "credit", "task", "activity"] },
  { id: "resource", label: "资源与理智", keys: ["fight_enable", "sanity", "offer"] },
  { id: "schedule", label: "调度设置", keys: ["active", "refresh"] },
] as const

export function reorderTaskGroups<T extends { id: string }>(groups: T[], order: string[]): T[] {
  const rank = new Map(order.map((id, index) => [id, index]))
  return [...groups].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
}

export function summarizeTaskConfig(config: UserTaskConfig): { enabled: number; total: number } {
  const keys = ["mail", "friend", "credit", "task", "activity", "fight_enable"]
  return { enabled: keys.filter((key) => config[key] === true).length, total: keys.length }
}

export function serverLabel(server: unknown): string {
  return Number(server) === 1 ? "B服" : "官服"
}
