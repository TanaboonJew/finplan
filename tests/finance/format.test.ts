import { describe, expect, it } from "vitest";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  parseMoneyInput,
} from "@/lib/finance/format";

describe("format", () => {
  it("formats currency with explicit locale and code", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(
      formatCurrency(1234.5, {
        locale: "th-TH",
        currency: "THB",
        maximumFractionDigits: 0,
      })
    ).toBe("฿1,235");
  });

  it("compacts large amounts for chart axes", () => {
    expect(formatCompactCurrency(1234567)).toBe("$1.2M");
    expect(formatCompactCurrency(950)).toBe("$950");
  });

  it("formats decimal fractions as percents", () => {
    expect(formatPercent(0.125)).toBe("12.5%");
    expect(formatPercent(0.055, { maximumFractionDigits: 2 })).toBe("5.5%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("parses typed money input leniently", () => {
    expect(parseMoneyInput("1234.56")).toBe(1234.56);
    expect(parseMoneyInput("1,234.56")).toBe(1234.56);
    expect(parseMoneyInput(" 42 ")).toBe(42);
    expect(parseMoneyInput("-5.5")).toBe(-5.5);
    expect(parseMoneyInput("12.")).toBe(12);
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
    expect(parseMoneyInput("1e3")).toBe(1000);
  });
});
