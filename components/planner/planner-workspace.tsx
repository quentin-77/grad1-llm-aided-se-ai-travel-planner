'use client';

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { TripIntentForm } from "@/components/forms/trip-intent-form";
import { PlanPreview } from "@/components/plan/plan-preview";
import { VoiceInput } from "@/components/speech/voice-input";
import type { TripIntentFormValues } from "@/components/forms/trip-intent-form";
import type { TripIntentPayload } from "@/lib/types/plan";
import type { TripPlanResponse, TripIntentParseResponse } from "@/lib/types/api";
// 文件链接方式调用阿里云 FileTrans，无需本地转码

export function PlannerWorkspace() {
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [isSpeechProcessing, setIsSpeechProcessing] = useState(false);
  const [planProvider, setPlanProvider] = useState<TripPlanResponse["provider"]>();
  const [formSeed, setFormSeed] = useState<TripIntentFormValues | undefined>(undefined);
  const [intentProvider, setIntentProvider] = useState<TripIntentParseResponse["provider"]>();
  const [intentMessage, setIntentMessage] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const planMutation = useMutation({
    mutationFn: async (payload: TripIntentPayload) => {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ intent: payload }),
      });

      if (!response.ok) {
        let details = "行程规划失败";
        try {
          const errorPayload = await response.json();
          details = errorPayload.error ?? details;
        } catch {
          const text = await response.text();
          if (text) details = text;
        }
        throw new Error(details);
      }

      return (await response.json()) as TripPlanResponse;
    },
    onSuccess: (data) => {
      setPlanProvider(data.provider);
    },
  });

  const parseIntentMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const response = await fetch("/api/plan/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        let message = "解析语音内容失败";
        try {
          const payload = await response.json();
          message = payload.error ?? message;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      return (await response.json()) as TripIntentParseResponse;
    },
    onSuccess: (data) => {
      setIntentProvider(data.provider);
      setIntentMessage(data.message ?? (data.provider === "dashscope" ? "已使用通义千问解析语音内容。" : "已根据规则解析语音内容。"));
      const seed = convertIntentToFormValues(data.intent);
      setFormSeed(seed);
      setVoiceTranscript((prev) => prev ?? data.intent.notes ?? null);
    },
  });

  const handleSubmit = async (payload: TripIntentPayload) => {
    setPlanError(null);
    setPlanProvider(undefined);
    setFormSeed(convertIntentToFormValues(payload));
    try {
      await planMutation.mutateAsync(payload);
    } catch (error) {
      console.error("[PlannerWorkspace] 行程生成异常", error);
      setPlanError(
        error instanceof Error
          ? error.message
          : "行程生成失败，请稍后再试或检查 API Key。"
      );
    }
  };

  const planData = planMutation.data?.plan;

  const handleAudioData = async (_blob: Blob) => {
    setIsSpeechProcessing(true);
    try {
      const fileLink = window.prompt("Web Speech 不可用，输入可访问的音频URL以使用阿里云识别：", "https://...");
      if (!fileLink) {
        setVoiceTranscript("已取消上传，未提供音频链接。");
        return;
      }

      const response = await fetch("/api/speech/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileLink }),
      });

      if (!response.ok) {
        throw new Error("语音识别失败");
      }

      const data = (await response.json()) as {
        transcript: string;
        provider?: string;
      };
      setVoiceTranscript(data.transcript);
      setIntentMessage(null);
    } catch (error) {
      console.error("[PlannerWorkspace] 语音识别异常", error);
      setVoiceTranscript("阿里云识别暂不可用，请稍后再试。依然可以使用文字表单提交。");
    } finally {
      setIsSpeechProcessing(false);
    }
  };

  const insights = useMemo(() => {
    if (!planData) return [];
    return [
      `预算：≈ ${planData.budget.total.toLocaleString()} ${planData.budget.currency}`,
      `行程天数：${planData.durationDays} 天，${planData.itinerary.length} 个日程节点`,
      `亮点：${planData.highlights.slice(0, 3).join(" / ") || "待确认"}`,
    ];
  }, [planData]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <div className="space-y-6 xl:col-span-3">
        <VoiceInput
          isProcessing={planMutation.isPending || isSpeechProcessing}
          transcript={voiceTranscript ?? undefined}
          onTranscript={(text) => {
            setVoiceTranscript(text);
            setIntentMessage(null);
            setIntentProvider(undefined);
          }}
          onListeningChange={(active) => setIsSpeechProcessing(active)}
          onAudioData={handleAudioData}
        />
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                语音解析
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                将语音或长文本转化为可编辑的行程需求表单。
              </p>
            </div>
            <button
              type="button"
              disabled={!voiceTranscript || parseIntentMutation.isPending}
              onClick={() => {
                if (!voiceTranscript) return;
                setIntentMessage(null);
                setIntentProvider(undefined);
                parseIntentMutation.mutate(voiceTranscript);
              }}
              className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {parseIntentMutation.isPending ? "解析中…" : "解析并填充表单"}
            </button>
          </div>
          {intentMessage ? (
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              {intentMessage}
              {intentProvider ? `（来源：${intentProvider === "dashscope" ? "通义千问" : "规则解析"}）` : ""}
            </p>
          ) : null}
          {parseIntentMutation.isError ? (
            <p className="mt-3 text-xs text-red-500">
              {parseIntentMutation.error instanceof Error
                ? parseIntentMutation.error.message
                : "语音解析失败，请稍后再试。"}
            </p>
          ) : null}
        </div>
        <TripIntentForm
          onSubmit={handleSubmit}
          isSubmitting={planMutation.isPending}
          defaultValues={formSeed}
        />
      </div>

      <div className="space-y-4 xl:col-span-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            语音识别结果
          </h3>
          <p className="mt-2 min-h-[120px] rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
            {voiceTranscript
              ? voiceTranscript
              : isSpeechProcessing
                ? "正在识别语音…"
                : "语音识别结果将展示在这里，后续可自动填充表单。"}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            行程要点
          </h3>
          {insights.length ? (
            <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              {insights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              提交旅行需求后，将生成行程摘要、预算与推荐亮点。
            </p>
          )}
          {planProvider ? (
            <p className="mt-3 text-xs text-neutral-400">
              数据来源：{planProvider === "dashscope" ? "通义千问（DashScope）" : "示例占位"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="xl:col-span-5">
        {planError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {planError}
          </div>
        ) : (
          <PlanPreview plan={planData ?? undefined} />
        )}
      </div>
    </div>
  );
}

function convertIntentToFormValues(intent: TripIntentPayload): TripIntentFormValues {
  return {
    destination: intent.destination,
    startDate: intent.startDate,
    endDate: intent.endDate,
    budget: intent.budget,
    currency: intent.currency,
    adults: intent.travelers.adults,
    children: intent.travelers.children,
    seniors: intent.travelers.seniors ?? 0,
    travelThemes: intent.preferences.themes,
    notes: intent.notes ?? "",
  };
}
