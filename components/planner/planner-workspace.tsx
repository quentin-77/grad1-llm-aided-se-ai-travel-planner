'use client';

import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { TripIntentForm } from "@/components/forms/trip-intent-form";
import { PlanPreview } from "@/components/plan/plan-preview";
import { VoiceInput } from "@/components/speech/voice-input";
import type { TripIntentPayload, TripPlan } from "@/lib/types/plan";

function buildPlaceholderPlan(intent: TripIntentPayload): TripPlan {
  const startDate = new Date(intent.startDate);
  const endDate = new Date(intent.endDate);
  const durationDays = Math.max(
    1,
    differenceInCalendarDays(endDate, startDate) + 1
  );

  const itinerary = Array.from({ length: durationDays }).map((_, index) => {
    const currentDate = addDays(startDate, index);
    const formattedDate = format(currentDate, "yyyy-MM-dd");

    return {
      date: formattedDate,
      summary: `${intent.destination} 第 ${index + 1} 天亮点安排`,
      items: [
        {
          title: "AI 推荐景点",
          description: "待接入大模型后生成详细景点与活动安排。",
          location: { name: "待定" },
          tags: intent.preferences.themes,
        },
        {
          title: "特色餐厅",
          description: "将根据偏好与预算筛选本地人气餐厅。",
          tags: ["美食探索"],
        },
        {
          title: "亲子 / 互动体验",
          description: "根据同行成员自动匹配适合的体验项目。",
          tags: ["体验活动"],
        },
      ],
    };
  });

  const totalBudget = intent.budget || 10_000;
  const budget: TripPlan["budget"] = {
    currency: intent.currency,
    total: totalBudget,
    transportation: Math.round(totalBudget * 0.25),
    lodging: Math.round(totalBudget * 0.3),
    activities: Math.round(totalBudget * 0.2),
    dining: Math.round(totalBudget * 0.2),
    contingency: Math.round(totalBudget * 0.05),
  };

  return {
    id: `placeholder-${Date.now()}`,
    destination: intent.destination,
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
    durationDays,
    travelerProfile: intent.travelers,
    preferences: intent.preferences,
    highlights: [
      "自动生成的行程将在此展示",
      "支持语音输入与预算管理",
      "地图与景点联动即将接入",
    ],
    itinerary,
    budget,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function PlannerWorkspace() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<TripIntentPayload | null>(null);
  const [previewPlan, setPreviewPlan] = useState<TripPlan | null>(null);

  const handleSubmit = async (payload: TripIntentPayload) => {
    setIsGenerating(true);
    setLastRequest(payload);
    setPreviewPlan(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const plan = buildPlaceholderPlan(payload);
    setPreviewPlan(plan);
    setIsGenerating(false);
  };

  const placeholderInsights = useMemo(() => {
    if (!lastRequest) return [];
    return [
      `预算：≈ ${lastRequest.budget.toLocaleString()} ${lastRequest.currency}`,
      `同行：成人 ${lastRequest.travelers.adults} 人，儿童 ${lastRequest.travelers.children} 人`,
      `偏好主题：${lastRequest.preferences.themes.join(" / ") || "待选择"}`,
    ];
  }, [lastRequest]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <div className="space-y-6 xl:col-span-3">
        <VoiceInput
          isProcessing={isGenerating}
          onTranscript={(text) => setVoiceTranscript(text)}
        />
        <TripIntentForm
          onSubmit={handleSubmit}
          isSubmitting={isGenerating}
          defaultValues={
            lastRequest
              ? {
                  destination: lastRequest.destination,
                  startDate: lastRequest.startDate,
                  endDate: lastRequest.endDate,
                  budget: lastRequest.budget,
                  currency: lastRequest.currency,
                  adults: lastRequest.travelers.adults,
                  children: lastRequest.travelers.children,
                  seniors: lastRequest.travelers.seniors ?? 0,
                  travelThemes: lastRequest.preferences.themes,
                  notes: lastRequest.notes,
                }
              : undefined
          }
        />
      </div>

      <div className="space-y-4 xl:col-span-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            语音识别结果
          </h3>
          <p className="mt-2 min-h-[120px] rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
            {voiceTranscript ?? "语音识别结果将展示在这里，后续可自动填充表单。"}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            行程要点
          </h3>
          {placeholderInsights.length ? (
            <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              {placeholderInsights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              提交旅行需求后，将生成行程摘要、预算与推荐亮点。
            </p>
          )}
        </div>
      </div>

      <div className="xl:col-span-5">
        <PlanPreview plan={previewPlan ?? undefined} />
      </div>
    </div>
  );
}
