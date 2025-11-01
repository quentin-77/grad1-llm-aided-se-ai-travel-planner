import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "费用列表 API 待实现",
      hint: "稍后将从 Supabase 数据库读取当前用户的费用记录。",
    },
    { status: 501 }
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return NextResponse.json(
    {
      message: "费用创建 API 待实现",
      received: body,
      hint: "计划结合语音识别与 LLM 分类后写入 Supabase。",
    },
    { status: 501 }
  );
}
