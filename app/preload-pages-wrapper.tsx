"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useRef } from "react"

export default function PreloadPagesWrapper() {
  const router = useRouter()
  const { isAuthenticated, userType } = useAuth()
  const loadedType = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userType) return
    if (loadedType.current === userType) return
    loadedType.current = userType

    const adminPages = [
      "/admin/dashboard",
      "/admin/devices",
      "/admin/agents",
      "/admin/logs",
      "/admin/scheduled-tasks",
      "/admin/settings",
      "/admin/tasks",
      "/admin/users",
    ]
    const userPages = [
      "/user/dashboard",
    ]
    const prouserPages = [
      "/prouser/dashboard",
      "/prouser/settings",
      "/prouser/cdk",
      "/prouser/subusers",
    ]
    let pages: string[] = []
    if (userType === "admin") pages = adminPages
    if (userType === "user") pages = userPages
    if (userType === "prouser") pages = prouserPages

    pages.forEach((page) => {
      router.prefetch(page)
    })
  }, [isAuthenticated, userType, router])

  return null
}
