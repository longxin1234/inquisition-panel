import { type NextRequest, NextResponse } from "next/server";
import { apiRequestWithAuth } from "@/lib/api-config";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return NextResponse.json(
        { code: 401, msg: "未授权", data: null },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const current = searchParams.get("current") || "1";
    const size = searchParams.get("size") || "10";
    const taskType = searchParams.get("taskType") || "";
    const freeze = searchParams.get("freeze") || "";
    const expired = searchParams.get("expired") || "";
    const deleted = searchParams.get("deleted") || "";
    const login = searchParams.get("login") || "";

    let queryParams = `current=${current}&size=${size}`;
    if (taskType) queryParams += `&taskType=${taskType}`;
    if (freeze) queryParams += `&freeze=${freeze}`;
    if (expired) queryParams += `&expired=${expired}`;
    if (deleted) queryParams += `&deleted=${deleted}`;
    if (login === "missing") queryParams += "&login=missing";

    const token = authorization.replace("Bearer ", "");
    const result = await apiRequestWithAuth(
      `/showAccount?${queryParams}`,
      token,
      {
        method: "GET",
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: "服务器错误", data: null },
      { status: 500 }
    );
  }
}
