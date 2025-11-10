import { env } from "@/lib/config/env";

interface AliyunAsrOptions {
  audioBuffer: ArrayBuffer;
  format: "pcm" | "wav";
  language?: string;
  sampleRate?: number;
  timeoutMs?: number;
}

interface AliyunAsrResult {
  text: string;
  confidence?: number;
  raw: unknown;
}

const DEFAULT_TIMEOUT = 20_000;

export async function transcribeWithAliyun({
  audioBuffer,
  format,
  language = "zh-CN",
  sampleRate = 16000,
  timeoutMs,
}: AliyunAsrOptions): Promise<AliyunAsrResult> {
  const appId = env.ALIBABA_SPEECH_APP_ID;
  const token = env.ALIBABA_SPEECH_ACCESS_TOKEN;
  const region = env.ALIBABA_SPEECH_REGION ?? "cn-shanghai";

  if (!appId || !token) {
    throw new Error("缺少阿里云语音识别配置，请设置 ALIBABA_SPEECH_APP_ID 与 ALIBABA_SPEECH_ACCESS_TOKEN。");
  }

  const endpoint = `https://nls-gateway-${region}.aliyuncs.com/stream/v1/asr`;
  const params = new URLSearchParams({
    appkey: appId,
    token,
    format,
    sample_rate: String(sampleRate),
    enable_intermediate_result: "false",
    enable_punctuation_prediction: "true",
    enable_inverse_text_normalization: "true",
  });

  if (language) {
    params.set("language", language);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: audioBuffer,
      signal: controller.signal,
    });

    const payload = await response.json().catch(async () => ({
      message: await response.text(),
    }));

    if (!response.ok) {
      throw new Error(`阿里云语音识别失败: ${response.status} ${JSON.stringify(payload)}`);
    }

    const text = typeof payload.result === "string" ? payload.result : "";

    if (!text) {
      throw new Error(`阿里云返回空文本: ${JSON.stringify(payload)}`);
    }

    return {
      text,
      confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
      raw: payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}
