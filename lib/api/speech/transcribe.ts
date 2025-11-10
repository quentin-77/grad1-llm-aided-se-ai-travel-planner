import { env } from "@/lib/config/env";
import { transcribeWithAliyun } from "@/lib/api/speech/aliyun-asr";

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

//  语音的底层接口
export async function transcribeSpeech({
  audioBuffer,
  mimeType,
  language = "zh-CN",
}: TranscribeParams): Promise<TranscribeResult> {
  const normalizedLanguage = normalizeLanguage(language);
  const hasAliConfig =
    !!env.ALIBABA_SPEECH_APP_ID &&
    (!!env.ALIBABA_SPEECH_ACCESS_TOKEN ||
      (!!env.ALIBABA_SPEECH_ACCESS_KEY_ID && !!env.ALIBABA_SPEECH_ACCESS_KEY_SECRET));
  
  if (!hasAliConfig) {
    return {
      transcript: `语音已记录（格式：${mimeType || "未知"}，语言：${normalizedLanguage}），但尚未配置任何语音识别服务。`,
      provider: "mock",
    };
  }

  try {
    const audioFormat = inferAudioFormat(mimeType);

    if (!audioFormat) {
      return {
        transcript: `暂不支持的音频格式：${mimeType}。请在前端将录音转换为 16kHz 单声道 WAV/PCM（可参考 README 中的语音录制说明）。`,
        provider: "mock",
      };
    }

    const result = await transcribeWithAliyun({
      audioBuffer,
      format: audioFormat.format,
      language: normalizedLanguage,
      sampleRate: audioFormat.sampleRate,
    });

    return {
      transcript: result.text,
      confidence: result.confidence,
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

function inferAudioFormat(
  mimeType: string
): { format: "pcm" | "wav"; sampleRate: number } | null {
  const lower = mimeType.toLowerCase();
  if (lower.includes("wav")) {
    return { format: "wav", sampleRate: 16000 };
  }
  if (lower.includes("pcm")) {
    return { format: "pcm", sampleRate: 16000 };
  }
  return null;
}

function normalizeLanguage(language?: string): "zh-CN" | "en-US" {
  if (!language) return "zh-CN";
  const lower = language.toLowerCase();
  if (lower.startsWith("en")) {
    return "en-US";
  }
  return "zh-CN";
}
