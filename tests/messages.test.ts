import { describe, expect, it } from "vitest";
import { TOOL_CATEGORIES, TOOLS } from "@/lib/tools";
import en from "@/messages/en.json";
import th from "@/messages/th.json";

type Json = Record<string, unknown>;

function flattenKeys(value: Json, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === "object" && child !== null && !Array.isArray(child)
      ? flattenKeys(child as Json, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );
}

describe("messages", () => {
  it("keeps every locale in sync with the English keys", () => {
    const enKeys = flattenKeys(en);
    const thKeys = flattenKeys(th);

    expect(new Set(thKeys)).toEqual(new Set(enKeys));
  });

  it("defines copy for every tool and category", () => {
    const enKeys = flattenKeys(en);
    const thKeys = flattenKeys(th);

    const requiredKeys = [
      ...TOOL_CATEGORIES.flatMap((category) => [category.nameKey, category.blurbKey]),
      ...TOOLS.flatMap((tool) => [tool.titleKey, tool.descriptionKey]),
      "hub.heroTitle",
      "hub.heroSubtitle",
      "hub.heroBrowse",
      "hub.heroFeatured",
      "hub.cta",
      "toolPage.comingSoon",
      "toolPage.back",
    ];

    for (const key of requiredKeys) {
      expect(enKeys).toContain(key);
      expect(thKeys).toContain(key);
    }
  });
});
