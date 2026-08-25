import { useMemo } from "react";
import { useLocale } from "next-intl";
import { formatCurrency, formatPercent } from "@/lib/finance/format";

interface LocaleConfig {
  tag: string;
  currency: string;
}

const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  en: { tag: "en-US", currency: "USD" },
  th: { tag: "th-TH", currency: "THB" },
};

const FALLBACK = LOCALE_CONFIGS.en;

export function localeTagOf(locale: string): string {
  return LOCALE_CONFIGS[locale]?.tag ?? locale;
}

export function currencyOf(localeTag: string): string {
  return Object.values(LOCALE_CONFIGS).find(
    (config) => config.tag === localeTag
  )?.currency ?? FALLBACK.currency;
}

export function formatMoney(
  amount: number,
  localeTag: string
): string {
  return formatCurrency(amount, {
    locale: localeTag,
    currency: currencyOf(localeTag),
    maximumFractionDigits: Math.abs(amount) >= 1000 ? 0 : 2,
  });
}

export function formatRate(
  rate: number,
  localeTag: string
): string {
  return formatPercent(rate, {
    locale: localeTag,
    maximumFractionDigits: 2,
  });
}

export function useMoney() {
  const locale = useLocale();

  return useMemo(() => {
    const config = LOCALE_CONFIGS[locale] ?? FALLBACK;
    return {
      currency: (amount: number) =>
        formatCurrency(amount, {
          locale: config.tag,
          currency: config.currency,
          maximumFractionDigits: Math.abs(amount) >= 1000 ? 0 : 2,
        }),
      rate: (r: number) =>
        formatPercent(r, {
          locale: config.tag,
          maximumFractionDigits: 2,
        }),
    };
  }, [locale]);
}
