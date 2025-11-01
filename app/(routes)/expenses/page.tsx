import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function ExpensesPage() {
  return (
    <AppShell
      header={
        <PageHeader
          title="费用管理"
          description="后续将支持语音记录开销、预算对比与仪表盘分析。"
        />
      }
    >
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400">
        <p className="text-sm">费用录入与预算控制模块正在筹备中。</p>
        <p className="mt-2 text-xs">
          我们会将语音识别、LLM 费用分类与 Supabase 实时同步整合到此页面。
        </p>
      </div>
    </AppShell>
  );
}
