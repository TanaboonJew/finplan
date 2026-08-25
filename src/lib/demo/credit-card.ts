import type {
  CreditCardInput,
  SpendCategory,
} from "@/lib/finance/credit-card";
import type { CreditCardToolPersisted, SpendProfile } from "@/lib/storage/credit-card-store";

const DEMO_CARDS: CreditCardInput[] = [
  {
    id: "demo-cc-flat",
    name: "Flat 1.5% Cashback",
    network: "Visa",
    annualFee: 0,
    foreignFee: 0.03,
    apr: 0.1999,
    rewardType: "cashback",
    rewardRates: [{ categoryId: "all", rate: 0.015 }],
    signupBonus: 0,
    pointValue: 1,
    notes: "No-frills flat-rate card",
  },
  {
    id: "demo-cc-category",
    name: "3% Dining & Groceries",
    network: "Mastercard",
    annualFee: 95,
    foreignFee: 0,
    apr: 0.2199,
    rewardType: "cashback",
    rewardRates: [
      { categoryId: "groceries", rate: 0.03 },
      { categoryId: "dining", rate: 0.03 },
      { categoryId: "all", rate: 0.01 },
    ],
    signupBonus: 200,
    pointValue: 1,
    notes: "Best for food-focused spenders",
  },
  {
    id: "demo-cc-travel",
    name: "Travel Rewards Elite",
    network: "Amex",
    annualFee: 250,
    foreignFee: 0,
    apr: 0.2299,
    rewardType: "points",
    rewardRates: [
      { categoryId: "travel", rate: 0.03 },
      { categoryId: "dining", rate: 0.02 },
      { categoryId: "all", rate: 0.01 },
    ],
    signupBonus: 500,
    pointValue: 1.25,
    notes: "Premium travel card — points redeemable for flights",
  },
  {
    id: "demo-cc-gas",
    name: "Gas & Transit Plus",
    network: "Visa",
    annualFee: 0,
    foreignFee: 0.025,
    apr: 0.1899,
    rewardType: "cashback",
    rewardRates: [
      { categoryId: "gas", rate: 0.04 },
      { categoryId: "transit", rate: 0.02 },
      { categoryId: "all", rate: 0.005 },
    ],
    signupBonus: 50,
    pointValue: 1,
    notes: "Great for commuters",
  },
];

function makeCategory(
  id: string,
  name: string,
  annualSpend: number
): SpendCategory {
  return { id, name, annualSpend };
}

const DEMO_PROFILE_CATEGORIES: SpendCategory[] = [
  makeCategory("groceries", "Groceries", 6000),
  makeCategory("dining", "Dining out", 3600),
  makeCategory("travel", "Travel", 2400),
  makeCategory("gas", "Gas & fuel", 1800),
  makeCategory("online", "Online shopping", 3000),
  makeCategory("other", "Everything else", 4800),
];

const DEMO_PROFILES: SpendProfile[] = [
  {
    name: "Typical household",
    categories: DEMO_PROFILE_CATEGORIES,
  },
];

export function createCreditCardDemoState(): CreditCardToolPersisted {
  return {
    cards: DEMO_CARDS.map((card) => ({ ...card })),
    profiles: DEMO_PROFILES.map((profile) => ({
      name: profile.name,
      categories: profile.categories.map((cat) => ({ ...cat })),
    })),
    activeProfileIndex: 0,
  };
}
