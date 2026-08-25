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

export function percentToFraction(text: string): number | null {
  if (typeof text !== "string" || text.trim().length === 0) return null;
  const cleaned = text.replace(/[\s,'%\u00A0]/g, "");
  if (cleaned.length === 0) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return parsed / 100;
}

export function fractionToPercentText(fraction: number): string {
  const rounded = Number(fraction * 100).toFixed(6);
  return String(rounded);
}
