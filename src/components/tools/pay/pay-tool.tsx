"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  PAY_SCHEMA_VERSION,
  PAY_TOOL_ID,
  sanitizePaySnapshot,
  usePayStore,
  type PaySnapshot,
} from "@/lib/storage/pay-store";
import { createPayDemoSnapshot } from "@/lib/demo/pay";
import { PayToolbar } from "@/components/tools/pay/pay-toolbar";
import { PayStats } from "@/components/tools/pay/pay-stats";
import { PayEditor } from "@/components/tools/pay/pay-editor";
import { PayCalendar } from "@/components/tools/pay/pay-calendar";
import { PayChart } from "@/components/tools/pay/pay-chart";
import { PayIncreaseTracker } from "@/components/tools/pay/pay-increase-tracker";
import { localeTagOf } from "@/components/tools/pay/pay-format";
import { useMounted } from "@/components/tools/pay/use-mounted";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function PayTool() {
  const t = useTranslations("pay");
  const tTool = useTranslations("tools.pay");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  const mounted = useMounted();

  const subscriptions = usePayStore((s) => s.subscriptions);
  const currency = usePayStore((s) => s.currency);
  const addSubscription = usePayStore((s) => s.addSubscription);
  const updateSubscription = usePayStore((s) => s.updateSubscription);
  const removeSubscription = usePayStore((s) => s.removeSubscription);
  const setCurrency = usePayStore((s) => s.setCurrency);
  const recordPriceIncrease = usePayStore((s) => s.recordPriceIncrease);
  const replaceState = usePayStore((s) => s.replaceState);
  const reset = usePayStore((s) => s.reset);

  const stats = useMemo(() => {
    if (!mounted) return { monthlyTotal: 0, annualTotal: 0, activeCount: 0, averagePerSub: 0 };
    const active = subscriptions.filter((s) => s.active);
    const monthlyTotal = round2(
      active.reduce((sum, s) => {
        const m = s.cycle === "yearly" ? s.amount / 12 : s.amount;
        return sum + m;
      }, 0)
    );
    const annualTotal = round2(monthlyTotal * 12);
    const activeCount = active.length;
    const averagePerSub = activeCount > 0 ? round2(monthlyTotal / activeCount) : 0;
    return { monthlyTotal, annualTotal, activeCount, averagePerSub };
  }, [mounted, subscriptions]);

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  function handleExport() {
    const snapshot: PaySnapshot = {
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        cycle: s.cycle,
        category: s.category,
        startDate: s.startDate,
        renewalDay: s.renewalDay,
        currency: s.currency,
        priceHistory: s.priceHistory.map((p) => ({
          amount: p.amount,
          effectiveMonth: p.effectiveMonth,
        })),
        active: s.active,
      })),
      currency,
    };
    downloadJson(
      `finplan-${PAY_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(PAY_TOOL_ID, PAY_SCHEMA_VERSION, snapshot)
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, PAY_TOOL_ID);
    if (envelope.schemaVersion !== PAY_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizePaySnapshot(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {tTool("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{tTool("description")}</p>
      </header>

      <PayToolbar
        currency={currency}
        onCurrencyChange={setCurrency}
        onSeed={() => replaceState(createPayDemoSnapshot())}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      <PayStats
        monthlyTotal={stats.monthlyTotal}
        annualTotal={stats.annualTotal}
        activeCount={stats.activeCount}
        averagePerSub={stats.averagePerSub}
        currency={currency}
        localeTag={localeTag}
      />

      <PayEditor
        subscriptions={subscriptions}
        currency={currency}
        localeTag={localeTag}
        onAdd={addSubscription}
        onUpdate={updateSubscription}
        onRemove={removeSubscription}
        onRecordIncrease={recordPriceIncrease}
      />

      {subscriptions.length > 0 ? (
        <>
          <PayCalendar
            subscriptions={subscriptions}
            currency={currency}
            locale={locale}
          />
          <PayChart
            subscriptions={subscriptions}
            currency={currency}
            locale={locale}
          />
          <PayIncreaseTracker
            subscriptions={subscriptions}
            currency={currency}
            locale={locale}
          />
        </>
      ) : null}
    </div>
  );
}
