import { type NextRequest, NextResponse } from "next/server"
import { apiRequest, ApiRequestError } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await apiRequest("/createUserByCDK", {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(result)
  } catch (error: any) {
    const status = error instanceof ApiRequestError ? error.status : 500
    const msg = error?.message || "服务器错误"
    return NextResponse.json(
      { code: status, msg, data: null },
      { status: status >= 200 && status < 600 ? status : 500 }
    )
  }
}
