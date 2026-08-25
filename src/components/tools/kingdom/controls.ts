import { useMemo } from "react";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/finance/format";

interface LocaleConfig {
  tag: string;
  currency: string;
}

const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  en: { tag: "en-US", currency: "USD" },
  th: { tag: "th-TH", currency: "THB" },
};

const FALLBACK = LOCALE_CONFIGS.en;

export function useMoney() {
  const locale = useLocale();

  return useMemo(() => {
    const config = LOCALE_CONFIGS[locale] ?? FALLBACK;
    return {
      currency: (amount: number) =>
        formatCurrency(amount, {
          locale: config.tag,
          currency: config.currency,
        }),
    };
  }, [locale]);
}

export const FIELD_LABEL_CLASS =
  "text-sm font-medium text-muted-foreground";

export const FIELD_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors " +
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tabular-nums";
