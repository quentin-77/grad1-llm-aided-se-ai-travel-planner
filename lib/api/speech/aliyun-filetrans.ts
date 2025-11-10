import { env } from "@/lib/config/env";

// Aliyun NLS FileTrans SDK has no bundled types; import as any
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FileTransClient = require("@alicloud/nls-filetrans-2018-08-17");

const ENDPOINT = "http://filetrans.cn-shanghai.aliyuncs.com";
const API_VERSION = "2018-08-17";

export async function transcribeAliyunFile(fileLink: string): Promise<string> {
  const accessKeyId = env.ALIBABA_SPEECH_ACCESS_KEY_ID;
  const accessKeySecret = env.ALIBABA_SPEECH_ACCESS_KEY_SECRET;
  const appKey = (env as any).ALIBABA_NLS_APP_KEY as string | undefined;

  if (!accessKeyId || !accessKeySecret || !appKey) {
    throw new Error("缺少阿里云 FileTrans 配置：请设置 ALIBABA_SPEECH_ACCESS_KEY_ID / ALIBABA_SPEECH_ACCESS_KEY_SECRET / ALIBABA_NLS_APP_KEY。");
  }

  const client = new FileTransClient({
    accessKeyId,
    secretAccessKey: accessKeySecret,
    endpoint: ENDPOINT,
    apiVersion: API_VERSION,
  });

  const task = JSON.stringify({
    appkey: appKey,
    file_link: fileLink,
    version: "4.0",
    enable_words: false,
  });

  const submitResp = await client.submitTask({ Task: task }, { method: "POST" });
  if (!submitResp || submitResp.StatusText !== "SUCCESS" || !submitResp.TaskId) {
    throw new Error(`提交识别任务失败: ${JSON.stringify(submitResp)}`);
  }

  const taskId = submitResp.TaskId as string;
  const maxTries = 40; // ~2 minutes if interval=3s
  const intervalMs = 3000;

  for (let i = 0; i < maxTries; i++) {
    const resultResp = await client.getTaskResult({ TaskId: taskId });
    const status = resultResp?.StatusText as string | undefined;
    if (status === "RUNNING" || status === "QUEUEING") {
      await sleep(intervalMs);
      continue;
    }
    if (status === "SUCCESS" || status === "SUCCESS_WITH_NO_VALID_FRAGMENT") {
      const result = resultResp?.Result;
      const text = stringifyAliResult(result);
      return text || "";
    }
    throw new Error(`识别任务失败: ${JSON.stringify(resultResp)}`);
  }

  throw new Error("识别超时，请稍后重试");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stringifyAliResult(result: any): string {
  if (!result) return "";
  // Common shapes: array of sentence fragments, or object with Sentences
  if (Array.isArray(result)) {
    const parts = result
      .map((it) => (typeof it === "string" ? it : it?.Text || it?.text || ""))
      .filter(Boolean);
    return parts.join("");
  }
  if (Array.isArray(result?.Sentences)) {
    const parts = result.Sentences.map((s: any) => s?.Text || s?.text || "").filter(Boolean);
    return parts.join("");
  }
  if (typeof result === "string") return result;
  return JSON.stringify(result);
}

