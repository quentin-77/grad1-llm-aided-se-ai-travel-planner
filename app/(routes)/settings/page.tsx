import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PreferencesForm } from "@/components/settings/preferences-form";

export default function SettingsPage() {
  return (
    <AppShell
      header={
        <PageHeader title="系统设置" description="个性化偏好将用于预填表单与生成策略。" />
      }
    >
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">个性化偏好</h3>
        <PreferencesForm />
      </div>
    </AppShell>
  );
}
