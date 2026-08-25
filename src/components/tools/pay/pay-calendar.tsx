"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Subscription } from "@/lib/storage/pay-store";
import {
  formatMoney,
  monthLabel,
  localeTagOf,
} from "@/components/tools/pay/pay-format";

interface PayCalendarProps {
  subscriptions: Subscription[];
  currency: string;
  locale: string;
}

interface RenewalEntry {
  name: string;
  amount: number;
  category: string;
  day: number;
}

function addMonths(monthStr: string, n: number): string {
  const [yStr, mStr] = monthStr.split("-");
  let y = Number(yStr);
  let m = Number(mStr) + n;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function currentMonth(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

export function PayCalendar({ subscriptions, currency, locale }: PayCalendarProps) {
  const t = useTranslations("pay.calendar");
  const localeTag = localeTagOf(locale);

  const months = useMemo(() => {
    const now = currentMonth();
    return [0, 1, 2].map((offset) => addMonths(now, offset));
  }, []);

  const calendarData = useMemo(() => {
    return months.map((month) => {
      const renewals: RenewalEntry[] = [];
      for (const sub of subscriptions) {
        if (!sub.active) continue;
        if (sub.cycle === "monthly") {
          renewals.push({
            name: sub.name,
            amount: sub.amount,
            category: sub.category,
            day: sub.renewalDay,
          });
        } else {
          const startMon = Number(sub.startDate.split("-")[1]);
          const curMon = Number(month.split("-")[1]);
          if (curMon === startMon) {
            renewals.push({
              name: sub.name,
              amount: sub.amount,
              category: sub.category,
              day: sub.renewalDay,
            });
          }
        }
      }
      renewals.sort((a, b) => a.day - b.day);
      const total = renewals.reduce((sum, r) => sum + r.amount, 0);
      return { month, renewals, total };
    });
  }, [months, subscriptions]);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {calendarData.map(({ month: m, renewals, total }) => (
          <div
            key={m}
            className="rounded-lg border p-4"
          >
            <h3 className="mb-2 font-medium">{monthLabel(m, localeTag)}</h3>
            {renewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noRenewals")}</p>
            ) : (
              <>
                <ul className="space-y-1">
                  {renewals.map((r) => (
                    <li key={r.name} className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        {r.name}
                        <span className="text-muted-foreground ml-1">(day {r.day})</span>
                      </span>
                      <span className="tabular-nums shrink-0 ml-2">
                        {formatMoney(r.amount, localeTag, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 border-t pt-2 text-sm font-medium tabular-nums">
                  {t("monthTotal")} {formatMoney(total, localeTag, currency)}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
