import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  Armchair,
  CalendarClock,
  Castle,
  ChartPie,
  Coins,
  CreditCard,
  FileSpreadsheet,
  Percent,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  ShieldCheck,
  Snowflake,
  SquareKanban,
  TrendingUp,
  Waves,
} from "lucide-react";

export const TOOL_ICONS = {
  alarmClock: AlarmClock,
  armchair: Armchair,
  calendarClock: CalendarClock,
  castle: Castle,
  chartPie: ChartPie,
  coins: Coins,
  creditCard: CreditCard,
  fileSpreadsheet: FileSpreadsheet,
  percent: Percent,
  piggyBank: PiggyBank,
  plane: Plane,
  receipt: Receipt,
  repeat: Repeat,
  shieldCheck: ShieldCheck,
  snowflake: Snowflake,
  squareKanban: SquareKanban,
  trendingUp: TrendingUp,
  waves: Waves,
} satisfies Record<string, LucideIcon>;

export type ToolIconId = keyof typeof TOOL_ICONS;

export type ToolCategoryId =
  | "planning"
  | "budgeting"
  | "debt"
  | "investing"
  | "protection";

export type BadgeKind = "new" | "popular";

export interface ToolCategory {
  id: ToolCategoryId;
  nameKey: string;
  blurbKey: string;
}

export interface ToolMeta {
  slug: string;
  href: string;
  category: ToolCategoryId;
  iconId: ToolIconId;
  titleKey: string;
  descriptionKey: string;
  badge?: BadgeKind;
}

export const TOOL_CATEGORIES: readonly ToolCategory[] = [
  {
    id: "planning",
    nameKey: "categories.planning.name",
    blurbKey: "categories.planning.blurb",
  },
  {
    id: "budgeting",
    nameKey: "categories.budgeting.name",
    blurbKey: "categories.budgeting.blurb",
  },
  {
    id: "debt",
    nameKey: "categories.debt.name",
    blurbKey: "categories.debt.blurb",
  },
  {
    id: "investing",
    nameKey: "categories.investing.name",
    blurbKey: "categories.investing.blurb",
  },
  {
    id: "protection",
    nameKey: "categories.protection.name",
    blurbKey: "categories.protection.blurb",
  },
];

export const TOOLS: readonly ToolMeta[] = [
  {
    slug: "debt",
    href: "/debt",
    category: "debt",
    iconId: "snowflake",
    titleKey: "tools.debt.title",
    descriptionKey: "tools.debt.description",
    badge: "popular",
  },
  {
    slug: "budget",
    href: "/budget",
    category: "budgeting",
    iconId: "piggyBank",
    titleKey: "tools.budget.title",
    descriptionKey: "tools.budget.description",
    badge: "popular",
  },
  {
    slug: "retirement",
    href: "/retirement",
    category: "planning",
    iconId: "armchair",
    titleKey: "tools.retirement.title",
    descriptionKey: "tools.retirement.description",
  },
  {
    slug: "jar",
    href: "/jar",
    category: "budgeting",
    iconId: "coins",
    titleKey: "tools.jar.title",
    descriptionKey: "tools.jar.description",
  },
  {
    slug: "loan",
    href: "/loan",
    category: "debt",
    iconId: "percent",
    titleKey: "tools.loan.title",
    descriptionKey: "tools.loan.description",
  },
  {
    slug: "tax",
    href: "/tax",
    category: "protection",
    iconId: "receipt",
    titleKey: "tools.tax.title",
    descriptionKey: "tools.tax.description",
  },
  {
    slug: "timeline",
    href: "/timeline",
    category: "planning",
    iconId: "calendarClock",
    titleKey: "tools.timeline.title",
    descriptionKey: "tools.timeline.description",
  },
  {
    slug: "pay",
    href: "/pay",
    category: "budgeting",
    iconId: "repeat",
    titleKey: "tools.pay.title",
    descriptionKey: "tools.pay.description",
  },
  {
    slug: "dca",
    href: "/dca",
    category: "investing",
    iconId: "trendingUp",
    titleKey: "tools.dca.title",
    descriptionKey: "tools.dca.description",
  },
  {
    slug: "flow",
    href: "/flow",
    category: "budgeting",
    iconId: "waves",
    titleKey: "tools.flow.title",
    descriptionKey: "tools.flow.description",
  },
  {
    slug: "credit-card",
    href: "/credit-card",
    category: "debt",
    iconId: "creditCard",
    titleKey: "tools.credit-card.title",
    descriptionKey: "tools.credit-card.description",
  },
  {
    slug: "travel-card",
    href: "/travel-card",
    category: "protection",
    iconId: "plane",
    titleKey: "tools.travel-card.title",
    descriptionKey: "tools.travel-card.description",
  },
  {
    slug: "insurance",
    href: "/insurance",
    category: "protection",
    iconId: "shieldCheck",
    titleKey: "tools.insurance.title",
    descriptionKey: "tools.insurance.description",
  },
  {
    slug: "strategy",
    href: "/strategy",
    category: "investing",
    iconId: "squareKanban",
    titleKey: "tools.strategy.title",
    descriptionKey: "tools.strategy.description",
  },
  {
    slug: "kingdom",
    href: "/kingdom",
    category: "budgeting",
    iconId: "castle",
    titleKey: "tools.kingdom.title",
    descriptionKey: "tools.kingdom.description",
  },
  {
    slug: "wake-up",
    href: "/wake-up",
    category: "planning",
    iconId: "alarmClock",
    titleKey: "tools.wake-up.title",
    descriptionKey: "tools.wake-up.description",
    badge: "new",
  },
  {
    slug: "portfolio-analyzer",
    href: "/portfolio-analyzer",
    category: "investing",
    iconId: "chartPie",
    titleKey: "tools.portfolio-analyzer.title",
    descriptionKey: "tools.portfolio-analyzer.description",
    badge: "new",
  },
  {
    slug: "statement",
    href: "/statement",
    category: "protection",
    iconId: "fileSpreadsheet",
    titleKey: "tools.statement.title",
    descriptionKey: "tools.statement.description",
  },
];
