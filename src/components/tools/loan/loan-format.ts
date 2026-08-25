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

export function formatApr(fraction: number): string {
  const percent = Number((fraction * 100).toFixed(4));
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

function parseYearMonth(month: string): [number, number] {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  return [year, monthIndex];
}

export function addMonthsToMonth(
  startMonth: string,
  monthsToAdd: number
): string {
  const [year, monthIndex] = parseYearMonth(startMonth);
  const total = year * 12 + monthIndex + Math.max(0, Math.floor(monthsToAdd));
  const resultYear = Math.floor(total / 12);
  const resultMonth = (total % 12) + 1;
  return `${resultYear}-${`${resultMonth}`.padStart(2, "0")}`;
}

export function formatMonthYear(month: string, localeTag: string): string {
  const [year, monthIndex] = parseYearMonth(month);
  return new Intl.DateTimeFormat(localeTag, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}
