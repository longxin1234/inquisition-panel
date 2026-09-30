import { type NextRequest, NextResponse } from "next/server";
import { apiRequestWithAuth } from "@/lib/api-config";

/**
 * 获取进行中任务列表的接口
 */
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return NextResponse.json(
        { code: 401, msg: "未授权", data: null },
        { status: 401 }
      );
    }
    const token = authorization.replace("Bearer ", "");
    const result = await apiRequestWithAuth("/showLockTaskList", token, {
      method: "GET",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: "服务器错误", data: null },
      { status: 500 }
    );
  }
}
