import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClientInstance } from '@/lib/supabase/server';

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
    .from('travel_plans')
    .select('id, plan_name, plan_data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { plan_name: string; plan_data: unknown } | null;
  if (!body?.plan_name || !body?.plan_data) {
    return NextResponse.json({ error: '缺少参数 plan_name / plan_data' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClientInstance({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => cookieStore.set({ name, value, ...options }),
    remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('travel_plans')
    .insert({ plan_name: body.plan_name, plan_data: body.plan_data, user_id: user.id })
    .select('id, plan_name, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plan: data });
}
