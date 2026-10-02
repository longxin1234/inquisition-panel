import { getDemoApiResponse, isDemoToken } from "./demo-mode.ts";

// EdgeOne currently times out on the dynamic /backend-api catch-all function.
// Route endpoints that already have a concrete server handler through /api;
// leave the remaining legacy endpoints on the catch-all until they are migrated.
const CONCRETE_PROXY_ENDPOINTS = new Set([
  "addAccount",
  "admin/control/logs",
  "admin/control/user-logs",
  "adminLogin",
  "changeAdminPassword",
  "checkCDKByTag",
  "checkCDKByType",
  "createAnnouncement",
  "createCDK",
  "createProUser",
  "createUserByCDK",
  "createUserByPay",
  "delAccount",
  "delLog",
  "forceHalt",
  "freezeMyAccount",
  "forceLoadAllTask",
  "forceUnlockOneTask",
  "forceUnlockTaskList",
  "getAdminNoticeConfig",
  "getAllProUser",
  "getAnnouncement",
  "getDashboardOverview",
  "getProUserInfo",
  "getRecentlyExpiredUsers",
  "getStatistics",
  "getSubUserList",
  "proUserLogin",
  "resetAccountDynamicInfo",
  "resetRefresh",
  "searchAccount",
  "searchLog",
  "sendAdminSummaryNow",
  "setAdminNoticeConfig",
  "showAccount",
  "showCoolDownTaskList",
  "showFreeTaskList",
  "showInventoryDevice",
  "showLoadedDevice",
  "showLockTaskList",
  "showLog",
  "showMyAccount",
  "showMyLog",
  "showMySan",
  "showMyStatus",
  "showScheduledTaskList",
  "startAccountByAdmin",
  "startNow",
  "tempInsertTask",
  "tempRemoveTask",
  "unfreezeMyAccount",
  "updateAccount",
  "updateAccountAndPassword",
  "updateMyAccount",
  "updateProUser",
  "updateProUserStatus",
  "useCDK",
  "userLogin",
]);

export function getApiBaseUrl(endpoint?: string): string {
  if (typeof window !== "undefined") {
    // 路径 A：如果配置了官方 API 二级域名（例如 NEXT_PUBLIC_API_BASE_URL=https://api.axonnest.com），
    // 浏览器端 1:1 对齐原版审判庭架构直连该域名，彻底跳过云函数二次转发与 504 超时，
    // 同时对外展示规范的统一品牌二级域名，对公网完全隐藏后端底层源站和敏感测试域名。
    const publicApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (publicApiUrl && publicApiUrl.trim() !== "") {
      return publicApiUrl.trim().replace(/\/+$/, "");
    }

    const endpointPath = (endpoint || "")
      .split("?", 1)[0]
      .replace(/^\/+/, "");

    // 双轨平滑降级：未显式配置对外 API 域名时，走已建立的独立反代路由保障系统稳定运行
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
  return "登录已过期或未授权，请重新登录";
}

export function isSessionFailureError(error: unknown): boolean {
  return error instanceof ApiRequestError
    ? error.requiresLogin
    : error instanceof Error && /登录已过期|未授权|HTTP 401|HTTP 403/.test(error.message);
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

    if (response.status === 502 || response.status === 504) {
      throw new ApiRequestError("网关超时或上游服务器未响应，请稍后重试", response.status, false);
    }

    const text = await response.text();
    let data: any = null;
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) {
          throw new ApiRequestError(
            response.status === 502 || response.status === 504
              ? "网关超时或上游服务器未响应，请稍后重试"
              : `服务响应异常 (HTTP ${response.status})`,
            response.status,
            false,
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
