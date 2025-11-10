import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { cookies } from "next/headers";
import { createServerClientInstance } from "@/lib/supabase/server";
import { ExpensesManager } from "@/components/expenses/expenses-manager";

export default async function ExpensesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClientInstance({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => cookieStore.set({ name, value, ...options }),
    remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
  });
  const { data: { user } } = await supabase.auth.getUser();
  let plans: Array<{ id: string; plan_name: string }> = [];
  if (user) {
    const { data } = await supabase
      .from("travel_plans")
      .select("id, plan_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    plans = data ?? [];
  }

  return (
    <AppShell
      header={
        <PageHeader
          title="费用管理"
          description="按行程记录与查看费用，支持语音录入。"
        />
      }
    >
      <ExpensesManager initialPlans={plans} />
    </AppShell>
  );
}
