import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClientInstance } from "@/lib/supabase/server";

// GET /api/expenses?plan_id=xxx
export async function GET(request: NextRequest) {
  const planId = request.nextUrl.searchParams.get('plan_id');
  const hasPlanId = typeof planId === 'string' && planId.length > 0;
  const isUuid = !!planId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(planId);
  if (hasPlanId && !isUuid) return NextResponse.json({ error: '无效的 plan_id' }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClientInstance({
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => cookieStore.set({ name, value, ...options }),
    remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  let query = supabase
    .from('expenses')
    .select('id, title, amount, currency, created_at, plan_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (hasPlanId) {
    query = query.eq('plan_id', planId as string);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data ?? [] });
}

// POST /api/expenses { plan_id, title, amount, currency? }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { plan_id: string; title: string; amount: number; currency?: string } | null;
  const isUuid = !!body?.plan_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(body.plan_id);
  if (!isUuid || !body?.title || typeof body?.amount !== 'number') {
    return NextResponse.json({ error: '缺少必要字段 plan_id/title/amount' }, { status: 400 });
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
    .from('expenses')
    .insert({
      plan_id: body.plan_id,
      title: body.title,
      amount: body.amount,
      currency: body.currency ?? 'CNY',
      user_id: user.id,
    })
    .select('id, title, amount, currency, created_at, plan_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}
