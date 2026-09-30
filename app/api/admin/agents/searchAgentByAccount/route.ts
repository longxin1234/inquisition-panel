import { NextResponse } from "next/server";

const mockAgents = Array.from({ length: 50 }).map((_, i) => ({
  id: 20000 + i,
  name: `代理用户${i + 1}`,
  account: `agent${String(i + 1).padStart(2, "0")}`,
  status: i % 3 === 0 ? "禁用" : "活跃",
  creationTime: `2024-01-01T10:${String(i).padStart(2, "0")}:00`,
  lastLogin: `2025-07-21T${String(10 + i).padStart(2, "0")}:00:00`,
  balance: Number.parseFloat((Math.random() * 1000).toFixed(2)),
  subUsersCount: Math.floor(Math.random() * 50),
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const current = Number.parseInt(searchParams.get("current") || "1");
  const size = Number.parseInt(searchParams.get("size") || "10");
  const account = searchParams.get("account") || "";
  const filteredAgents = account
    ? mockAgents.filter((agent) => agent.account.includes(account))
    : mockAgents;

  const startIndex = (current - 1) * size;
  const endIndex = startIndex + size;
  const records = filteredAgents.slice(startIndex, endIndex);

  const total = filteredAgents.length;
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
