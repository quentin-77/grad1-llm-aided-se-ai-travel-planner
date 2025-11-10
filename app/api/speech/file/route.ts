import { NextResponse } from "next/server";
import { transcribeAliyunFile } from "@/lib/api/speech/aliyun-filetrans";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type 需为 application/json" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const fileLink = body?.fileLink as string | undefined;
    if (!fileLink) {
      return NextResponse.json({ error: "请提供可访问的音频文件链接 fileLink" }, { status: 400 });
    }

    const text = await transcribeAliyunFile(fileLink);
    return NextResponse.json({ transcript: text, provider: "aliyun" });
  } catch (error) {
    console.error("[/api/speech/file]", error);
    return NextResponse.json({ error: "语音识别失败，请稍后再试" }, { status: 500 });
  }
}

