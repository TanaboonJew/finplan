const LOCALE_TAGS: Record<string, string> = {
  en: "en-US",
  th: "th-TH",
};

export function localeTagOf(locale: string): string {
  return LOCALE_TAGS[locale] ?? "en-US";
}

export function formatMoney(
  amount: number,
  localeTag: string,
  currency: string
): string {
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactMoney(
  amount: number,
  localeTag: string,
  currency: string
): string {
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function monthLabel(month: string, localeTag: string): string {
  const [yearStr, monStr] = month.split("-");
  const date = new Date(Number(yearStr), Number(monStr) - 1, 1);
  return new Intl.DateTimeFormat(localeTag, {
    month: "short",
    year: "numeric",
  }).format(date);
}
