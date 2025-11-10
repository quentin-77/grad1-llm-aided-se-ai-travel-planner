import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PlanPreview } from "@/components/plan/plan-preview";
import { cookies } from "next/headers";
import { createServerClientInstance } from "@/lib/supabase/server";
import { ExpensesPanel } from "@/components/plan_expenses/expenses-panel";
import type { TripPlan } from "@/lib/types/plan";
import { notFound } from "next/navigation";

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id ?? "");
  if (!id || id === "undefined" || !isUuid) {
    notFound();
  }

  const cookieStore = await cookies();
  const supabase = createServerClientInstance({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => cookieStore.set({ name, value, ...options }),
    remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
  });
  const { data } = await supabase
    .from("travel_plans")
    .select("id, plan_name, plan_data, created_at")
    .eq("id", id)
    .single();

  return (
    <AppShell
      header={
        <PageHeader
          title="行程详情"
          description="未来将在此展示 AI 生成的完整行程、地图路线与预算跟踪。"
          actions={
            <Link
              href="/planner"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              新建行程
            </Link>
          }
        />
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{data?.plan_name ?? '行程详情'}</h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">创建于：{data?.created_at ? new Date(data.created_at).toLocaleString() : '-'}</p>
        </div>
        <PlanPreview plan={data?.plan_data as TripPlan} />
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">费用管理</h3>
          <ExpensesPanel planId={id} />
        </div>
      </div>
    </AppShell>
  );
}
