import type { TaxBand } from "./tax";

export type CountryPreset = "th" | "us";

export interface DeductionPreset {
  id: string;
  nameKey: string;
  amount: number;
}

export interface CountryPresetData {
  label: string;
  currency: string;
  bands: TaxBand[];
  deductions: DeductionPreset[];
}

const TH_BANDS: TaxBand[] = [
  { upTo: 150_000, rate: 0 },
  { upTo: 300_000, rate: 0.05 },
  { upTo: 400_000, rate: 0.1 },
  { upTo: 600_000, rate: 0.15 },
  { upTo: 800_000, rate: 0.2 },
  { upTo: 1_200_000, rate: 0.25 },
  { upTo: 2_100_000, rate: 0.3 },
  { upTo: null, rate: 0.35 },
];

const US_BANDS_SINGLE: TaxBand[] = [
  { upTo: 11_600, rate: 0.1 },
  { upTo: 47_150, rate: 0.12 },
  { upTo: 100_525, rate: 0.22 },
  { upTo: 191_950, rate: 0.24 },
  { upTo: 243_725, rate: 0.32 },
  { upTo: 609_350, rate: 0.35 },
  { upTo: null, rate: 0.37 },
];

const US_BANDS_MARRIED: TaxBand[] = [
  { upTo: 23_200, rate: 0.1 },
  { upTo: 94_300, rate: 0.12 },
  { upTo: 201_050, rate: 0.22 },
  { upTo: 383_900, rate: 0.24 },
  { upTo: 487_450, rate: 0.32 },
  { upTo: 731_200, rate: 0.35 },
  { upTo: null, rate: 0.37 },
];

export const TH_PRESET: CountryPresetData = {
  label: "Thailand",
  currency: "THB",
  bands: TH_BANDS,
  deductions: [
    { id: "th-personal", nameKey: "tax.deductions.thPersonal", amount: 60_000 },
    { id: "th-social-security", nameKey: "tax.deductions.thSocialSecurity", amount: 9_000 },
    { id: "th-insurance", nameKey: "tax.deductions.thInsurance", amount: 25_000 },
    { id: "th-retirement", nameKey: "tax.deductions.thRetirement", amount: 50_000 },
    { id: "th-child", nameKey: "tax.deductions.thChild", amount: 30_000 },
  ],
};

function usDeductionBands(status: FilingStatus): TaxBand[] {
  return status === "married" ? US_BANDS_MARRIED : US_BANDS_SINGLE;
}

function usStandardDeduction(status: FilingStatus): number {
  return status === "married" ? 29_200 : 14_600;
}

export type FilingStatus = "single" | "married";

export function getUsBands(status: FilingStatus): TaxBand[] {
  return usDeductionBands(status);
}

export function getUsStandardDeduction(status: FilingStatus): number {
  return usStandardDeduction(status);
}

export function getUsPreset(status: FilingStatus): CountryPresetData {
  return {
    label: "United States",
    currency: "USD",
    bands: usDeductionBands(status),
    deductions: [
      {
        id: "us-standard-deduction",
        nameKey: "tax.deductions.usStandardDeduction",
        amount: usStandardDeduction(status),
      },
    ],
  };
}

export function getCountryPreset(country: CountryPreset, filingStatus: FilingStatus): CountryPresetData {
  if (country === "th") return TH_PRESET;
  return getUsPreset(filingStatus);
}
