export const UNCATEGORIZED = "uncategorized";

export interface StatementTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
}

export interface StatementToolPersisted {
  transactions: StatementTransaction[];
  rules: CategoryRule[];
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Normalizes YYYY-MM-DD / YYYY/MM/DD / DD-MM-YYYY (day-first) to ISO.
 * Throws RangeError with the row number on failure.
 */
export function normalizeDate(raw: string, rowNumber: number): string {
  const cleaned = raw.trim().replace(/^"|"$/g, "");
  const isoMatch = cleaned.match(ISO_PATTERN);
  if (isoMatch && isValidIsoDate(cleaned)) return cleaned;

  const slashed = cleaned.match(
    /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/
  );
  if (slashed) {
    const iso = `${slashed[1]}-${pad2(Number(slashed[2]))}-${pad2(Number(slashed[3]))}`;
    if (isValidIsoDate(iso)) return iso;
  }

  // Day-first DD/MM/YYYY (also covers DD.MM.YYYY).
  const dayFirst = cleaned.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dayFirst) {
    const iso = `${dayFirst[3]}-${pad2(Number(dayFirst[2]))}-${pad2(Number(dayFirst[1]))}`;
    if (isValidIsoDate(iso)) return iso;
  }

  throw new RangeError(`row ${rowNumber}: "${raw}" is not a valid date`);
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

type ColumnField =
  | "date"
  | "description"
  | "amount"
  | "debit"
  | "credit";

const COLUMN_ALIASES: Record<string, ColumnField> = {
  date: "date",
  transactiondate: "date",
  posted: "date",
  posteddate: "date",
  postingdate: "date",
  valuedate: "date",
  description: "description",
  memo: "description",
  payee: "description",
  narrative: "description",
  details: "description",
  detail: "description",
  amount: "amount",
  value: "amount",
  debit: "debit",
  withdrawal: "debit",
  withdrawals: "debit",
  credit: "credit",
  deposit: "credit",
  deposits: "credit",
};

interface ParsedRow {
  cells: string[];
  lineNumber: number;
}

type ColumnMap = Partial<Record<ColumnField, number>>;

function detectDelimiter(text: string): string {
  const counts: Array<[string, number]> = [
    [",", (text.match(/,/g) ?? []).length],
    [";", (text.match(/;/g) ?? []).length],
    ["\t", (text.match(/\t/g) ?? []).length],
  ];
  let best = ",";
  let bestCount = -1;
  for (const [delim, count] of counts) {
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

function parseAmount(raw: string, field: string, rowNumber: number): number {
  const cleaned = raw.replace(/["\s]/g, "").replace(/,/g, "");
  const negative = /^\(.*\)$/.test(cleaned);
  const digits = negative ? cleaned.slice(1, -1) : cleaned;
  const value = Number(digits);
  if (digits.length === 0 || !Number.isFinite(value)) {
    throw new RangeError(
      `row ${rowNumber}: "${field}" must be a number, got "${raw}"`
    );
  }
  return negative ? -value : value;
}

function mapStatementHeader(cells: readonly string[]): ColumnMap | null {
  const map: ColumnMap = {};
  cells.forEach((cell, index) => {
    const key = cell.trim().toLowerCase().replace(/\s+/g, "");
    const field = COLUMN_ALIASES[key];
    if (field && map[field] === undefined) {
      map[field] = index;
    }
  });
  const hasDate = map.date !== undefined;
  const hasDescription = map.description !== undefined;
  const hasSingleAmount = map.amount !== undefined;
  const hasSplit = map.debit !== undefined || map.credit !== undefined;
  return hasDate && hasDescription && (hasSingleAmount || hasSplit)
    ? map
    : null;
}

function requireCell(
  cells: readonly string[],
  index: number,
  field: string,
  rowNumber: number
): string {
  const value = cells[index];
  if (index < 0 || value === undefined) {
    throw new RangeError(`row ${rowNumber}: missing "${field}" column value`);
  }
  return value;
}

/**
 * CSV-first bank/card statement parser. Detects common header aliases,
 * supports single-amount or debit/credit column layouts. Amounts are signed:
 * positive is money in, negative is money out. Debit/credit pairs combine as
 * `credit - debit`.
 */
export function parseStatementCsv(text: string): StatementTransaction[] {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new TypeError("CSV input is empty");
  }
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const delimiter = detectDelimiter(clean);
  const rows: ParsedRow[] = [];
  const lines = clean.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    rows.push({ cells: splitDelimited(line, delimiter), lineNumber: i + 1 });
  }
  if (rows.length === 0) {
    throw new TypeError("CSV input is empty");
  }

  const columnMap = mapStatementHeader(rows[0].cells);
  const startIndex = columnMap ? 1 : 0;

  // Headerless positional fallback: date,description,amount.
  const fallbackMap: ColumnMap = { date: 0, description: 1, amount: 2 };
  const effectiveMap = columnMap ?? fallbackMap;

  const transactions: StatementTransaction[] = [];
  for (let r = startIndex; r < rows.length; r += 1) {
    const row = rows[r];

    const date = normalizeDate(
      requireCell(row.cells, effectiveMap.date ?? 0, "date", row.lineNumber),
      row.lineNumber
    );

    const descriptionRaw =
      effectiveMap.description !== undefined
        ? row.cells[effectiveMap.description]
        : undefined;
    if (
      descriptionRaw === undefined ||
      descriptionRaw.replace(/^"|"$/g, "").trim().length === 0
    ) {
      throw new RangeError(
        `row ${row.lineNumber}: description must not be empty`
      );
    }
    const description = descriptionRaw.replace(/^"|"$/g, "").trim();

    let amount: number;
    if (effectiveMap.amount !== undefined) {
      amount = parseAmount(
        requireCell(row.cells, effectiveMap.amount, "amount", row.lineNumber),
        "amount",
        row.lineNumber
      );
    } else {
      // Split layouts carry magnitudes; parens/negative signs are normalized
      // so that debit always flows out and credit always flows in.
      const readMagnitude = (
        field: "debit" | "credit",
        label: string
      ): number => {
        const index = effectiveMap[field];
        if (index === undefined) return 0;
        const rawCell = row.cells[index];
        if (rawCell === undefined || rawCell.trim().replace(/"/g, "").length === 0) {
          return 0;
        }
        return Math.abs(parseAmount(rawCell, label, row.lineNumber));
      };
      amount = readMagnitude("credit", "credit") - readMagnitude("debit", "debit");
    }

    transactions.push({
      id: crypto.randomUUID(),
      date,
      description,
      amount,
      category: UNCATEGORIZED,
    });
  }

  if (transactions.length === 0) {
    throw new RangeError("no transaction rows found in CSV");
  }
  return transactions;
}

// ---------------------------------------------------------------------------
// Rules engine + summaries
// ---------------------------------------------------------------------------

export function matchesRule(description: string, pattern: string): boolean {
  const needle = pattern.trim().toLowerCase();
  if (needle.length === 0) return false;
  return description.toLowerCase().includes(needle);
}

export function applyRules(
  transactions: readonly StatementTransaction[],
  rules: readonly CategoryRule[]
): StatementTransaction[] {
  return transactions.map((transaction) => {
    const match = rules.find((rule) =>
      matchesRule(transaction.description, rule.pattern)
    );
    return match ? { ...transaction, category: match.category } : transaction;
  });
}

export function summarizeByCategory(
  transactions: readonly StatementTransaction[]
): Array<{ category: string; total: number; count: number }> {
  const byCategory = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    const entry = byCategory.get(t.category) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    byCategory.set(t.category, entry);
  }
  return [...byCategory.entries()]
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort(
      (a, b) =>
        Math.abs(b.total) - Math.abs(a.total) ||
        a.category.localeCompare(b.category)
    );
}

export function monthlyNet(
  transactions: readonly StatementTransaction[]
): Array<{ month: string; net: number }> {
  const byMonth = new Map<string, number>();
  for (const t of transactions) {
    const month = t.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + t.amount);
  }
  return [...byMonth.entries()]
    .map(([month, net]) => ({ month, net }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
