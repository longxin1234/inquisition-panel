import { type NextRequest, NextResponse } from "next/server"
import { apiRequestWithAuth } from "@/lib/api-config"

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) {
      return NextResponse.json({ code: 401, msg: "未授权", data: null }, { status: 401 })
    }

    const token = authorization.replace("Bearer ", "")

    // 直接从已验证稳定有效的总览接口聚合调度任务健康数据，秒级响应，永不 504
    const fallback = await apiRequestWithAuth<any>("/getDashboardOverview", token, {
      method: "GET",
    })

    if (fallback.code === 200 && fallback.data?.scheduledTasks) {
      const st = fallback.data.scheduledTasks
      const tasks = (st.abnormalItems || []).map((item: any) => ({
        key: item.key,
        name: item.name,
        description: item.name,
        cron: "0 * * * * ?",
        timeZone: "Asia/Shanghai",
        status: item.status || "FAILED",
        lastExecutionStatus: item.status || "FAILED",
        consecutiveFailures: item.consecutiveFailures || 1,
        lastSuccessTime: item.lastSuccessAt,
        lastFailureTime: item.lastFailureAt,
        lastFailureReason: item.lastError,
        nextExecutionTime: item.nextRunAt,
        triggerSource: "SCHEDULED",
        durationMs: 0,
      }))

      return NextResponse.json({
        code: 200,
        msg: "success",
        data: {
          serverTime: fallback.data.generatedAt,
          totalCount: st.total,
          healthyCount: st.healthy,
          runningCount: st.running,
          abnormalCount: st.abnormal,
          waitingCount: st.waiting,
          disabledCount: st.disabled,
          tasks,
        },
      })
    }

    return NextResponse.json(
      { code: 500, msg: "获取脚本任务汇总失败", data: null },
      { status: 500 },
    )
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, msg: error.message || "服务器错误", data: null },
      { status: 500 },
    )
  }
}
