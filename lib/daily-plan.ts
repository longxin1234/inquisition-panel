export type DailyFight = {
  level: string
  num: number
}

export type LoopGroupItem = {
  level: string
  weight: number
}

export type DailyPlanNode =
  | { type: "fight"; fight: DailyFight }
  | { type: "loop_group"; loopGroup: { name: string; items: LoopGroupItem[] } }

const clamp = (value: unknown, fallback = 1, max = 99) => {
  const num = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(1, num))
}

export const createFightNode = (): DailyPlanNode => ({
  type: "fight",
  fight: { level: "", num: 1 },
})

export const createLoopGroupNode = (): DailyPlanNode => ({
  type: "loop_group",
  loopGroup: {
    name: "",
    items: [{ level: "", weight: 1 }],
  },
})

export const normalizeFight = (fight: any): DailyFight => ({
  level: typeof fight?.level === "string" ? fight.level : "",
  num: clamp(fight?.num),
})

export const normalizeLoopGroupItem = (item: any): LoopGroupItem => ({
  level: typeof item?.level === "string" ? item.level : "",
  weight: clamp(item?.weight),
})

export const normalizePlanNode = (node: any): DailyPlanNode => {
  if (node?.type === "loop_group") {
    const items = Array.isArray(node?.loopGroup?.items)
      ? node.loopGroup.items.map(normalizeLoopGroupItem)
      : [{ level: "", weight: 1 }]
    return {
      type: "loop_group",
      loopGroup: {
        name: typeof node?.loopGroup?.name === "string" ? node.loopGroup.name : "",
        items,
      },
    }
  }

  return {
    type: "fight",
    fight: normalizeFight(node?.fight ?? node),
  }
}

export const fightToPlan = (fights: any[] = []): DailyPlanNode[] =>
  fights.map((fight) => ({
    type: "fight",
    fight: normalizeFight(fight),
  }))

export const resolveDailyPlan = (plan?: any[], legacyFights?: any[]): DailyPlanNode[] => {
  if (Array.isArray(plan) && plan.length > 0) {
    return plan.map(normalizePlanNode)
  }
  if (Array.isArray(plan) && plan.length === 0 && Array.isArray(legacyFights) && legacyFights.length > 0) {
    return fightToPlan(legacyFights)
  }
  if (Array.isArray(plan)) {
    return []
  }
  return fightToPlan(Array.isArray(legacyFights) ? legacyFights : [])
}

export const moveItem = <T,>(items: T[], from: number, to: number) => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items
  }
  const next = [...items]
  const [current] = next.splice(from, 1)
  next.splice(to, 0, current)
  return next
}

export const removeItem = <T,>(items: T[], index: number) => items.filter((_, current) => current !== index)
