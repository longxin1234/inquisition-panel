import { NextResponse } from "next/server";

const mockLogs = Array.from({ length: 100 }).map((_, i) => ({
  id: 10000 + i,
  level: i % 5 === 0 ? "ERROR" : "INFO",
  taskType: ["daily", "rogue", "sand_fire"][i % 3],
  title: i % 2 === 0 ? "任务完成" : "任务失败",
  detail: `[${i % 2 === 0 ? "每日" : "肉鸽"}] [${String(10 + i).padStart(
    2,
    "0"
  )}:${String(i).padStart(2, "0")}] 日志详情 ${i + 1}`,
  imageUrl:
    i % 10 === 0
      ? `/placeholder.svg?height=200&width=300&query=log-screenshot-${i}`
      : "",
  from: `device${String(i).padStart(2, "0")}`,
  server: i % 2,
  name: `用户名称${i + 1}`,
  account: `user${String(i + 1).padStart(2, "0")}`,
  password: null,
  time: `2025-07-21T${String(10 + i).padStart(2, "0")}:${String(i).padStart(
    2,
    "0"
  )}:00`,
  delete: 0,
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const current = Number.parseInt(searchParams.get("current") || "1");
  const size = Number.parseInt(searchParams.get("size") || "10");

  const startIndex = (current - 1) * size;
  const endIndex = startIndex + size;
  const records = mockLogs.slice(startIndex, endIndex);

  const total = mockLogs.length;
  const page = Math.ceil(total / size);

  return NextResponse.json({
    code: 200,
    msg: "查询成功",
    data: {
      current,
      page,
      total,
      records,
    },
  });
}
