import { AppShell } from "@/components/layout/app-shell";
import { PlannerWorkspace } from "@/components/planner/planner-workspace";
import { PageHeader } from "@/components/ui/page-header";

export default function PlannerPage() {
  return (
    <AppShell
      header={
        <PageHeader
          title="智能行程规划"
          description="通过语音或文字描述旅行需求，AI 将生成专属行程与预算建议。"
        />
      }
    >
      <PlannerWorkspace />
    </AppShell>
  );
}
