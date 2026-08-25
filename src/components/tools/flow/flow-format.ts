import { formatCurrency } from "@/lib/finance/format";

export function formatMonth(monthStr: string): string {
  const [yearStr, monthStr2] = monthStr.split("-");
  const monthIndex = Number(monthStr2) - 1;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[monthIndex]} ${yearStr}`;
}

export function formatMoney(
  value: number,
  currency: string,
  locale: string
): string {
  return formatCurrency(value, { currency, locale });
}

export function addMonthsToMonth(monthStr: string, delta: number): string {
  const [yearStr, monStr] = monthStr.split("-");
  let year = Number(yearStr);
  let month = Number(monStr) - 1 + delta;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month >= 12) {
    month -= 12;
    year += 1;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
