import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readPublicFile(path: string) {
  return readFileSync(join(process.cwd(), "public", path), "utf8");
}

describe("PWA release assets", () => {
  it("keeps the manifest scoped to the GitHub Pages base path", () => {
    const manifest = JSON.parse(readPublicFile("manifest.webmanifest")) as {
      name: string;
      start_url: string;
      scope: string;
      display: string;
      icons: Array<{ src: string; type: string }>;
    };

    expect(manifest.name).toContain("FinPlan");
    expect(manifest.start_url).toBe("/finplan/en/");
    expect(manifest.scope).toBe("/finplan/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toContainEqual(
      expect.objectContaining({
        src: "/finplan/icon.svg",
        type: "image/svg+xml",
      })
    );
  });

  it("keeps offline caching local to FinPlan and GET requests", () => {
    const worker = readPublicFile("sw.js");
    expect(worker).toContain('const BASE_PATH = "/finplan"');
    expect(worker).toContain('request.method !== "GET"');
    expect(worker).toContain("url.origin !== self.location.origin");
    expect(worker).toContain("networkFirst(request, fallback)");
    expect(worker).toContain("caches.delete(key)");
  });
});
