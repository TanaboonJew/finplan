"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DcaFundInput } from "@/lib/storage/dca-store";
import { fractionToPercentText, percentToFraction } from "@/components/tools/dca/dca-format";

interface FundCardProps {
  fund: DcaFundInput;
  index: number;
  onRemove: (id: string) => void;
  canRemove: boolean;
  onUpdate: (id: string, patch: Partial<Omit<DcaFundInput, "id">>) => void;
  errors: Record<string, string | undefined>;
  t: ReturnType<typeof useTranslations<"dca.funds">>;
}

function FundCard({
  fund,
  index,
  onRemove,
  canRemove,
  onUpdate,
  errors,
  t,
}: FundCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Fund {index + 1}
        </span>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(fund.id)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <div className="space-y-3">
        <div>
          <label
            htmlFor={`dca-fund-name-${fund.id}`}
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("nameLabel")}
          </label>
          <input
            id={`dca-fund-name-${fund.id}`}
            type="text"
            value={fund.name}
            placeholder={t("namePlaceholder")}
            onChange={(e) => onUpdate(fund.id, { name: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors[`fund-${fund.id}-name`] ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors[`fund-${fund.id}-name`]}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`dca-fund-return-${fund.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("annualReturnLabel")}
            </label>
            <div className="relative">
              <input
                id={`dca-fund-return-${fund.id}`}
                type="text"
                value={fractionToPercentText(fund.annualReturn)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null) onUpdate(fund.id, { annualReturn: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor={`dca-fund-expense-${fund.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("expenseRatioLabel")}
            </label>
            <div className="relative">
              <input
                id={`dca-fund-expense-${fund.id}`}
                type="text"
                value={fractionToPercentText(fund.expenseRatio)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null) onUpdate(fund.id, { expenseRatio: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor={`dca-fund-front-${fund.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("frontLoadLabel")}
            </label>
            <div className="relative">
              <input
                id={`dca-fund-front-${fund.id}`}
                type="text"
                value={fractionToPercentText(fund.frontLoad)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null) onUpdate(fund.id, { frontLoad: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor={`dca-fund-exit-${fund.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("exitLoadLabel")}
            </label>
            <div className="relative">
              <input
                id={`dca-fund-exit-${fund.id}`}
                type="text"
                value={fractionToPercentText(fund.exitLoad)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null) onUpdate(fund.id, { exitLoad: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface DcaFundInputsProps {
  funds: DcaFundInput[];
  monthlyContribution: number;
  horizonMonths: number;
  onMonthlyContributionChange: (amount: number) => void;
  onHorizonMonthsChange: (months: number) => void;
  onAddFund: () => void;
  onUpdateFund: (id: string, patch: Partial<Omit<DcaFundInput, "id">>) => void;
  onRemoveFund: (id: string) => void;
  errors: Record<string, string | undefined>;
}

export function DcaFundInputs({
  funds,
  monthlyContribution,
  horizonMonths,
  onMonthlyContributionChange,
  onHorizonMonthsChange,
  onAddFund,
  onUpdateFund,
  onRemoveFund,
  errors,
}: DcaFundInputsProps) {
  const t = useTranslations("dca.funds");
  const tParams = useTranslations("dca.params");

  const horizonYears = Math.round((horizonMonths / 12) * 10) / 10;

  return (
    <>
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">{tParams("monthlyContribution")}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="dca-monthly"
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {tParams("monthlyContribution")}
            </label>
            <input
              id="dca-monthly"
              type="number"
              min={0}
              step={100}
              value={monthlyContribution || ""}
              onChange={(e) => onMonthlyContributionChange(Number(e.target.value) || 0)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.contribution ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.contribution}
              </p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="dca-horizon"
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {tParams("horizonYears")}
            </label>
            <div className="relative">
              <input
                id="dca-horizon"
                type="number"
                min={1}
                max={50}
                step={1}
                value={horizonYears}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  if (Number.isFinite(y) && y >= 1 && y <= 50) {
                    onHorizonMonthsChange(Math.round(y * 12));
                  }
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-12 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {tParams("horizonHint")}
              </span>
            </div>
            {errors.horizon ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.horizon}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <Button type="button" variant="outline" size="sm" onClick={onAddFund}>
            <Plus className="size-4" aria-hidden />
            {t("addFund")}
          </Button>
        </div>
        {funds.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">{t("emptyTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("emptyBody")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {funds.map((fund, index) => (
              <FundCard
                key={fund.id}
                fund={fund}
                index={index}
                onRemove={onRemoveFund}
                canRemove={funds.length > 2}
                onUpdate={onUpdateFund}
                errors={errors}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
