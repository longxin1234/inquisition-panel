"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createFightNode,
  createLoopGroupNode,
  moveItem,
  removeItem,
  resolveDailyPlan,
  type DailyPlanNode,
} from "@/lib/daily-plan"

interface DailyPlanEditorProps {
  plan?: any[]
  legacyFights?: any[]
  onChange: (plan: DailyPlanNode[]) => void
}

export function DailyPlanEditor({ plan, legacyFights, onChange }: DailyPlanEditorProps) {
  const items = resolveDailyPlan(plan, legacyFights)
  const loopGroupIndex = items.findIndex((item) => item.type === "loop_group")
  const hasBlockedTail = loopGroupIndex !== -1 && loopGroupIndex < items.length - 1

  const updateNode = (index: number, node: DailyPlanNode) => {
    onChange(items.map((item, current) => (current === index ? node : item)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium dark:text-white">作战配置</span>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, createLoopGroupNode()])}>
            添加循环组
          </Button>
          <Button type="button" size="sm" onClick={() => onChange([...items, createFightNode()])}>
            添加作战
          </Button>
        </div>
      </div>

      {hasBlockedTail && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          已启用循环组：循环组下面的作战不会下发到设备。
        </div>
      )}

      {items.map((node, index) =>
        node.type === "fight" ? (
          <div key={`fight-${index}`} className="flex items-center gap-2 rounded border p-2 dark:border-gray-600">
            <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" disabled={index === 0} onClick={() => onChange(moveItem(items, index, index - 1))}>↑</Button>
            <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" disabled={index === items.length - 1} onClick={() => onChange(moveItem(items, index, index + 1))}>↓</Button>
            <Input placeholder="关卡代号" value={node.fight.level} onChange={(e) => updateNode(index, { ...node, fight: { ...node.fight, level: e.target.value } })} className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            <Input type="number" min="1" max="99" value={node.fight.num} onChange={(e) => updateNode(index, { ...node, fight: { ...node.fight, num: Math.min(99, Math.max(1, Number.parseInt(e.target.value) || 1)) } })} className="w-20 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            <Button type="button" size="sm" variant="destructive" className="h-8 px-3" onClick={() => onChange(removeItem(items, index))}>删除</Button>
          </div>
        ) : (
          <div key={`group-${index}`} className="rounded border p-3 dark:border-gray-600">
            <div className="mb-3 flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" disabled={index === 0} onClick={() => onChange(moveItem(items, index, index - 1))}>↑</Button>
              <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" disabled={index === items.length - 1} onClick={() => onChange(moveItem(items, index, index + 1))}>↓</Button>
              <Input placeholder="循环组名称（可选）" value={node.loopGroup.name} onChange={(e) => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, name: e.target.value } })} className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
              <Button type="button" size="sm" variant="destructive" className="h-8 px-3" onClick={() => onChange(removeItem(items, index))}>删除循环组</Button>
            </div>

            <div className="space-y-2">
              {node.loopGroup.items.map((item, groupIndex) => (
                <div key={`group-item-${groupIndex}`} className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" disabled={groupIndex === 0} onClick={() => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: moveItem(node.loopGroup.items, groupIndex, groupIndex - 1) } })}>↑</Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" disabled={groupIndex === node.loopGroup.items.length - 1} onClick={() => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: moveItem(node.loopGroup.items, groupIndex, groupIndex + 1) } })}>↓</Button>
                  <Input placeholder="关卡代号" value={item.level} onChange={(e) => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: node.loopGroup.items.map((current, currentIndex) => currentIndex === groupIndex ? { ...current, level: e.target.value } : current) } })} className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                  <Input type="number" min="1" max="99" value={item.weight} onChange={(e) => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: node.loopGroup.items.map((current, currentIndex) => currentIndex === groupIndex ? { ...current, weight: Math.min(99, Math.max(1, Number.parseInt(e.target.value) || 1)) } : current) } })} className="w-20 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                  <Button type="button" size="sm" variant="outline" className="h-8 px-3" onClick={() => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: removeItem(node.loopGroup.items, groupIndex) } })}>移出</Button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <Button type="button" size="sm" variant="outline" onClick={() => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: [...node.loopGroup.items, { level: "", weight: 1 }] } })}>
                添加组内关卡
              </Button>
            </div>
          </div>
        ),
      )}

      {items.length === 0 && <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">暂无作战配置，点击上方按钮开始添加。</div>}
    </div>
  )
}
