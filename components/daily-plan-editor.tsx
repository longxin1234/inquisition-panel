"use client"

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createFightNode, createLoopGroupNode, moveItem, removeItem, resolveDailyPlan, type DailyPlanNode } from "@/lib/daily-plan"
import { cn } from "@/lib/utils"

type LoopGroupNode = Extract<DailyPlanNode, { type: "loop_group" }>

interface DailyPlanEditorProps { plan?: any[]; legacyFights?: any[]; onChange: (plan: DailyPlanNode[]) => void }
interface SortableShellProps { id: string; className?: string; contentClassName?: string; children: React.ReactNode }

function SortableShell({ id, className, contentClassName, children }: SortableShellProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex gap-2 rounded border dark:border-gray-600", isDragging && "z-10 shadow-md ring-2 ring-blue-200 dark:ring-blue-800", className)}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="????"
        className="flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-md border border-dashed text-gray-500 transition hover:bg-gray-50 active:cursor-grabbing dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className={cn("min-w-0 flex-1", contentClassName)}>{children}</div>
    </div>
  )
}

const rootId = (index: number) => `root-${index}`
const loopId = (groupIndex: number, itemIndex: number) => `loop-${groupIndex}-${itemIndex}`

export function DailyPlanEditor({ plan, legacyFights, onChange }: DailyPlanEditorProps) {
  const items = resolveDailyPlan(plan, legacyFights)
  const loopGroupIndex = items.findIndex((item) => item.type === "loop_group")
  const hasBlockedTail = loopGroupIndex !== -1 && loopGroupIndex < items.length - 1
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const updateNode = (index: number, node: DailyPlanNode) => onChange(items.map((item, current) => (current === index ? node : item)))
  const handleRootDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((_, index) => rootId(index) === active.id)
    const to = items.findIndex((_, index) => rootId(index) === over.id)
    if (from >= 0 && to >= 0) onChange(moveItem(items, from, to))
  }
  const handleLoopDragEnd = (index: number, node: LoopGroupNode, { active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = node.loopGroup.items.findIndex((_, itemIndex) => loopId(index, itemIndex) === active.id)
    const to = node.loopGroup.items.findIndex((_, itemIndex) => loopId(index, itemIndex) === over.id)
    if (from >= 0 && to >= 0) updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: moveItem(node.loopGroup.items, from, to) } })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium dark:text-white">????</span>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, createLoopGroupNode()])}>?????</Button>
          <Button type="button" size="sm" onClick={() => onChange([...items, createFightNode()])}>????</Button>
        </div>
      </div>
      {hasBlockedTail && <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">???????????????????????</div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRootDragEnd}>
        <SortableContext items={items.map((_, index) => rootId(index))} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((node, index) =>
              node.type === "fight" ? (
                <SortableShell key={`fight-${index}`} id={rootId(index)} className="items-center p-2" contentClassName="flex items-center gap-2">
                  <Input placeholder="????" value={node.fight.level} onChange={(e) => updateNode(index, { ...node, fight: { ...node.fight, level: e.target.value } })} className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                  <Input type="number" min="1" max="99" value={node.fight.num} onChange={(e) => updateNode(index, { ...node, fight: { ...node.fight, num: Math.min(99, Math.max(1, Number.parseInt(e.target.value) || 1)) } })} className="w-20 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                  <Button type="button" size="sm" variant="destructive" className="h-8 px-3" onClick={() => onChange(removeItem(items, index))}>??</Button>
                </SortableShell>
              ) : (
                <SortableShell key={`group-${index}`} id={rootId(index)} className="items-start p-3" contentClassName="min-w-0 flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <Input placeholder="?????????" value={node.loopGroup.name} onChange={(e) => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, name: e.target.value } })} className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                    <Button type="button" size="sm" variant="destructive" className="h-8 px-3" onClick={() => onChange(removeItem(items, index))}>?????</Button>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleLoopDragEnd(index, node, event)}>
                    <SortableContext items={node.loopGroup.items.map((_, itemIndex) => loopId(index, itemIndex))} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {node.loopGroup.items.map((item, groupIndex) => (
                          <SortableShell key={`group-item-${groupIndex}`} id={loopId(index, groupIndex)} className="items-center border-dashed bg-white/60 p-2 dark:bg-gray-800/50" contentClassName="flex items-center gap-2">
                            <Input placeholder="????" value={item.level} onChange={(e) => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: node.loopGroup.items.map((current, currentIndex) => currentIndex === groupIndex ? { ...current, level: e.target.value } : current) } })} className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                            <Input type="number" min="1" max="99" value={item.weight} onChange={(e) => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: node.loopGroup.items.map((current, currentIndex) => currentIndex === groupIndex ? { ...current, weight: Math.min(99, Math.max(1, Number.parseInt(e.target.value) || 1)) } : current) } })} className="w-20 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                            <Button type="button" size="sm" variant="outline" className="h-8 px-3" onClick={() => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: removeItem(node.loopGroup.items, groupIndex) } })}>??</Button>
                          </SortableShell>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  <div className="mt-3 flex justify-end"><Button type="button" size="sm" variant="outline" onClick={() => updateNode(index, { ...node, loopGroup: { ...node.loopGroup, items: [...node.loopGroup.items, { level: "", weight: 1 }] } })}>??????</Button></div>
                </SortableShell>
              ),
            )}
          </div>
        </SortableContext>
      </DndContext>
      {items.length === 0 && <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">??????????????????</div>}
    </div>
  )
}
