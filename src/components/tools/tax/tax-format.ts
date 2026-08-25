const LOCALE_TAGS: Record<string, string> = {
  en: "en-US",
  th: "th-TH",
};

export function localeTagOf(locale: string): string {
  return LOCALE_TAGS[locale] ?? locale;
}

export function formatMoney(
  amount: number,
  localeTag: string,
  currency: string
): string {
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency,
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  }).format(amount);
}

export function formatPercent(fraction: number): string {
  const percent = Number((fraction * 100).toFixed(2));
  return `${percent}%`;
}
