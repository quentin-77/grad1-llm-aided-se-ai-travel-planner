import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 受保护路径前缀
const PROTECTED_PREFIXES = ['/planner', '/plan', '/expenses', '/settings'];
const AUTH_PAGES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 创建响应实例以便设置 cookie
  const response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // 未配置 Supabase 时不做拦截
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (key) => request.cookies.get(key)?.value,
      set: (key, value, options) => {
        response.cookies.set({ name: key, value, ...options });
      },
      remove: (key, options) => {
        response.cookies.set({ name: key, value: '', ...options });
      },
    },
  });

  const { data } = await supabase.auth.getSession();
  const isAuthed = !!data.session?.user;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !isAuthed) {
    const url = new URL('/login', request.url);
    const redirectParam = pathname + (search ? search : '');
    url.searchParams.set('redirect', redirectParam);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL('/planner', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/plan|api/plan/intent|api/speech|public).*)'],
};

