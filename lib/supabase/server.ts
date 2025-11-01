import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env } from "@/lib/config/env";

type CookieHandlers = {
  get?: (name: string) => string | undefined;
  set?: (name: string, value: string, options: CookieOptions) => void;
  remove?: (name: string, options: CookieOptions) => void;
};

export function createServerClientInstance(handlers: CookieHandlers = {}) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("缺少 Supabase 服务端配置，请补充 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY。");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return handlers.get?.(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        handlers.set?.(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        handlers.remove?.(name, options);
      },
    },
  });
}
