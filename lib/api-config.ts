import { getDemoApiResponse, isDemoToken } from "@/lib/demo-mode";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // 客户端强制使用同源相对路径代理，严格禁止在浏览器网络请求中暴露后端真实源站域名
    return "/backend-api";
  }
  return (
    process.env.BACKEND_API_INTERNAL_URL ||
    process.env.BACKEND_API_URL ||
    "https://endfield-test-api.102818.xyz/backend-api"
  ).replace(/\/+$/, "");
}

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
    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function getStoredUserType(): AuthUserType | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const userType = window.localStorage?.getItem("userType");
    return userType === "user" || userType === "admin" || userType === "prouser" ? userType : null;
  } catch {
    return null;
  }
}

export function getCookieToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const tokenCookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith("token="));

    return tokenCookie ? decodeURIComponent(tokenCookie.slice(6)) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage?.removeItem("token");
    window.localStorage?.removeItem("adminToken");
    window.localStorage?.removeItem("userType");
  } catch {
    // Storage can be unavailable in embedded browser contexts.
  }
  try {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
    // Cookie access can be blocked independently of localStorage.
  }
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
  try {
    return window.localStorage?.getItem("token") || window.localStorage?.getItem("adminToken");
  } catch {
    return null;
  }
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
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      clearStoredAuth();
      throw new Error("登录已过期或未授权，请重新登录");
    }

    const text = await response.text();
    let data: any = null;
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) {
          throw new Error(`服务响应异常 (HTTP ${response.status})`);
        }
        throw new Error("服务响应格式错误，无法解析为 JSON");
      }
    } else {
      data = { code: response.ok ? 200 : response.status, msg: response.statusText, data: null };
    }

    if (!response.ok) {
      throw new Error(data?.msg || `HTTP error! status: ${response.status}`);
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
  const storedToken = getStoredToken();
  const demoToken = isDemoToken(token) ? token : isDemoToken(storedToken) ? storedToken : null;
  if (demoToken) {
    const demoResponse = getDemoApiResponse(endpoint, demoToken, options);
    if (demoResponse) {
      return Promise.resolve(demoResponse as ApiResponse<T>);
    }
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
