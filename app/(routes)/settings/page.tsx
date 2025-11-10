import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PreferencesForm } from "@/components/settings/preferences-form";

export default function SettingsPage() {
  return (
    <AppShell
      header={
        <PageHeader
          title="系统设置"
          description="配置语音识别、地图、AI Key 与旅行偏好，便于后续快速生成行程。"
        />
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            接口密钥
          </h3>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            在这里将支持填写 DashScope、阿里云语音、高德地图等密钥，密钥仅保存在浏览器
            local storage 与安全后端，不会写入代码仓库。
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            个性化偏好
          </h3>
          <PreferencesForm />
        </div>
      </div>
    </AppShell>
  );
}
