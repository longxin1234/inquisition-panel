"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiRequestWithAuth, clearStoredAuth, getCookieToken, getStoredToken, getStoredUserType, isTokenValid } from "@/lib/api-config"
import { isDemoToken } from "@/lib/demo-mode"

const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

interface AuthContextType {
  token: string | null
  userType: "user" | "admin" | "prouser" | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, type: "user" | "admin" | "prouser") => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [userType, setUserType] = useState<"user" | "admin" | "prouser" | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const savedToken = getStoredToken()
      const savedUserType = getStoredUserType()
      const cookieToken = getCookieToken()

      if (
        savedToken &&
        savedUserType &&
        cookieToken === savedToken &&
        isTokenValid(savedToken)
      ) {
        setToken(savedToken)
        setUserType(savedUserType)
      } else {
        clearStoredAuth()
      }
    } catch {
      setToken(null)
      setUserType(null)
      clearStoredAuth()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = (newToken: string, type: "user" | "admin" | "prouser") => {
    setToken(newToken)
    setUserType(type)
    try {
      window.localStorage?.setItem("token", newToken)
      window.localStorage?.setItem("userType", type)
    } catch {
      // The in-memory auth state still supports the current navigation.
    }
    try {
      document.cookie = "token=" + encodeURIComponent(newToken) + "; path=/; max-age=" + AUTH_COOKIE_MAX_AGE_SECONDS + "; samesite=lax"
    } catch {
      // Middleware is best-effort in embedded local demo contexts.
    }
  }

  const logout = () => {
    if (token && !isDemoToken(token)) void apiRequestWithAuth("/logout", token, { method: "POST" }).catch(() => undefined)
    setToken(null)
    setUserType(null)
    clearStoredAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        userType,
        isAuthenticated: !!token && !!userType,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
