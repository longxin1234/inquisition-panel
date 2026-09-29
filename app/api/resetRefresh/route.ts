import { type NextRequest, NextResponse } from "next/server";
import { apiRequestWithAuth } from "@/lib/api-config";

/**
 * 重置用户刷新次数的接口
 */
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return NextResponse.json(
        { code: 401, msg: "未授权", data: null },
        { status: 401 }
      );
    }
    const token = authorization.replace("Bearer ", "");
    const body = await request.json();
    const result = await apiRequestWithAuth("/resetRefresh", token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: "服务器错误", data: null },
      { status: 500 }
    );
  }
}
