import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4" aria-label="正在加载用户列表">
      <div className="flex items-center justify-between"><Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-24" /></div>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}
