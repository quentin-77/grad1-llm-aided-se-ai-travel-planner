'use client';

import type { TripPlan } from "@/lib/types/plan";
import { CalendarDays, MapPin, PiggyBank, MapPinned } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BudgetSummary } from "@/components/plan/budget-summary";
import { MapView } from "@/components/plan/map-view";
import { useMemo, useState } from "react";

interface PlanPreviewProps {
  plan?: TripPlan;
}

export function PlanPreview({ plan }: PlanPreviewProps) {
  if (!plan) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
        <p>尚未生成行程。</p>
        <p className="mt-2">提交旅行需求后，这里将展示每日行程亮点、预算概览与地图路线。</p>
      </div>
    );
  }

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {plan.destination} · {plan.durationDays} 天行程
          </h3>
          <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {plan.startDate} - {plan.endDate}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {plan.itinerary.length} 天行程安排
            </span>
            <span className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              预算 {plan.budget.total.toLocaleString()} {plan.budget.currency}
            </span>
          </div>
        </div>
        {plan.highlights.length ? (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
            {plan.highlights.join(" / ")}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <header className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            <PiggyBank className="h-4 w-4" />
            预算分配
          </header>
          <BudgetSummary budget={plan.budget} />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            预算数据来自 AI 估算，可在费用页面按实际开销动态调整。
          </p>
        </Card>

        <Card className="space-y-4">
          <header className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            <MapPinned className="h-4 w-4" />
            地图预览
          </header>
          <MapView plan={plan} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {plan.itinerary.map((day) => (
          <Card key={day.date} className="space-y-3">
            <header>
              <p className="text-xs uppercase tracking-wide text-neutral-400">
                {day.date}
              </p>
              <h4 className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {day.summary}
              </h4>
            </header>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              {(expandedDays.has(day.date) ? day.items : day.items.slice(0, 4)).map((item) => (
                <li key={`${day.date}-${item.title}`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-medium">{item.title}</span>
                    {item.location?.name ? (
                      <span className="ml-1 text-neutral-500">
                        · {item.location.name}
                      </span>
                    ) : null}
                    {item.startTime && item.endTime ? (
                      <span className="ml-1 text-xs text-neutral-400">
                        {item.startTime} - {item.endTime}
                      </span>
                    ) : null}
                  </div>
                  {typeof item.estimatedCost === "number" ? (
                    <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      约 {item.estimatedCost.toLocaleString()} {plan.budget.currency}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {day.items.length > 4 ? (
              <div>
                <button
                  type="button"
                  onClick={() => toggleDay(day.date)}
                  className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {expandedDays.has(day.date) ? "收起" : `展开全部（共 ${day.items.length} 项）`}
                </button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
