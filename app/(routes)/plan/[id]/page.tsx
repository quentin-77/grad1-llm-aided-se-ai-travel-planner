import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PlanPreview } from "@/components/plan/plan-preview";

interface PlanDetailPageProps {
  params: { id: string };
}

export default function PlanDetailPage({ params }: PlanDetailPageProps) {

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
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <p>
            当前页面用于预览行程 `{params.id}`。接下来会对接 Supabase
            数据库与通义千问 API，展示详细日程、地理位置与实时预算。
          </p>
        </div>
        <PlanPreview />
      </div>
    </AppShell>
  );
}
