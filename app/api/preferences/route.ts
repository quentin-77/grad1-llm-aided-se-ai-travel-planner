import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClientInstance } from '@/lib/supabase/server';

// 读取当前用户偏好
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClientInstance({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => cookieStore.set({ name, value, ...options }),
    remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_preferences')
    .select('id, themes, default_budget, currency')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116: Row not found for single() selection
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ preferences: data ?? null });
}

// 更新/保存偏好
export async function PUT(request: NextRequest) {
  const payload = await request.json().catch(() => null) as { themes?: string[]; default_budget?: string; currency?: string } | null;
  if (!payload) return NextResponse.json({ error: '缺少请求体' }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClientInstance({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => cookieStore.set({ name, value, ...options }),
    remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      themes: payload.themes ?? [],
      default_budget: payload.default_budget ?? null,
      currency: payload.currency ?? 'CNY',
    }, { onConflict: 'user_id' })
    .select('id, themes, default_budget, currency')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
