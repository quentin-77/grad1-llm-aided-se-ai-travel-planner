import { NextResponse } from "next/server";
import { parseTripIntentFromText } from "@/lib/api/plan/intent-parser";
import type { TripIntentParseRequest, TripIntentParseResponse } from "@/lib/types/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TripIntentParseRequest;
    if (!body?.transcript || body.transcript.trim().length < 4) {
      return NextResponse.json({ error: "请输入足够的语音或文字内容" }, { status: 400 });
    }

    const result = await parseTripIntentFromText(body.transcript.trim());

    const response: TripIntentParseResponse = {
      intent: result.intent,
      provider: result.provider,
      message: result.message,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[/api/plan/intent] unexpected error", error);
    return NextResponse.json(
      { error: "解析语音内容失败，请稍后重试" },
      { status: 500 }
    );
  }
}
