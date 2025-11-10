'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { VoiceInput } from '@/components/speech/voice-input';

type Plan = { id: string; plan_name: string };
type Expense = { id: string; title: string; amount: number; currency: string; created_at: string; plan_id: string };

export function ExpensesManager({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans] = useState<Plan[]>(initialPlans);
  const [planId, setPlanId] = useState<string>(plans[0]?.id ?? '');
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isSpeechProcessing, setIsSpeechProcessing] = useState(false);
  const [speechText, setSpeechText] = useState<string>('');

  const planMap = useMemo(() => new Map(plans.map(p => [p.id, p.plan_name])), [plans]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = planId ? `/api/expenses?plan_id=${encodeURIComponent(planId)}` : '/api/expenses';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { expenses: Expense[] };
      setItems(data.expenses);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!planId || !title.trim() || !Number.isFinite(amt)) return;
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, title: title.trim(), amount: amt })
    });
    if (!res.ok) {
      alert('保存失败');
      return;
    }
    setTitle('');
    setAmount('');
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除这条记录？')) return;
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('删除失败');
      return;
    }
    await load();
  };

  const parseSpeech = useCallback((text: string) => {
    // 简易解析：提取第一个数字作为金额，剩余中文/文字作为事项
    // 示例："午餐 68" / "地铁 4 元" / "买水三块"（三块这种不处理）
    const numMatch = text.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (numMatch) {
      const value = numMatch[1];
      const before = text.slice(0, numMatch.index).trim();
      const after = text.slice((numMatch.index ?? 0) + value.length).replace(/元|块|人民币|rmb/gi, '').trim();
      const titleCandidate = (before || after || '未命名').replace(/[，。,.]/g, '').slice(0, 20);
      setTitle(titleCandidate);
      setAmount(value);
    } else {
      // 没识别到金额，只填标题
      setTitle(text.slice(0, 20));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-neutral-500">选择行程</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="mt-1 w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="">全部行程</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.plan_name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="h-9 rounded-md border border-neutral-300 px-3 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >刷新</button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">记一笔</h3>
        <p className="mt-1 text-xs text-neutral-500">支持语音输入，例如“午餐 68 元”、“地铁 3 块”。</p>
        <div className="mt-3">
          <VoiceInput
            isProcessing={isSpeechProcessing}
            transcript={speechText}
            onTranscript={(t) => {
              setSpeechText(t);
              parseSpeech(t);
            }}
            onListeningChange={setIsSpeechProcessing}
          />
        </div>
        <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-neutral-500">事项</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
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
            disabled={!planId}
            className="h-9 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
          >保存</button>
          {!planId ? (
            <span className="text-xs text-neutral-400">请选择具体行程后再保存。</span>
          ) : null}
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">费用列表</h3>
        {loading ? (
          <p className="mt-2 text-sm text-neutral-500">加载中…</p>
        ) : error ? (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        ) : items.length ? (
          <ul className="mt-2 divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            {items.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-xs text-neutral-500">{new Date(e.created_at).toLocaleString()} {planId ? '' : `· ${planMap.get(e.plan_id) ?? ''}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono">{e.amount} {e.currency}</div>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >删除</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">暂无记录</p>
        )}
      </div>
    </div>
  );
}
