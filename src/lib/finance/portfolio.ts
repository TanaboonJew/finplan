export interface Holding {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  quantity: number;
  price: number;
}

export interface PortfolioToolPersisted {
  holdings: Holding[];
  targets: Record<string, number>;
}

export interface Allocation {
  assetClass: string;
  value: number;
  weight: number;
}

export const POSITION_WARN = 0.2;
export const CLASS_WARN = 0.6;

export type ConcentrationWarning =
  | { kind: "position"; id: string; symbol: string; weight: number }
  | { kind: "class"; assetClass: string; weight: number };

export interface ClassDrift {
  assetClass: string;
  actual: number;
  target: number;
  delta: number;
}

export function holdingValue(holding: Holding): number {
  return holding.quantity * holding.price;
}

export function totalValue(holdings: readonly Holding[]): number {
  return holdings.reduce((sum, h) => sum + holdingValue(h), 0);
}

function normalizeClass(assetClass: string): string {
  const trimmed = assetClass.trim();
  return trimmed.length > 0 ? trimmed : "Uncategorized";
}

export function allocations(
  holdings: readonly Holding[]
): Allocation[] {
  const byClass = new Map<string, number>();
  for (const h of holdings) {
    const key = normalizeClass(h.assetClass);
    byClass.set(key, (byClass.get(key) ?? 0) + holdingValue(h));
  }
  const total = totalValue(holdings);
  return [...byClass.entries()]
    .map(([assetClass, value]) => ({
      assetClass,
      value,
      weight: total > 0 ? value / total : 0,
    }))
    .sort(
      (a, b) => b.value - a.value || a.assetClass.localeCompare(b.assetClass)
    );
}

export function concentrationWarnings(
  holdings: readonly Holding[]
): ConcentrationWarning[] {
  const total = totalValue(holdings);
  if (total <= 0) return [];

  const warnings: ConcentrationWarning[] = [];
  for (const h of holdings) {
    const weight = holdingValue(h) / total;
    if (weight > POSITION_WARN) {
      warnings.push({
        kind: "position",
        id: h.id,
        symbol: h.symbol,
        weight,
      });
    }
  }
  for (const alloc of allocations(holdings)) {
    if (alloc.weight > CLASS_WARN) {
      warnings.push({
        kind: "class",
        assetClass: alloc.assetClass,
        weight: alloc.weight,
      });
    }
  }
  return warnings;
}

export function driftVsTargets(
  holdings: readonly Holding[],
  targets: Record<string, number>
): ClassDrift[] {
  const rows = new Map<string, ClassDrift>();
  for (const alloc of allocations(holdings)) {
    rows.set(alloc.assetClass, {
      assetClass: alloc.assetClass,
      actual: alloc.weight,
      target: 0,
      delta: alloc.weight,
    });
  }
  const targetKeys = new Set(Object.keys(targets).filter((k) => k.length > 0));
  // Include classes that exist only as targets.
  for (const alloc of allocations(holdings)) {
    targetKeys.delete(alloc.assetClass);
  }
  for (const key of targetKeys) {
    rows.set(key, {
      assetClass: key,
      actual: 0,
      target: 0,
      delta: 0,
    });
  }
  for (const [key, row] of rows) {
    const t = targets[key];
    row.target = typeof t === "number" && Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
    row.delta = row.actual - row.target;
  }
  return [...rows.values()].sort(
    (a, b) =>
      Math.abs(b.delta) - Math.abs(a.delta) ||
      a.assetClass.localeCompare(b.assetClass)
  );
}

export function largestDrift(rows: readonly ClassDrift[]): ClassDrift | null {
  if (rows.length === 0) return null;
  let best = rows[0];
  for (const row of rows) {
    if (Math.abs(row.delta) > Math.abs(best.delta)) best = row;
  }
  return best;
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

interface ParsedRow {
  cells: string[];
  lineNumber: number; // 1-based line within the file
}

function detectDelimiter(text: string): string {
  const counts: Record<string, number> = {
    ",": (text.match(/,/g) ?? []).length,
    ";": (text.match(/;/g) ?? []).length,
    "\t": (text.match(/\t/g) ?? []).length,
  };
  let best = ",";
  let bestCount = counts[","];
  for (const [delim, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = delim;
      bestCount = count;
    }
  }
  return best;
}

function splitDelimited(line: string, delimiter: string): string[] {
  if (!line.includes('"')) {
    return line.split(delimiter).map((c) => c.trim());
  }
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseNumber(raw: string, field: string, lineNumber: number): number {
  const cleaned = raw.replace(/["\s]/g, "");
  const value = Number(cleaned);
  if (cleaned.length === 0 || !Number.isFinite(value)) {
    throw new RangeError(
      `row ${lineNumber}: "${field}" must be a number, got "${raw}"`
    );
  }
  return value;
}

const HEADER_ALIASES: Record<string, HeaderField> = {
  symbol: "symbol",
  ticker: "symbol",
  name: "name",
  assetclass: "assetClass",
  asset_class: "assetClass",
  class: "assetClass",
  quantity: "quantity",
  qty: "quantity",
  shares: "quantity",
  price: "price",
  last: "price",
  lastprice: "price",
  unitprice: "price",
  priceperunit: "price",
};

type HeaderField = "symbol" | "name" | "assetClass" | "quantity" | "price";

function headerField(cell: string): HeaderField | null {
  const key = cell.trim().toLowerCase().replace(/\s+/g, "");
  return HEADER_ALIASES[key] ?? null;
}

function mapHeaderCells(
  cells: readonly string[]
): Record<HeaderField, number> | null {
  const map: Record<HeaderField, number> = {
    symbol: -1,
    name: -1,
    assetClass: -1,
    quantity: -1,
    price: -1,
  };
  cells.forEach((cell, index) => {
    const field = headerField(cell);
    if (field && map[field] === -1) {
      map[field] = index;
    }
  });
  if (map.symbol === -1 || map.quantity === -1 || map.price === -1) {
    return null;
  }
  return map;
}

function toRows(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ParsedRow[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    rows.push({ cells: splitDelimited(line, detectDelimiter(text)), lineNumber: i + 1 });
  }
  return rows;
}

/**
 * CSV-first holdings parser. Accepts `,` `;` or tab delimited text with an
 * optional case-insensitive header row. Headerless input must be strictly
 * `symbol,quantity,price` per row.
 */
export function parseHoldingsCsv(text: string): Holding[] {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new TypeError("CSV input is empty");
  }
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = toRows(clean);
  if (rows.length === 0) {
    throw new TypeError("CSV input is empty");
  }

  const holdings: Holding[] = [];
  const columnMap: Record<HeaderField, number> | null = mapHeaderCells(
    rows[0].cells
  );

  const startIndex = columnMap ? 1 : 0;

  for (let r = startIndex; r < rows.length; r += 1) {
    const row = rows[r];
    let symbol: string;
    let name = "";
    let assetClass = "";
    let quantity: number;
    let price: number;

    if (columnMap) {
      symbol = row.cells[columnMap.symbol] ?? "";
      if (columnMap.name >= 0) name = row.cells[columnMap.name] ?? "";
      if (columnMap.assetClass >= 0) {
        assetClass = row.cells[columnMap.assetClass] ?? "";
      }
      quantity = parseNumber(
        row.cells[columnMap.quantity] ?? "",
        "quantity",
        row.lineNumber
      );
      price = parseNumber(
        row.cells[columnMap.price] ?? "",
        "price",
        row.lineNumber
      );
    } else {
      // Strict positional format: symbol,quantity,price[, ...ignored]
      symbol = row.cells[0] ?? "";
      quantity = parseNumber(row.cells[1] ?? "", "quantity", row.lineNumber);
      price = parseNumber(row.cells[2] ?? "", "price", row.lineNumber);
      if (row.cells[3] !== undefined) {
        assetClass = row.cells[3];
      }
    }

    if (symbol.trim().length === 0) {
      throw new RangeError(`row ${row.lineNumber}: symbol must not be empty`);
    }
    if (quantity < 0) {
      throw new RangeError(`row ${row.lineNumber}: quantity must be >= 0`);
    }
    if (price < 0) {
      throw new RangeError(`row ${row.lineNumber}: price must be >= 0`);
    }

    holdings.push({
      id: crypto.randomUUID(),
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      assetClass: normalizeClass(assetClass),
      quantity,
      price,
    });
  }

  return holdings;
}
