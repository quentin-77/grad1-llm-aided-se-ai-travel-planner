interface NavigationItem {
  title: string;
  description: string;
  href: string;
  icon: NavigationIcon;
}

export type NavigationIcon = "calendarRange" | "map" | "piggyBank" | "settings";

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  {
    title: "行程规划",
    description: "录入旅行目标与偏好，让 AI 生成专属行程方案",
    href: "/planner",
    icon: "calendarRange",
  },
  {
    title: "我的行程",
    description: "查看并管理已生成的行程，实时同步至地图",
    href: "/plan",
    icon: "map",
  },
  {
    title: "费用管理",
    description: "通过语音或手动方式记录出行费用，监控预算使用情况",
    href: "/expenses",
    icon: "piggyBank",
  },
  {
    title: "设置中心",
    description: "配置语音、地图、AI Key 以及旅行偏好",
    href: "/settings",
    icon: "settings",
  },
];

export type { NavigationItem };
