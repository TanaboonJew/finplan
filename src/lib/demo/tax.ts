import type { TaxSnapshot } from "@/lib/storage/tax-store";
import {
  getCountryPreset,
  type CountryPreset,
  type FilingStatus,
} from "@/lib/finance/tax-presets";

export function createTaxDemoSnapshot(
  country: CountryPreset = "th",
  filingStatus: FilingStatus = "single"
): TaxSnapshot {
  const preset = getCountryPreset(country, filingStatus);

  if (country === "th") {
    return {
      country: "th",
      filingStatus: "single",
      grossIncome: 600_000,
      deductions: preset.deductions.map((d) => ({
        id: d.id,
        name: d.nameKey,
        amount: d.amount,
        enabled: true,
      })),
    };
  }

  return {
    country: "us",
    filingStatus,
    grossIncome: 95_000,
    deductions: preset.deductions.map((d) => ({
      id: d.id,
      name: d.nameKey,
      amount: d.amount,
      enabled: true,
    })),
  };
}
