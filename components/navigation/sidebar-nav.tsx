'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationIcon, NavigationItem } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";
import { CalendarRange, Map, PiggyBank, Settings } from "lucide-react";

const ICONS: Record<NavigationIcon, LucideIcon> = {
  calendarRange: CalendarRange,
  map: Map,
  piggyBank: PiggyBank,
  settings: Settings,
};

interface SidebarNavProps {
  items: NavigationItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => {
        const isActive =
          item.href === "/plan"
            ? pathname?.startsWith("/plan")
            : pathname === item.href;

        const Icon = ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg border border-transparent px-3 py-2 transition",
              "hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-900",
              isActive && "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-neutral-500" aria-hidden />
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {item.title}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{item.description}</p>
          </Link>
        );
      })}
    </nav>
  );
}
