import { getDemoApiResponse, isDemoToken } from "@/lib/demo-mode";

// EdgeOne currently times out on the dynamic /backend-api catch-all function.
// Route endpoints that already have a concrete server handler through /api;
// leave the remaining legacy endpoints on the catch-all until they are migrated.
const CONCRETE_PROXY_ENDPOINTS = new Set([
  "addAccount",
  "adminLogin",
  "changeAdminPassword",
  "delAccount",
  "forceHalt",
  "forceLoadAllTask",
  "forceUnlockOneTask",
  "forceUnlockTaskList",
  "getDashboardOverview",
  "getProUserInfo",
  "getRecentlyExpiredUsers",
  "getStatistics",
  "getSubUserList",
  "proUserLogin",
  "resetAccountDynamicInfo",
  "resetRefresh",
  "searchAccount",
  "showAccount",
  "showCoolDownTaskList",
  "showFreeTaskList",
  "showLockTaskList",
  "showMyAccount",
  "showMySan",
  "showMyStatus",
  "startAccountByAdmin",
  "startNow",
  "tempInsertTask",
  "tempRemoveTask",
  "updateAccount",
  "updateProUserStatus",
  "userLogin",
]);

export function getApiBaseUrl(endpoint?: string): string {
  if (typeof window !== "undefined") {
    const endpointPath = (endpoint || "")
      .split("?", 1)[0]
      .replace(/^\/+/, "");

    // Concrete API handlers avoid the EdgeOne dynamic-function timeout while
    // preserving the same-origin boundary and keeping the backend URL private.
    return CONCRETE_PROXY_ENDPOINTS.has(endpointPath) ? "/api" : "/backend-api";
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
 * 保留 HTTP 状态，方便页面把认证失效和普通服务故障区分开。
 * 网关超时在带认证请求上通常意味着当前会话无法被后端验证，不能把供应商的
 * HTML 504 页面直接暴露给用户。
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly requiresLogin: boolean;

  constructor(message: string, status: number, requiresLogin = false) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.requiresLogin = requiresLogin;
  }
}

function hasAuthorizationHeader(options?: RequestInit): boolean {
  if (!options?.headers) return false;
  if (options.headers instanceof Headers) return options.headers.has("Authorization");
  if (Array.isArray(options.headers)) {
    return options.headers.some(([name]) => name.toLowerCase() === "authorization");
  }
  return Object.keys(options.headers).some((name) => name.toLowerCase() === "authorization");
}

function sessionFailureMessage(status: number): string {
  return status === 401 || status === 403
    ? "登录已过期或未授权，请重新登录"
    : "登录已过期或登录状态无法验证，请重新登录";
}

export function isSessionFailureError(error: unknown): boolean {
  return error instanceof ApiRequestError
    ? error.requiresLogin
    : error instanceof Error && /登录已过期|未授权|登录状态无法验证|HTTP 401|HTTP 403|HTTP 502|HTTP 504/.test(error.message);
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
  const baseUrl = getApiBaseUrl(endpoint);
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;
  const authenticatedRequest = hasAuthorizationHeader(options);
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      clearStoredAuth();
      throw new ApiRequestError(sessionFailureMessage(response.status), response.status, true);
    }

    if (authenticatedRequest && (response.status === 502 || response.status === 504)) {
      clearStoredAuth();
      throw new ApiRequestError(sessionFailureMessage(response.status), response.status, true);
    }

    const text = await response.text();
    let data: any = null;
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) {
          throw new ApiRequestError(
            authenticatedRequest && (response.status === 502 || response.status === 504)
              ? sessionFailureMessage(response.status)
              : `服务响应异常 (HTTP ${response.status})`,
            response.status,
            authenticatedRequest && (response.status === 502 || response.status === 504),
          );
        }
        throw new Error("服务响应格式错误，无法解析为 JSON");
      }
    } else {
      data = { code: response.ok ? 200 : response.status, msg: response.statusText, data: null };
    }

    if (!response.ok) {
      const responseCode = Number(data?.code);
      if (responseCode === 401 || responseCode === 403) {
        clearStoredAuth();
        throw new ApiRequestError(sessionFailureMessage(responseCode), responseCode, true);
      }
      throw new ApiRequestError(data?.msg || `HTTP error! status: ${response.status}`, response.status);
    }
    return data;
  } catch (error: any) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
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
