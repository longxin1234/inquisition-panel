const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export type AuthUserType = "user" | "admin" | "prouser";

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 检查存储的token是否有效
 * @param token 从localStorage获取的token字符串
 * @returns boolean token是否有效
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp !== "number" || payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function getStoredUserType(): AuthUserType | null {
  if (typeof window === "undefined") {
    return null;
  }
  const userType = localStorage.getItem("userType");
  return userType === "user" || userType === "admin" || userType === "prouser" ? userType : null;
}

export function getCookieToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const tokenCookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("token="));

  return tokenCookie ? decodeURIComponent(tokenCookie.slice(6)) : null;
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("userType");
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/**
 * 从localStorage获取token
 * 优先获取"token"，如果不存在则尝试"adminToken"
 * @returns string | null
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("token") || localStorage.getItem("adminToken");
}

/**
 * 通用API请求函数
 * @param endpoint API的路径，例如 "/userLogin"
 * @param options fetch请求的选项
 * @returns Promise<ApiResponse<T>>
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...options?.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error: any) {
    throw new Error(`API请求失败: ${error.message || "未知错误"}`);
  }
}

/**
 * 带有认证头的API请求函数
 * @param endpoint API的路径
 * @param token 认证token
 * @param options fetch请求的选项
 * @returns Promise<ApiResponse<T>>
 */
export async function apiRequestWithAuth<T>(
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
