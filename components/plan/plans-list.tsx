'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Plan = { id: string; plan_name: string; created_at: string };

export function PlansList({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/travel-plans', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { plans: Plan[] };
      setPlans(data.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!plans.length) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm('确认删除该行程？')) return;
    const res = await fetch(`/api/travel-plans/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('删除失败');
      return;
    }
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading && !plans.length) {
    return <div className="text-sm text-neutral-500">加载中…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!plans.length) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400">
        <p className="text-sm">暂无已保存行程。</p>
        <a className="mt-2 text-xs underline" href="/planner">去生成一个</a>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {plans.map((plan) => (
        <li key={plan.id} className="flex items-center justify-between py-3">
          <div>
            <Link className="font-medium hover:underline" href={`/plan/${plan.id}`}>{plan.plan_name}</Link>
            <p className="text-xs text-neutral-500">{new Date(plan.created_at).toLocaleString()}</p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(plan.id)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            删除
          </button>
        </li>
      ))}
    </ul>
  );
}

