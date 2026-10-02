import { type NextRequest, NextResponse } from "next/server";
import { apiRequestWithAuth } from "@/lib/api-config";

export async function GET(request: NextRequest) {
  const defaultData = {
    wxPusherEnable: false,
    wxPusherUid: "",
    pushPlusEnable: false,
    pushPlusToken: "",
    mailEnable: false,
    adminMail: "",
    summarySchedule: "00:00 / 08:00 / 12:00 / 16:00 / 18:00",
  };

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return NextResponse.json({ code: 401, msg: "未授权", data: null }, { status: 401 });
    }

    const token = authorization.replace("Bearer ", "");
    const result = await apiRequestWithAuth<any>("/getAdminNoticeConfig", token, {
      method: "GET",
    });

    if (result && result.code === 200) {
      return NextResponse.json({
        code: 200,
        msg: "获取成功",
        data: {
          ...defaultData,
          ...(result.data || {}),
        },
      });
    }
  } catch {
    // 降级兜底默认数据
  }

  return NextResponse.json({
    code: 200,
    msg: "获取成功",
    data: defaultData,
  });
}
