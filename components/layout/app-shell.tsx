import { PRIMARY_NAVIGATION } from "@/lib/config/navigation";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { UserAuth } from "@/components/navigation/user-auth";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  rightAside?: ReactNode;
}

export function AppShell({ children, header, rightAside }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              AI 规划，超乎所想
            </p>
            <h1 className="text-2xl font-semibold">VOYAGEAI · AI 旅航</h1>
          </div>
          {rightAside ?? <UserAuth />}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 py-8">
        <aside className="w-72 shrink-0">
          <SidebarNav items={PRIMARY_NAVIGATION} />
        </aside>
        <main className="flex-1 space-y-6">
          {header}
          <section className="min-h-[480px] rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
