export const EXPORT_APP_ID = "finplan";

export interface ExportEnvelope<TData> {
  app: string;
  tool: string;
  schemaVersion: number;
  exportedAt: string;
  data: TData;
}

export function createExportEnvelope<TData>(
  tool: string,
  schemaVersion: number,
  data: TData,
  now: Date = new Date()
): ExportEnvelope<TData> {
  if (typeof tool !== "string" || tool.length === 0) {
    throw new RangeError("tool must be a non-empty string");
  }
  if (!Number.isInteger(schemaVersion) || schemaVersion <= 0) {
    throw new RangeError(
      `schemaVersion must be a positive integer, got ${schemaVersion}`
    );
  }
  return {
    app: EXPORT_APP_ID,
    tool,
    schemaVersion,
    exportedAt: now.toISOString(),
    data,
  };
}

export function parseJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}

export function readExportEnvelope<TData>(
  value: unknown,
  expectedTool?: string
): ExportEnvelope<TData> {
  if (typeof value !== "object" || value === null) {
    throw new TypeError("not a FinPlan export: expected a JSON object");
  }
  const envelope = value as Record<string, unknown>;
  if (envelope.app !== EXPORT_APP_ID) {
    throw new TypeError(
      `not a FinPlan export: expected app "${EXPORT_APP_ID}"`
    );
  }
  if (typeof envelope.tool !== "string" || envelope.tool.length === 0) {
    throw new TypeError("FinPlan export is missing a valid tool name");
  }
  if (
    typeof envelope.schemaVersion !== "number" ||
    !Number.isInteger(envelope.schemaVersion) ||
    envelope.schemaVersion <= 0
  ) {
    throw new TypeError("FinPlan export is missing a valid schemaVersion");
  }
  if (expectedTool !== undefined && envelope.tool !== expectedTool) {
    throw new TypeError(
      `export is for tool "${envelope.tool}", expected "${expectedTool}"`
    );
  }
  if (typeof envelope.exportedAt !== "string") {
    throw new TypeError("FinPlan export is missing an exportedAt timestamp");
  }
  return envelope as unknown as ExportEnvelope<TData>;
}

export function downloadJson(filename: string, value: unknown): void {
  if (typeof window === "undefined") {
    throw new Error("downloadJson can only run in the browser");
  }
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
