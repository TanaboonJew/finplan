import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createExportEnvelope,
  downloadJson,
  parseJson,
  readExportEnvelope,
} from "@/lib/storage/json";

describe("export envelope", () => {
  it("wraps tool data with provenance metadata", () => {
    const now = new Date("2026-08-24T00:00:00.000Z");
    const envelope = createExportEnvelope("debt", 1, { debts: [] }, now);
    expect(envelope).toEqual({
      app: "finplan",
      tool: "debt",
      schemaVersion: 1,
      exportedAt: "2026-08-24T00:00:00.000Z",
      data: { debts: [] },
    });
  });

  it("rejects bad tool names and versions", () => {
    expect(() => createExportEnvelope("", 1, {})).toThrow(RangeError);
    expect(() => createExportEnvelope("debt", 0, {})).toThrow(RangeError);
  });

  it("validates envelopes on import", () => {
    const envelope = createExportEnvelope("jar", 2, { jars: [] });
    expect(readExportEnvelope(envelope)).toEqual(envelope);
    expect(readExportEnvelope(envelope, "jar")).toEqual(envelope);

    expect(() => readExportEnvelope({ app: "other" })).toThrow(TypeError);
    expect(() => readExportEnvelope(null)).toThrow(TypeError);
    expect(() =>
      readExportEnvelope({ ...envelope, tool: undefined })
    ).toThrow(TypeError);
    expect(() =>
      readExportEnvelope({ ...envelope, schemaVersion: "1" })
    ).toThrow(TypeError);
    expect(() => readExportEnvelope(envelope, "budget")).toThrow(
      /expected "budget"/
    );
  });

  it("round-trips through parseJson", () => {
    const envelope = createExportEnvelope("tax", 1, { income: 42 });
    const parsed = parseJson(JSON.stringify(envelope));
    expect(readExportEnvelope(parsed, "tax").data).toEqual({ income: 42 });
    expect(() => parseJson("{not json")).toThrow(SyntaxError);
  });
});

describe("downloadJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a JSON blob and clicks a download link", () => {
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    downloadJson("finplan-debt.json", { hello: 1 });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
