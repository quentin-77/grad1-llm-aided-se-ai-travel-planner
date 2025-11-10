'use client';

import { useEffect, useState } from 'react';

type Prefs = { themes: string[]; default_budget: string | null; currency: string };

const THEME_OPTIONS = ['美食', '动漫', '自然', '文化', '亲子'];
const BUDGETS = ['节省', '中等', '宽松'];

export function PreferencesForm() {
  const [prefs, setPrefs] = useState<Prefs>({ themes: [], default_budget: null, currency: 'CNY' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/preferences', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) setPrefs(data.preferences);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleTheme = (t: string) => {
    setPrefs((p) => ({ ...p, themes: p.themes.includes(t) ? p.themes.filter((x) => x !== t) : [...p.themes, t] }));
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg('已保存偏好');
    } catch {
      setMsg('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-xs text-neutral-500">加载中…</p>;

  return (
    <div>
      <div className="mt-2 space-y-3 text-sm">
        <div>
          <p className="text-xs text-neutral-500">我喜欢的旅行类型</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {THEME_OPTIONS.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => toggleTheme(t)}
                className={`rounded-md border px-2 py-1 text-xs ${prefs.themes.includes(t) ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-neutral-500">默认预算</p>
          <div className="mt-2 flex gap-2">
            {BUDGETS.map((b) => (
              <label key={b} className="flex items-center gap-1 text-xs">
                <input type="radio" name="budget" checked={prefs.default_budget === b} onChange={() => setPrefs((p) => ({ ...p, default_budget: b }))} /> {b}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
        >保存</button>
        {msg ? <span className="text-xs text-neutral-500">{msg}</span> : null}
      </div>
    </div>
  );
}

