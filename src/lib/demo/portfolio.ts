import type { PortfolioToolPersisted } from "@/lib/storage/portfolio-store";
import type { Holding } from "@/lib/finance/portfolio";

const DEMO_HOLDINGS: Holding[] = [
  {
    id: "demo-pf-vwra",
    symbol: "VWRA",
    name: "Vanguard FTSE All-World UCIT ETF",
    assetClass: "Equity",
    quantity: 300,
    price: 48.5,
  },
  {
    id: "demo-pf-ttb",
    symbol: "TTB",
    name: "Thai Treasury Bond Fund",
    assetClass: "Bonds",
    quantity: 800,
    price: 11.2,
  },
  {
    id: "demo-pf-cash",
    symbol: "MMF",
    name: "Money market fund",
    assetClass: "Cash",
    quantity: 3000,
    price: 1.0,
  },
  {
    id: "demo-pf-gold",
    symbol: "GOLD-ETF",
    name: "Physical gold ETF",
    assetClass: "Gold",
    quantity: 25,
    price: 62.0,
  },
  {
    id: "demo-pf-thai",
    symbol: "SET50",
    name: "Thai blue-chip ETF",
    assetClass: "Equity",
    quantity: 500,
    price: 8.4,
  },
  {
    id: "demo-pf-crypto",
    symbol: "BTC",
    name: "Bitcoin spot ETF",
    assetClass: "Crypto",
    quantity: 0.5,
    price: 61000,
  },
];

const DEMO_TARGETS: Record<string, number> = {
  Equity: 0.5,
  Bonds: 0.25,
  Cash: 0.1,
  Gold: 0.1,
  Crypto: 0.05,
};

export function createPortfolioDemoState(): PortfolioToolPersisted {
  return {
    holdings: DEMO_HOLDINGS.map((h) => ({ ...h })),
    targets: { ...DEMO_TARGETS },
  };
}
