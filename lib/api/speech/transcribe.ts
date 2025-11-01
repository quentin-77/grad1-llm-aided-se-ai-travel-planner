import { env } from "@/lib/config/env";

interface TranscribeParams {
  audioBuffer: ArrayBuffer;
  mimeType: string;
  language?: string;
}

interface TranscribeResult {
  transcript: string;
  confidence?: number;
  provider: "aliyun" | "mock";
}

export async function transcribeSpeech({
  audioBuffer,
  mimeType,
  language = "zh-CN",
}: TranscribeParams): Promise<TranscribeResult> {
  const hasAliConfig =
    !!env.ALIBABA_SPEECH_APP_ID &&
    !!env.ALIBABA_SPEECH_ACCESS_KEY_ID &&
    !!env.ALIBABA_SPEECH_ACCESS_KEY_SECRET;

  if (!hasAliConfig) {
    return {
      transcript: `语音已记录（格式：${mimeType || "未知"}，语言：${language}），但尚未配置阿里云语音识别。`,
      provider: "mock",
    };
  }

  try {
    // TODO: 接入阿里云智能语音交互 API
    // 由于环境限制，此处暂返回占位文本，并提示需要在正式部署时实现。
    const durationSeconds = Math.max(1, Math.round(audioBuffer.byteLength / 32_000));
    return {
      transcript: `（示例识别）录音长度约 ${durationSeconds} 秒，语种 ${language}。请在服务端完成阿里云 API 对接。`,
      provider: "aliyun",
    };
  } catch (error) {
    console.error("[transcribeSpeech]", error);
    return {
      transcript: "语音识别暂时不可用，请稍后再试。",
      provider: "mock",
    };
  }
}
