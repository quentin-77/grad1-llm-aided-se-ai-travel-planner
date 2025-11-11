import { addDays, differenceInCalendarDays, format } from "date-fns";
import { env } from "@/lib/config/env";
import type { TripIntentPayload, TripPlan } from "@/lib/types/plan";
import { getDashScopeClient, getDashScopeModel } from "@/lib/api/plan/dashscope-client";

export async function generateTripPlanFromIntent(intent: TripIntentPayload) {
  if (!env.DASH_SCOPE_API_KEY) {
    return {
      plan: buildMockPlan(intent),
      provider: "mock" as const,
    };
  }

  try {
    const prompt = buildPrompt(intent);
    const client = getDashScopeClient();
    const completion = await client.chat.completions.create({
      model: getDashScopeModel("qwen-plus"),
      temperature: 0.6,
      top_p: 0.8,
      messages: [
        {
          role: "system",
          content:
            "你是一名经验丰富的中文旅行规划 AI，请用 JSON 结构输出完整旅行方案，字段需与示例一致，不要输出多余解释。",
        },
        { role: "user", content: prompt },
      ],
    });

    const messageContent = completion.choices[0]?.message?.content;
    console.log("[generateTripPlanFromIntent] DashScope response:", messageContent);

    if (!messageContent) {
      throw new Error("DashScope 返回内容为空");
    }

    const plan = sanitizePlanJson(messageContent, intent);

    return {
      plan,
      provider: "dashscope" as const,
    };
  } catch (error) {
    console.warn("[generateTripPlanFromIntent] fallback to mock", error);
    return {
      plan: buildMockPlan(intent),
      provider: "mock" as const,
    };
  }
}

function buildPrompt(intent: TripIntentPayload) {
  const { destination, startDate, endDate, budget, currency, travelers, preferences, notes } =
    intent;

  const themes = preferences.themes.join(", ") || "无特别偏好";

  return `你是一名专业的中文旅行规划 AI 助理。请根据以下信息生成结构化 JSON 行程：

目的地: ${destination}
出发日期: ${startDate}
结束日期: ${endDate}
预算: ${budget} ${currency}
同行人数: 成人 ${travelers.adults} 人，儿童 ${travelers.children} 人，老人 ${travelers.seniors ?? 0} 人
旅行偏好: ${themes}
补充说明: ${notes ?? "无"}

请返回 JSON，字段包含：
{
  "title": string,
  "highlights": string[],
  "budget": { "currency": string, "total": number, "transportation": number, "lodging": number, "activities": number, "dining": number, "contingency": number },
  "itinerary": [
    {
      "date": "YYYY-MM-DD",
      "summary": string,
      "items": [
        { "title": string, "description": string, "startTime": string, "endTime": string, "location": { "name": string, "address": string }, "estimatedCost": number, "tags": string[] }
      ]
    }
  ]
}

确保返回可被 JSON.parse 解析，不要包含额外解释。`;
}

function sanitizePlanJson(raw: string, intent: TripIntentPayload): TripPlan {
  const normalized = extractJsonContent(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized.trim());
  } catch (error) {
    console.warn("[sanitizePlanJson] JSON parse failed", normalized, error);
    return buildMockPlan(intent);
  }

  if (typeof parsed !== "object" || parsed === null) {
    return buildMockPlan(intent);
  }

  const data = parsed as Record<string, unknown>;
  const budgetData = (data.budget ?? {}) as Record<string, unknown>;

  const startDate = intent.startDate;
  const endDate = intent.endDate;
  const durationDays = Math.max(
    1,
    differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1
  );

  return {
    id: `plan-${Date.now()}`,
    destination: intent.destination,
    startDate,
    endDate,
    durationDays,
    travelerProfile: intent.travelers,
    preferences: intent.preferences,
    highlights: Array.isArray(data.highlights)
      ? (data.highlights as string[])
      : [],
    itinerary: Array.isArray(data.itinerary)
      ? (data.itinerary as TripPlan["itinerary"])
      : [],
    budget: {
      currency: (budgetData.currency as string) ?? intent.currency,
      total: Number(budgetData.total ?? intent.budget),
      transportation: Number(budgetData.transportation ?? intent.budget * 0.25),
      lodging: Number(budgetData.lodging ?? intent.budget * 0.3),
      activities: Number(budgetData.activities ?? intent.budget * 0.2),
      dining: Number(budgetData.dining ?? intent.budget * 0.2),
      contingency: Number(budgetData.contingency ?? intent.budget * 0.05),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function buildMockPlan(intent: TripIntentPayload): TripPlan {
  const start = new Date(intent.startDate);
  const end = new Date(intent.endDate);
  const durationDays = Math.max(
    1,
    differenceInCalendarDays(end, start) + 1
  );

  const itinerary = Array.from({ length: durationDays }).map((_, index) => {
    const currentDate = addDays(start, index);
    return {
      date: format(currentDate, "yyyy-MM-dd"),
      summary: `${intent.destination} · 第 ${index + 1} 天亮点行程`,
      items: [
        {
          title: "晨间体验",
          description: "根据兴趣安排轻松的城市探索或主题活动。",
          startTime: "09:00",
          endTime: "11:30",
          location: {
            name: "热门景点",
            address: "地址待确认",
          },
          estimatedCost: Math.round(intent.budget * 0.08),
          tags: intent.preferences.themes,
        },
        {
          title: "特色午餐",
          description: "精选当地餐厅或亲子友好餐食。",
          startTime: "12:00",
          endTime: "13:30",
          location: {
            name: "口碑餐厅",
          },
          estimatedCost: Math.round(intent.budget * 0.05),
          tags: ["dining"],
        },
        {
          title: "下午主题活动",
          description: "结合偏好安排文化体验、户外探索或亲子项目。",
          startTime: "14:30",
          endTime: "17:30",
          location: {
            name: "精选活动场所",
          },
          estimatedCost: Math.round(intent.budget * 0.12),
          tags: ["activities"],
        },
        {
          title: "夜间推荐",
          description: "可选自由活动或预定演出，详见行程建议列表。",
          startTime: "19:00",
          endTime: "21:00",
          location: {
            name: "夜间体验区域",
          },
          estimatedCost: Math.round(intent.budget * 0.07),
          tags: ["nightlife"],
        },
      ],
    };
  });

  const totalBudget = intent.budget || 10_000;

  return {
    id: `mock-${Date.now()}`,
    destination: intent.destination,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    durationDays,
    travelerProfile: intent.travelers,
    preferences: intent.preferences,
    highlights: [
      "精选地标与必打卡路线",
      "本地风味美食与特色体验",
      "节奏均衡的每日安排",
    ],
    itinerary,
    budget: {
      currency: intent.currency,
      total: totalBudget,
      transportation: Math.round(totalBudget * 0.25),
      lodging: Math.round(totalBudget * 0.3),
      activities: Math.round(totalBudget * 0.2),
      dining: Math.round(totalBudget * 0.2),
      contingency: Math.round(totalBudget * 0.05),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
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
