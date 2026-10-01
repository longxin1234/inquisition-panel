import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDeploymentRecoveryHeaders } from "@/lib/deployment-recovery";

function applyDeploymentRecoveryHeaders(response: NextResponse, request: NextRequest) {
  const headers = getDeploymentRecoveryHeaders(request.nextUrl);
  if (headers) {
    Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
  }
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || request.nextUrl.host;
  if (
    forwardedProto === "http" &&
    !host.includes("localhost") &&
    !host.includes("127.0.0.1")
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/backend-api/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  const protectedRoutes = ["/user", "/admin", "/prouser"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return applyDeploymentRecoveryHeaders(
        NextResponse.redirect(new URL("/", request.url)),
        request,
      );
    }
  }

  return applyDeploymentRecoveryHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/api/:path*", "/backend-api/:path*", "/user/:path*", "/admin/:path*", "/prouser/:path*"],
};
