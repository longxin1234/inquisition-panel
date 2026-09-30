const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:2100/api"

export type ApiResponse<T> = { code: number; msg: string; data: T }

export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => null) as ApiResponse<T> | null
  if (!response.ok || !body || (body.code !== 0 && body.code !== 200)) {
    throw new Error(body?.msg || `请求失败（${response.status}）`)
  }
  return body.data
}

export function saveToken(token: string) {
  localStorage.setItem("endfield_token", token)
}

export function getToken() {
  return typeof window === "undefined" ? null : localStorage.getItem("endfield_token")
}

export function clearToken() {
  localStorage.removeItem("endfield_token")
}

