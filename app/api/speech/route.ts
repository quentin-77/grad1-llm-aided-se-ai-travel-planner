import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("audio")) {
    return NextResponse.json(
      { message: "请上传音频数据" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      message: "语音识别 API 待实现",
      hint: "后续将转发音频至阿里云智能语音交互服务进行实时识别。",
    },
    { status: 501 }
  );
}
