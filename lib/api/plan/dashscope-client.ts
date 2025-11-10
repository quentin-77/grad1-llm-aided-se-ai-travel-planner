import OpenAI from "openai";
import { env } from "@/lib/config/env";

let client: OpenAI | null = null;

export function getDashScopeClient() {
  if (!env.DASH_SCOPE_API_KEY) {
    throw new Error("缺少 DashScope API Key，请在环境变量中配置 DASH_SCOPE_API_KEY。");
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.DASH_SCOPE_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      // baseURL: "http://35.220.164.252:3888/v1",
    });
  }

  return client;
}

export function getDashScopeModel(defaultModel = "qwen-plus") {
  return env.DASH_SCOPE_MODEL || defaultModel;
}
