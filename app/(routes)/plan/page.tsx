import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { cookies } from "next/headers";
import { createServerClientInstance } from "@/lib/supabase/server";
import { PlansList } from "@/components/plan/plans-list";

export default async function PlanListPage() {
  const cookieStore = await cookies();
  const supabase = createServerClientInstance({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => cookieStore.set({ name, value, ...options }),
    remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
  });
  const { data: { user } } = await supabase.auth.getUser();
  let plans: Array<{ id: string; plan_name: string; created_at: string }> = [];
  if (user) {
    const { data } = await supabase
      .from("travel_plans")
      .select("id, plan_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    plans = data ?? [];
  }

  return (
    <AppShell
      header={
        <PageHeader
          title="我的行程"
          description="管理你保存的旅行计划，支持云端同步。"
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
      <PlansList initialPlans={plans} />
    </AppShell>
  );
}
