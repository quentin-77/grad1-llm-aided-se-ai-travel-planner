import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  DASH_SCOPE_API_KEY: z.string().optional(),
  DASH_SCOPE_MODEL: z.string().optional(),
  ALIBABA_SPEECH_APP_ID: z.string().optional(),
  ALIBABA_SPEECH_ACCESS_KEY_ID: z.string().optional(),
  ALIBABA_SPEECH_ACCESS_KEY_SECRET: z.string().optional(),
  AMAP_WEB_KEY: z.string().optional(),
  NEXT_PUBLIC_AMAP_WEB_KEY: z.string().optional(),
});

const envResult = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  DASH_SCOPE_API_KEY: process.env.DASH_SCOPE_API_KEY,
  DASH_SCOPE_MODEL: process.env.DASH_SCOPE_MODEL,
  ALIBABA_SPEECH_APP_ID: process.env.ALIBABA_SPEECH_APP_ID,
  ALIBABA_SPEECH_ACCESS_KEY_ID: process.env.ALIBABA_SPEECH_ACCESS_KEY_ID,
  ALIBABA_SPEECH_ACCESS_KEY_SECRET: process.env.ALIBABA_SPEECH_ACCESS_KEY_SECRET,
  AMAP_WEB_KEY: process.env.AMAP_WEB_KEY,
  NEXT_PUBLIC_AMAP_WEB_KEY: process.env.NEXT_PUBLIC_AMAP_WEB_KEY,
});

if (!envResult.success) {
  console.warn(
    "[env] Environment variables validation failed:",
    JSON.stringify(envResult.error.format(), null, 2)
  );
}

export const env = envResult.success
  ? envResult.data
  : ({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      SUPABASE_JWT_SECRET: undefined,
      DASH_SCOPE_API_KEY: undefined,
      DASH_SCOPE_MODEL: undefined,
      ALIBABA_SPEECH_APP_ID: undefined,
      ALIBABA_SPEECH_ACCESS_KEY_ID: undefined,
      ALIBABA_SPEECH_ACCESS_KEY_SECRET: undefined,
      AMAP_WEB_KEY: undefined,
      NEXT_PUBLIC_AMAP_WEB_KEY: undefined,
    } satisfies z.infer<typeof envSchema>);

export type AppEnv = typeof env;
