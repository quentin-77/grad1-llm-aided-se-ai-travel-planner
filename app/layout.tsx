import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "旅策同行 · AI 智能旅行助理",
  description:
    "通过语音与 AI 智能生成行程、预算与地图，打造一站式的旅行规划体验。",
  keywords: [
    "AI Travel Planner",
    "智能行程规划",
    "语音输入",
    "预算管理",
    "地图导航",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
