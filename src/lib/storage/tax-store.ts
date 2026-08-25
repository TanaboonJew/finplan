import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type CountryPreset,
  type FilingStatus,
  getCountryPreset,
} from "@/lib/finance/tax-presets";

export const TAX_TOOL_ID = "tax";
export const TAX_SCHEMA_VERSION = 1;

export interface TaxDeduction {
  id: string;
  name: string;
  amount: number;
  enabled: boolean;
}

export interface TaxSnapshot {
  country: CountryPreset;
  filingStatus: FilingStatus;
  grossIncome: number;
  deductions: TaxDeduction[];
}

interface TaxStoreState extends TaxSnapshot {
  setCountry: (country: CountryPreset) => void;
  setFilingStatus: (status: FilingStatus) => void;
  setGrossIncome: (amount: number) => void;
  toggleDeduction: (id: string) => void;
  setDeductionAmount: (id: string, amount: number) => void;
  addCustomDeduction: (name: string, amount: number) => string;
  removeCustomDeduction: (id: string) => void;
  replaceState: (snapshot: TaxSnapshot) => void;
  reset: () => void;
}

function presetDeductionsFromCountry(
  country: CountryPreset,
  filingStatus: FilingStatus,
  t: (key: string) => string
): TaxDeduction[] {
  const preset = getCountryPreset(country, filingStatus);
  return preset.deductions.map((d) => ({
    id: d.id,
    name: t(d.nameKey),
    amount: d.amount,
    enabled: true,
  }));
}

const DEFAULT_COUNTRY: CountryPreset = "th";
const DEFAULT_FILING: FilingStatus = "single";
const DEFAULT_GROSS = 0;

function createDefaultDeductions(t: (key: string) => string): TaxDeduction[] {
  return presetDeductionsFromCountry(DEFAULT_COUNTRY, DEFAULT_FILING, t);
}

function createDefaultSnapshot(t: (key: string) => string): TaxSnapshot {
  return {
    country: DEFAULT_COUNTRY,
    filingStatus: DEFAULT_FILING,
    grossIncome: DEFAULT_GROSS,
    deductions: createDefaultDeductions(t),
  };
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `tax-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function clampNonNegative(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function sanitizeDeduction(value: unknown): TaxDeduction | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : null;
  if (name === null) return null;
  return {
    id:
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : createId(),
    name,
    amount: clampNonNegative(record.amount),
    enabled: record.enabled !== false,
  };
}

export function sanitizeTaxSnapshot(value: unknown): TaxSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  const country: CountryPreset =
    record.country === "us" ? "us" : "th";

  const filingStatus: FilingStatus =
    record.filingStatus === "married" ? "married" : "single";

  if (!Array.isArray(record.deductions)) return null;

  const deductions = record.deductions
    .map(sanitizeDeduction)
    .filter((d): d is TaxDeduction => d !== null);

  return {
    country,
    filingStatus,
    grossIncome: clampNonNegative(record.grossIncome),
    deductions,
  };
}

// We use a translation function at store creation time.
// The store holds a reference to it for preset rebuilding.
// In practice, `t` is a next-intl `useTranslations` function passed at init.

let translationFn: (key: string) => string = (key: string) => key;

export function setTranslationFn(fn: (key: string) => string): void {
  translationFn = fn;
}

export const useTaxStore = create<TaxStoreState>()(
  persist(
    (set) => ({
      country: DEFAULT_COUNTRY,
      filingStatus: DEFAULT_FILING,
      grossIncome: DEFAULT_GROSS,
      deductions: createDefaultDeductions(translationFn),

      setCountry: (country) =>
        set((state) => ({
          country,
          deductions: presetDeductionsFromCountry(
            country,
            state.filingStatus,
            translationFn
          ),
        })),

      setFilingStatus: (filingStatus) =>
        set((state) => {
          const newCountry = state.country;
          return {
            filingStatus,
            deductions: presetDeductionsFromCountry(
              newCountry,
              filingStatus,
              translationFn
            ),
          };
        }),

      setGrossIncome: (amount) =>
        set({ grossIncome: clampNonNegative(amount) }),

      toggleDeduction: (id) =>
        set((state) => ({
          deductions: state.deductions.map((d) =>
            d.id === id ? { ...d, enabled: !d.enabled } : d
          ),
        })),

      setDeductionAmount: (id, amount) =>
        set((state) => ({
          deductions: state.deductions.map((d) =>
            d.id === id ? { ...d, amount: clampNonNegative(amount) } : d
          ),
        })),

      addCustomDeduction: (name, amount) => {
        const id = createId();
        set((state) => ({
          deductions: [
            ...state.deductions,
            {
              id,
              name: name.trim(),
              amount: clampNonNegative(amount),
              enabled: true,
            },
          ],
        }));
        return id;
      },

      removeCustomDeduction: (id) =>
        set((state) => ({
          deductions: state.deductions.filter((d) => d.id !== id),
        })),

      replaceState: (snapshot) => set(snapshot),

      reset: () =>
        set({
          country: DEFAULT_COUNTRY,
          filingStatus: DEFAULT_FILING,
          grossIncome: DEFAULT_GROSS,
          deductions: createDefaultDeductions(translationFn),
        }),
    }),
    {
      name: "finplan:tax:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => sanitizeTaxSnapshot(persisted) ?? createDefaultSnapshot(translationFn),
    }
  )
);
