interface NavigationItem {
  title: string;
  description: string;
  href: string;
  icon: NavigationIcon;
}

export type NavigationIcon = "calendarRange" | "map" | "piggyBank" | "settings";

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  {
    title: "智能规划",
    description: "从灵感到落地，AI定制您的专属旅行方案",
    href: "/planner",
    icon: "calendarRange",
  },
  {
    title: "我的行程",
    description: "统一管理已存行程，多设备云端同步",
    href: "/plan",
    icon: "map",
  },
  {
    title: "费用管理",
    description: "实时追踪旅行花费，告别超支焦虑",
    href: "/expenses",
    icon: "piggyBank",
  },
  {
    title: "设置中心",
    description: "配置个人偏好，打造您的专属 AI",
    href: "/settings",
    icon: "settings",
  },
];

export type { NavigationItem };
