import { type NextRequest } from "next/server"
import { apiRequest } from "@/lib/api-config"
import { apiErrorResponse, apiResultResponse } from "@/lib/api-route"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await apiRequest("/proUserLogin", {
      method: "POST",
      body: JSON.stringify(body),
    })

    return apiResultResponse(result)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
