import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoyageAI · AI 旅航",
  description: "AI 规划，超乎所想。Travel That Understands You.",
  keywords: [
    "VoyageAI",
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
