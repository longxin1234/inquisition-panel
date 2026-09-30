import Link from "next/link"
import { ArrowLeft, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"><SearchX className="h-5 w-5" /></div>
        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-muted-foreground">404 · PAGE NOT FOUND</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">这个页面不存在或已被移动</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">返回工作台后，可使用顶部搜索快速定位已有页面。</p>
        <Button asChild className="mt-6"><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />返回入口</Link></Button>
      </div>
    </main>
  )
}
