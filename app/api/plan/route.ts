import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return NextResponse.json(
    {
      message: "行程规划 API 待实现",
      received: body,
      hint: "后续将调用 DashScope 通义千问模型，生成结构化行程与预算。",
    },
    { status: 501 }
  );
}
