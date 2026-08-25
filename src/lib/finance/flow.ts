import { assertNonNegative, assertPositive } from "./validation";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface FlowStream {
  id: string;
  name: string;
  amount: number;
  category: "income" | "expense";
  startMonth: string;
  endMonth: string | null;
}

export interface WhatIfAdjustment {
  streamId: string;
  scale: number;
}

export interface MonthlyPoint {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  balance: number;
}

function addMonths(monthStr: string, delta: number): string {
  const [yearStr, monStr] = monthStr.split("-");
  let year = Number(yearStr);
  let month = Number(monStr) - 1;
  month += delta;
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

function isStreamActive(stream: FlowStream, monthStr: string): boolean {
  if (monthStr < stream.startMonth) return false;
  if (stream.endMonth !== null && monthStr > stream.endMonth) return false;
  return true;
}

export function projectCashFlow(
  streams: FlowStream[],
  startingBalance: number,
  horizonMonths: number,
  startMonth: string,
  adjustments: WhatIfAdjustment[] = []
): MonthlyPoint[] {
  assertNonNegative(startingBalance, "startingBalance");
  assertPositive(horizonMonths, "horizonMonths");
  if (!Number.isInteger(horizonMonths)) {
    throw new RangeError(`horizonMonths must be an integer, got ${horizonMonths}`);
  }
  if (!MONTH_PATTERN.test(startMonth)) {
    throw new RangeError(`startMonth must be a YYYY-MM string, got ${startMonth}`);
  }

  const adjMap = new Map<string, number>();
  for (const adj of adjustments) {
    assertPositive(adj.scale, "adjustment.scale");
    adjMap.set(adj.streamId, adj.scale);
  }

  const points: MonthlyPoint[] = [];
  let balance = startingBalance;

  for (let i = 0; i < horizonMonths; i++) {
    const month = addMonths(startMonth, i);
    let totalIncome = 0;
    let totalExpense = 0;

    for (const stream of streams) {
      if (!isStreamActive(stream, month)) continue;
      const scale = adjMap.get(stream.id) ?? 1;
      const adjusted = stream.amount * scale;

      if (stream.category === "income") {
        totalIncome += adjusted;
      } else {
        totalExpense += adjusted;
      }
    }

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpense = Math.round(totalExpense * 100) / 100;
    const netFlow = Math.round((totalIncome - totalExpense) * 100) / 100;
    balance = Math.round((balance + netFlow) * 100) / 100;

    points.push({ month, totalIncome, totalExpense, netFlow, balance });
  }

  return points;
}
