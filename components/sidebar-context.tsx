"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
})

const STORAGE_KEY = "endfield_sidebar_collapsed"

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState<boolean>(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setCollapsedState(stored === "true")
      }
    } catch {
      // 忽略 localStorage 读取异常
    }
  }, [])

  const setCollapsed = (next: boolean) => {
    setCollapsedState(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // 忽略存储异常
    }
  }

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarState() {
  return useContext(SidebarContext)
}
