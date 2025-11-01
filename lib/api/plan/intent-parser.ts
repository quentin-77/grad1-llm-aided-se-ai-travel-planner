import { addDays, format } from "date-fns";
import { env } from "@/lib/config/env";
import type { TripIntentPayload } from "@/lib/types/plan";
import { getDashScopeClient, getDashScopeModel } from "@/lib/api/plan/dashscope-client";

const THEMES: Array<{ keyword: RegExp; theme: TripIntentPayload["preferences"]["themes"][number] }> = [
  { keyword: /(美食|吃|餐)/, theme: "culinary" },
  { keyword: /(亲子|孩子|儿童|家庭)/, theme: "family" },
  { keyword: /(文化|历史|博物馆|艺术)/, theme: "culture" },
  { keyword: /(自然|户外|海滩|徒步|山)/, theme: "nature" },
  { keyword: /(冒险|刺激|极限)/, theme: "adventure" },
  { keyword: /(放松|度假|休闲|spa)/, theme: "relaxation" },
  { keyword: /(购物|买买买|商场|买东西)/, theme: "shopping" },
  { keyword: /(夜生活|酒吧|夜店|晚宴|演出)/, theme: "nightlife" },
];

const CURRENCY_KEYWORDS: Record<string, string> = {
  CNY: "(元|人民币|块|块钱|万|千)",
  USD: "(美元|美金|USD)",
  JPY: "(日元|JPY)",
  EUR: "(欧元|EUR)",
  HKD: "(港币|港元|HKD)",
};

export async function parseTripIntentFromText(transcript: string) {
  if (!env.DASH_SCOPE_API_KEY) {
    return {
      intent: buildHeuristicIntent(transcript),
      provider: "heuristic" as const,
      message: "未配置 DashScope，已使用规则解析。",
    };
  }

  try {
    const prompt = buildIntentPrompt(transcript);
    const client = getDashScopeClient();
    const completion = await client.chat.completions.create({
      model: getDashScopeModel("qwen-plus"),
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是一名旅行助理，请严格返回 JSON，不要输出多余解释。确保字段完整。",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      throw new Error("DashScope intent parse 返回为空");
    }

    const intent = sanitizeIntentJson(raw, transcript);

    return {
      intent,
      provider: "dashscope" as const,
    };
  } catch (error) {
    console.warn("[parseTripIntentFromText] fallback to heuristic", error);
    return {
      intent: buildHeuristicIntent(transcript),
      provider: "heuristic" as const,
      message: "通义千问解析失败，已使用规则解析。",
    };
  }
}

function buildIntentPrompt(transcript: string) {
  const sanitized = transcript.replace(/"/g, '\\"');
  return `请将以下中文旅行需求解析为 JSON，字段需全部填写：
输入: "${sanitized}"
输出格式：
{
  "destination": string,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "budget": number,
  "currency": "CNY" | "USD" | "JPY" | "EUR" | "HKD",
  "travelers": { "adults": number, "children": number, "seniors": number },
  "preferences": { "themes": string[] },
  "notes": string
}

若原文未提供日期，请选择距离今天 14 天后的日期作为开始，行程天数由用户描述确定，若未说明则取 5 天。
预算若出现“万元”等描述，请换算为具体数字。`;
}

function sanitizeIntentJson(raw: string, transcript: string): TripIntentPayload {
  const normalized = extractJsonContent(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch (error) {
    console.warn("[sanitizeIntentJson] parse failed", normalized, error);
    return buildHeuristicIntent(transcript);
  }

  if (typeof parsed !== "object" || parsed === null) {
    return buildHeuristicIntent(transcript);
  }

  const data = parsed as Record<string, unknown>;
  const budgetData =
    typeof data.budget === "object" && data.budget !== null
      ? (data.budget as Record<string, unknown>)
      : {};
  const travelersData =
    typeof data.travelers === "object" && data.travelers !== null
      ? (data.travelers as Record<string, unknown>)
      : {};
  const preferencesData =
    typeof data.preferences === "object" && data.preferences !== null
      ? (data.preferences as Record<string, unknown>)
      : {};

  const startDate = normalizeDateString(data.startDate);
  const endDate = normalizeDateString(data.endDate);

  return {
    destination: String(data.destination ?? fallbackDestination(transcript)),
    startDate,
    endDate,
    budget: Number(budgetData.total ?? data.budget ?? fallbackBudget(transcript)),
    currency: coerceCurrency(String(data.currency ?? budgetData.currency ?? "CNY")),
    travelers: {
      adults: Number(travelersData.adults ?? fallbackAdults(transcript)),
      children: Number(travelersData.children ?? fallbackChildren(transcript)),
      seniors: Number(travelersData.seniors ?? fallbackSeniors(transcript)),
    },
    preferences: {
      themes: Array.isArray(preferencesData.themes)
        ? (preferencesData.themes as TripIntentPayload["preferences"]["themes"])
        : fallbackThemes(transcript),
    },
    notes: String(data.notes ?? transcript).slice(0, 280),
  };
}

function buildHeuristicIntent(transcript: string): TripIntentPayload {
  const startDate = format(addDays(new Date(), 14), "yyyy-MM-dd");
  const duration = fallbackDuration(transcript);
  const endDate = format(addDays(new Date(startDate), duration - 1), "yyyy-MM-dd");

  return {
    destination: fallbackDestination(transcript),
    startDate,
    endDate,
    budget: fallbackBudget(transcript),
    currency: fallbackCurrency(transcript),
    travelers: {
      adults: fallbackAdults(transcript),
      children: fallbackChildren(transcript),
      seniors: fallbackSeniors(transcript),
    },
    preferences: {
      themes: fallbackThemes(transcript),
    },
    notes: transcript.slice(0, 280),
  };
}

function fallbackDestination(transcript: string) {
  const match = transcript.match(/去([\u4e00-\u9fa5A-Za-z\s]+)/);
  if (match?.[1]) {
    return match[1].replace(/(玩|旅游|旅行|看看|吧)$/u, "").trim() || "自由行";
  }
  return "自由行目的地";
}

function fallbackDuration(transcript: string) {
  const match = transcript.match(/(\d{1,2})\s*(天|日)/);
  if (match?.[1]) {
    return Math.max(2, Number(match[1]));
  }
  return 5;
}

function normalizeDateString(value: unknown) {
  if (typeof value === "string" && value) {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  return format(addDays(new Date(), 14), "yyyy-MM-dd");
}

function fallbackBudget(transcript: string) {
  const match = transcript.match(/(\d+(?:\.\d+)?)\s*(万|千|元|块|块钱|人民币|美金|美元|日元|欧元|港币)/);
  if (!match) {
    return 10000;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  if (/万/.test(unit)) return amount * 10_000;
  if (/千/.test(unit)) return amount * 1_000;
  return amount;
}

function fallbackCurrency(transcript: string) {
  for (const [currency, pattern] of Object.entries(CURRENCY_KEYWORDS)) {
    if (new RegExp(pattern, "i").test(transcript)) {
      return currency;
    }
  }
  return "CNY";
}

function fallbackAdults(transcript: string) {
  if (/一个人|单人|独自/.test(transcript)) {
    return 1;
  }
  const match = transcript.match(/(\d+)\s*(位|个)?(成人|大人|成年人)/);
  if (match?.[1]) {
    return Math.max(1, Number(match[1]));
  }
  if (/情侣|夫妻/.test(transcript)) {
    return 2;
  }
  return 2;
}

function fallbackChildren(transcript: string) {
  const match = transcript.match(/(\d+)\s*(位|个)?(孩子|儿童|小孩|宝宝|小朋友)/);
  if (match?.[1]) {
    return Number(match[1]);
  }
  return /孩子|儿童|小孩|宝宝/.test(transcript) ? 1 : 0;
}

function fallbackSeniors(transcript: string) {
  const match = transcript.match(/(\d+)\s*(位|个)?(老人|长辈|老年|父母)/);
  if (match?.[1]) {
    return Number(match[1]);
  }
  return /老人|长辈|父母/.test(transcript) ? 2 : 0;
}

function fallbackThemes(transcript: string): TripIntentPayload["preferences"]["themes"] {
  const themes = THEMES.filter(({ keyword }) => keyword.test(transcript)).map(
    ({ theme }) => theme
  ) as TripIntentPayload["preferences"]["themes"];
  const defaultThemes: TripIntentPayload["preferences"]["themes"] = [
    "culture",
    "culinary",
  ];
  return themes.length ? themes : defaultThemes;
}

function coerceCurrency(raw: string) {
  const upper = raw.toUpperCase();
  switch (upper) {
    case "CNY":
    case "USD":
    case "JPY":
    case "EUR":
    case "HKD":
      return upper;
    default:
      return fallbackCurrency(raw);
  }
}

function extractJsonContent(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("```") && trimmed.includes("{")) {
    const withoutFence = trimmed
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```$/, "");
    return withoutFence;
  }
  return trimmed;
}
