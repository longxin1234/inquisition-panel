"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UserConfigPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/user/dashboard#task-config")
  }, [router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      正在前往首页...
    </div>
  )
}
