"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-5 w-5" /></div>
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">页面遇到意外错误</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">当前输入和后台任务不会因为这个页面错误自动改变。可以先重试，问题持续时再返回工作台。</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />重新加载页面</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>返回工作台</Button>
        </div>
      </div>
    </main>
  )
}
