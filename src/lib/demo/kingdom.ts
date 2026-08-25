import type {
  Achievement,
  BuildingColor,
  BuildingIcon,
  Deposit,
  KingdomToolPersisted,
} from "@/lib/finance/kingdom";

interface DemoBuilding {
  id: string;
  name: string;
  icon: BuildingIcon;
  targetAmount: number;
  currentAmount: number;
  color: BuildingColor;
  createdAt: string;
}

const DEMO_BUILDINGS: DemoBuilding[] = [
  {
    id: "demo-bld-emergency",
    name: "Emergency Fund",
    icon: "castle",
    targetAmount: 10000,
    currentAmount: 6500,
    color: "emerald",
    createdAt: "2026-01-15",
  },
  {
    id: "demo-bld-vacation",
    name: "Summer Vacation",
    icon: "tower",
    targetAmount: 3000,
    currentAmount: 1800,
    color: "cyan",
    createdAt: "2026-03-01",
  },
  {
    id: "demo-bld-laptop",
    name: "New Laptop",
    icon: "house",
    targetAmount: 2000,
    currentAmount: 2000,
    color: "blue",
    createdAt: "2026-02-10",
  },
  {
    id: "demo-bld-car",
    name: "Car Down Payment",
    icon: "bridge",
    targetAmount: 8000,
    currentAmount: 3200,
    color: "amber",
    createdAt: "2026-04-20",
  },
  {
    id: "demo-bld-wedding",
    name: "Wedding Fund",
    icon: "temple",
    targetAmount: 15000,
    currentAmount: 2500,
    color: "rose",
    createdAt: "2026-05-05",
  },
];

const DEMO_DEPOSITS: Deposit[] = [
  { id: "demo-dep-1", buildingId: "demo-bld-emergency", amount: 2000, date: "2026-02-01", note: "January savings" },
  { id: "demo-dep-2", buildingId: "demo-bld-emergency", amount: 1500, date: "2026-03-01", note: "February savings" },
  { id: "demo-dep-3", buildingId: "demo-bld-emergency", amount: 1500, date: "2026-04-01", note: "March savings" },
  { id: "demo-dep-4", buildingId: "demo-bld-emergency", amount: 1500, date: "2026-05-01", note: "April savings" },
  { id: "demo-dep-5", buildingId: "demo-bld-vacation", amount: 600, date: "2026-04-15", note: "Tax refund" },
  { id: "demo-dep-6", buildingId: "demo-bld-vacation", amount: 600, date: "2026-06-01", note: "Monthly contribution" },
  { id: "demo-dep-7", buildingId: "demo-bld-vacation", amount: 600, date: "2026-07-01", note: "Monthly contribution" },
  { id: "demo-dep-8", buildingId: "demo-bld-laptop", amount: 500, date: "2026-03-01", note: "Starting save" },
  { id: "demo-dep-9", buildingId: "demo-bld-laptop", amount: 500, date: "2026-04-01", note: "Monthly" },
  { id: "demo-dep-10", buildingId: "demo-bld-laptop", amount: 500, date: "2026-05-01", note: "Monthly" },
  { id: "demo-dep-11", buildingId: "demo-bld-laptop", amount: 500, date: "2026-06-01", note: "Final payment" },
  { id: "demo-dep-12", buildingId: "demo-bld-car", amount: 1000, date: "2026-05-01", note: "Starting fund" },
  { id: "demo-dep-13", buildingId: "demo-bld-car", amount: 1100, date: "2026-06-15", note: "Bonus contribution" },
  { id: "demo-dep-14", buildingId: "demo-bld-car", amount: 1100, date: "2026-07-15", note: "Monthly" },
  { id: "demo-dep-15", buildingId: "demo-bld-wedding", amount: 1000, date: "2026-06-01", note: "Initial deposit" },
  { id: "demo-dep-16", buildingId: "demo-bld-wedding", amount: 1500, date: "2026-07-15", note: "Family contribution" },
];

const DEMO_ACHIEVEMENTS: Achievement[] = [
  { id: "first_deposit", unlockedAt: "2026-02-01T00:00:00.000Z" },
  { id: "first_building", unlockedAt: "2026-01-15T00:00:00.000Z" },
  { id: "half_funded", unlockedAt: "2026-05-01T00:00:00.000Z" },
  { id: "first_complete", unlockedAt: "2026-06-01T00:00:00.000Z" },
  { id: "five_buildings", unlockedAt: "2026-05-05T00:00:00.000Z" },
  { id: "thousand_club", unlockedAt: "2026-03-01T00:00:00.000Z" },
  { id: "five_achievements", unlockedAt: "2026-05-05T00:00:00.000Z" },
  { id: "kingdom_complete", unlockedAt: null },
];

export function createKingdomDemoState(): KingdomToolPersisted {
  return {
    kingdomName: "Demo Kingdom",
    buildings: DEMO_BUILDINGS.map((b) => ({ ...b })),
    deposits: DEMO_DEPOSITS.map((d) => ({ ...d })),
    achievements: DEMO_ACHIEVEMENTS.map((a) => ({ ...a })),
  };
}
