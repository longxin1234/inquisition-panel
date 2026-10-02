import { NextResponse } from "next/server"
import {
  getApiErrorHttpStatus,
  getApiErrorMessage,
  getApiResultHttpStatus,
  isApiRequestErrorLike,
} from "@/lib/api-route-core"

export { getApiErrorHttpStatus, getApiResultHttpStatus, isApiRequestErrorLike }

/**
 * The legacy backend sometimes returns an error in JSON while keeping HTTP 200.
 * Keep the JSON envelope for the client, but make the concrete Next route expose
 * the same status so fetch callers can distinguish auth and gateway failures.
 */
export function apiResultResponse<T>(result: T): NextResponse {
  return NextResponse.json(result, { status: getApiResultHttpStatus(result) })
}

export function apiErrorResponse(error: unknown): NextResponse {
  const status = getApiErrorHttpStatus(error)
  return NextResponse.json(
    {
      code: status,
      msg: getApiErrorMessage(error, status),
      data: null,
    },
    { status },
  )
}
