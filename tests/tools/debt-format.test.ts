import { describe, expect, it } from "vitest";
import {
  addMonthsToMonth,
  formatApr,
  fractionToPercentText,
  localeTagOf,
  percentToFraction,
} from "@/components/tools/debt/debt-format";

describe("debt-format", () => {
  it("maps known locales to full tags", () => {
    expect(localeTagOf("en")).toBe("en-US");
    expect(localeTagOf("th")).toBe("th-TH");
    expect(localeTagOf("fr")).toBe("fr");
  });

  it("converts month strings across year boundaries", () => {
    expect(addMonthsToMonth("2026-08", 0)).toBe("2026-08");
    expect(addMonthsToMonth("2026-08", 4)).toBe("2026-12");
    expect(addMonthsToMonth("2026-08", 5)).toBe("2027-01");
    expect(addMonthsToMonth("2026-01", -3)).toBe("2026-01");
  });

  it("parses percent text into fractions", () => {
    expect(percentToFraction("18.99")).toBeCloseTo(0.1899);
    expect(percentToFraction(" 1,299 ")).toBeCloseTo(12.99);
    expect(percentToFraction("")).toBeNull();
    expect(percentToFraction("abc")).toBeNull();
  });

  it("renders fractions back as percent text without float noise", () => {
    expect(fractionToPercentText(0.2299)).toBe("22.99");
    expect(fractionToPercentText(0.0525)).toBe("5.25");
  });

  it("formats APR labels", () => {
    expect(formatApr(0.2299)).toBe("22.99%");
    expect(formatApr(0)).toBe("0%");
  });
});
