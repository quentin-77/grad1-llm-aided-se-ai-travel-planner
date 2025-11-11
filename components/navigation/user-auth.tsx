'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function UserAuth() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  if (loading) return null;

  if (!email) {
    return (
      <div className="flex items-center gap-2">
        {isSupabaseConfigured() ? (
          <a href="/login" className="text-sm text-neutral-600 underline dark:text-neutral-300">登录</a>
        ) : (
          <span className="text-xs text-neutral-400">账户系统未配置</span>
        )}
        <span className="text-neutral-300">/</span>
        {isSupabaseConfigured() ? (
          <a href="/signup" className="text-sm text-neutral-600 underline dark:text-neutral-300">注册</a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-600 dark:text-neutral-400">{email}</span>
      <button
        type="button"
        onClick={logout}
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
      >
        登出
      </button>
    </div>
  );
}
