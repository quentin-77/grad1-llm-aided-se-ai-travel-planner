import { NextResponse } from "next/server";
import { transcribeSpeech } from "@/lib/api/speech/transcribe";

// 暴露给组件的接口
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType?.includes("audio")) {
      return NextResponse.json(
        { error: "请上传音频数据" },
        { status: 400 }
      );
    }

    const language = request.headers.get("x-speech-language") ?? "zh-CN";
    const arrayBuffer = await request.arrayBuffer();

    if (!arrayBuffer.byteLength) {
      return NextResponse.json(
        { error: "音频内容为空" },
        { status: 400 }
      );
    }

    const result = await transcribeSpeech({
      audioBuffer: arrayBuffer,
      mimeType: contentType,
      language,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[/api/speech] unexpected error", error);
    return NextResponse.json(
      { error: "语音识别失败，请稍后再试" },
      { status: 500 }
    );
  }
}
