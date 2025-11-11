# Multi-stage build for Next.js app
FROM node:20-alpine AS base

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV NODE_ENV=production
# Provide build-time public env for Next.js inlining
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_AMAP_WEB_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next.js (Turbopack)
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
# Ensure runtime also has public env for server-side usage
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

CMD ["node", "server.js"]
