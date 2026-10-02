import { type NextRequest, NextResponse } from "next/server"
import { apiRequestWithAuth } from "@/lib/api-config"

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) {
      return NextResponse.json({ code: 401, msg: "未授权", data: null }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const current = searchParams.get("current") || "1"
    const size = searchParams.get("size") || "10"
    const token = authorization.replace("Bearer ", "")

    const result = await apiRequestWithAuth<any>(
      `/admin/control/user-logs?current=${current}&size=${size}`,
      token,
      { method: "GET" }
    )

    if (result && result.code === 200) {
      return NextResponse.json(result)
    }

    return NextResponse.json(
      result || {
        code: 200,
        msg: "success",
        data: { current: Number(current), page: 0, total: 0, records: [] },
      }
    )
  } catch {
    return NextResponse.json({
      code: 200,
      msg: "success",
      data: {
        current: 1,
        page: 0,
        total: 0,
        records: [],
      },
    })
  }
}
