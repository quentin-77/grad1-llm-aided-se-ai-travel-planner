import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function PlanListPage() {
  return (
    <AppShell
      header={
        <PageHeader
          title="我的行程"
          description="行程列表即将上线，可从 Supabase 云端同步历史与共享行程。"
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
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400">
        <p className="text-sm">这里将展示行程列表、收藏及共享功能。</p>
        <p className="mt-2 text-xs">完成核心功能开发后，将接入 Supabase 行程库与实时同步。</p>
      </div>
    </AppShell>
  );
}
