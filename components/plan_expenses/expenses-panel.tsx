'use client';

import { useCallback, useEffect, useState } from 'react';

type Expense = { id: string; title: string; amount: number; currency: string; created_at: string };

export function ExpensesPanel({ planId }: { planId: string }) {
  const validId = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(planId ?? '');
  const [items, setItems] = useState<Expense[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!validId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses?plan_id=${encodeURIComponent(planId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { expenses: Expense[] };
      setItems(data.expenses);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [planId, validId]);

  useEffect(() => { void load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!validId || !title || !Number.isFinite(amt)) return;
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, title, amount: amt }),
    });
    if (!res.ok) {
      alert('保存失败');
      return;
    }
    setTitle('');
    setAmount('');
    await load();
  };

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-500">事项</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-48 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="如：午餐"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">金额</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-32 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="100"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
        >记一笔</button>
      </form>

      {loading ? (
        <p className="text-sm text-neutral-500">加载中…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length ? (
        <ul className="divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
          {items.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-neutral-500">{new Date(e.created_at).toLocaleString()}</p>
              </div>
              <div className="font-mono">{e.amount} {e.currency}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">暂无记录</p>
      )}
    </div>
  );
}
