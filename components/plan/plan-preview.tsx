import type { TripPlan } from "@/lib/types/plan";
import { CalendarDays, MapPin, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";

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

  return (
    <div className="space-y-4">
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
              {plan.itinerary.length} 个核心地点
            </span>
            <span className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              预算 {plan.budget.total} {plan.budget.currency}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          {plan.highlights.join(" / ")}
        </p>
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
              {day.items.slice(0, 3).map((item) => (
                <li key={item.title}>
                  <span className="font-medium">{item.title}</span>
                  {item.location?.name ? (
                    <span className="ml-1 text-neutral-500">
                      · {item.location.name}
                    </span>
                  ) : null}
                </li>
              ))}
              {day.items.length > 3 ? (
                <li className="text-xs text-neutral-400">…还有更多精彩安排</li>
              ) : null}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
