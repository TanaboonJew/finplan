"use client";

import { useTranslations } from "next-intl";
import type { TripParams } from "@/lib/storage/travel-card-store";
import {
  VAT_PRESETS,
  isValidVatPresetKey,
} from "@/lib/finance/travel-card";

const DEST_CURRENCIES = ["EUR", "GBP", "THB", "JPY", "AUD", "SGD", "USD"] as const;

const VAT_PRESET_KEYS = ["EU", "UK", "Japan", "Thailand", "Australia", "None"] as const;

export interface TravelTripInputsProps {
  trip: TripParams;
  onTripChange: (trip: TripParams) => void;
  errors: Record<string, string | undefined>;
}

export function TravelTripInputs({
  trip,
  onTripChange,
  errors,
}: TravelTripInputsProps) {
  const t = useTranslations("travel-card.trip");

  function handleFieldChange(
    field: keyof TripParams,
    value: string | number | boolean
  ) {
    onTripChange({ ...trip, [field]: value });
  }

  function handleVatPresetChange(presetKey: string) {
    if (isValidVatPresetKey(presetKey)) {
      const preset = VAT_PRESETS[presetKey];
      onTripChange({
        ...trip,
        vatRate: preset.rate,
        vatMinSpend: preset.minSpend,
        enableVatRefund: presetKey !== "None",
      });
    }
  }

  const currentPresetKey = VAT_PRESET_KEYS.find((key) => {
    const preset = VAT_PRESETS[key];
    return (
      Math.abs(preset.rate - trip.vatRate) < 0.001 &&
      Math.abs(preset.minSpend - trip.vatMinSpend) < 0.01
    );
  });

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">{t("title")}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tc-foreign-spend"
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("foreignSpend")}
          </label>
          <input
            id="tc-foreign-spend"
            type="number"
            min={0}
            step={100}
            value={trip.foreignSpend || ""}
            onChange={(e) =>
              handleFieldChange("foreignSpend", Number(e.target.value) || 0)
            }
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.foreignSpend ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.foreignSpend}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="tc-days-abroad"
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("daysAbroad")}
          </label>
          <input
            id="tc-days-abroad"
            type="number"
            min={1}
            max={365}
            value={trip.daysAbroad}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 1) handleFieldChange("daysAbroad", Math.round(v));
            }}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.daysAbroad ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.daysAbroad}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="tc-dest-currency"
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("destCurrency")}
          </label>
          <select
            id="tc-dest-currency"
            value={trip.destinationCurrency}
            onChange={(e) =>
              handleFieldChange("destinationCurrency", e.target.value)
            }
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DEST_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="tc-vat-preset"
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("vatPreset")}
          </label>
          <select
            id="tc-vat-preset"
            value={currentPresetKey ?? ""}
            onChange={(e) => handleVatPresetChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {VAT_PRESET_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="tc-vat-rate"
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("vatRate")}
          </label>
          <div className="relative">
            <input
              id="tc-vat-rate"
              type="text"
              value={String(Number((trip.vatRate * 100).toFixed(1)))}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[\s'%]/g, "");
                const num = Number(cleaned);
                if (Number.isFinite(num) && num >= 0 && num <= 100) {
                  handleFieldChange("vatRate", num / 100);
                }
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
            htmlFor="tc-vat-min"
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("vatMinSpend")}
          </label>
          <input
            id="tc-vat-min"
            type="number"
            min={0}
            step={10}
            value={trip.vatMinSpend || ""}
            onChange={(e) =>
              handleFieldChange("vatMinSpend", Number(e.target.value) || 0)
            }
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-end sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={trip.enableVatRefund}
              onChange={(e) =>
                handleFieldChange("enableVatRefund", e.target.checked)
              }
              className="size-4 rounded border-input"
            />
            {t("enableVatRefund")}
          </label>
        </div>
      </div>
    </section>
  );
}
