import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";

describe("tool registry", () => {
  it("registers all eighteen planned tools", () => {
    expect(TOOLS).toHaveLength(18);
  });

  it("uses unique slugs and hrefs", () => {
    expect(new Set(TOOLS.map((tool) => tool.slug)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((tool) => tool.href)).size).toBe(TOOLS.length);
  });

  it("points every card at its own route", () => {
    for (const tool of TOOLS) {
      expect(tool.href).toBe(`/${tool.slug}`);
    }
  });

  it("keeps a route and spec for every registered tool", () => {
    for (const tool of TOOLS) {
      const route = join(
        process.cwd(),
        "src",
        "app",
        "[locale]",
        "(tools)",
        tool.slug,
        "page.tsx"
      );
      const spec = join(process.cwd(), "docs", "specs", `${tool.slug}.md`);
      expect(existsSync(route), `missing route for ${tool.slug}`).toBe(true);
      expect(existsSync(spec), `missing spec for ${tool.slug}`).toBe(true);
    }
  });

  it("spreads tools across known categories without gaps", () => {
    const ids = TOOL_CATEGORIES.map((category) => category.id);

    for (const id of ids) {
      expect(TOOLS.some((tool) => tool.category === id)).toBe(true);
    }
    for (const tool of TOOLS) {
      expect(ids).toContain(tool.category);
    }
  });

  it("only allows known badge kinds", () => {
    for (const tool of TOOLS) {
      if (tool.badge) {
        expect(["new", "popular"]).toContain(tool.badge);
      }
    }
  });
});
