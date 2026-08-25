"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { Holding } from "@/lib/finance/portfolio";
import { usePortfolioStore } from "@/lib/storage/portfolio-store";
import { useMoney } from "./portfolio-paste";

const NUM_INPUT =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-right text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function HoldingsEditor({ holdings }: { holdings: readonly Holding[] }) {
  const t = useTranslations("portfolio-analyzer.holdings");
  const money = useMoney();
  const [symbol, setSymbol] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const symbolValid = symbol.trim().length > 0;
  const quantityValid = Number(quantity) >= 0 && quantity.trim() !== "" && Number.isFinite(Number(quantity));
  const priceValid = Number(price) >= 0 && price.trim() !== "" && Number.isFinite(Number(price));
  const formValid = symbolValid && quantityValid && priceValid;

  function handleAdd() {
    if (!formValid) return;
    usePortfolioStore.getState().addHolding({
      symbol: symbol.trim().toUpperCase(),
      name: "",
      assetClass: assetClass.trim(),
      quantity: Number(quantity),
      price: Number(price),
    });
    setSymbol("");
    setAssetClass("");
    setQuantity("");
    setPrice("");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{t("title")}</h2>

      {holdings.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">{t("symbol")}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t("assetClass")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("quantity")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("price")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("value")}</th>
                <th scope="col" className="py-2 font-medium">
                  <span className="sr-only">{t("remove")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.id} className="border-b border-border last:border-b-0">
                  <td className="py-1.5 pr-3">
                    <input
                      aria-label={`${t("symbol")} — ${holding.symbol}`}
                      value={holding.symbol}
                      onChange={(e) =>
                        usePortfolioStore
                          .getState()
                          .updateHolding(holding.id, { symbol: e.target.value })
                      }
                      className={`${NUM_INPUT} text-left`}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      aria-label={`${t("assetClass")} — ${holding.symbol}`}
                      value={holding.assetClass}
                      onChange={(e) =>
                        usePortfolioStore
                          .getState()
                          .updateHolding(holding.id, { assetClass: e.target.value })
                      }
                      className={`${NUM_INPUT} text-left`}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      aria-label={`${t("quantity")} — ${holding.symbol}`}
                      type="number"
                      min={0}
                      step="any"
                      value={holding.quantity}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isFinite(value) && value >= 0) {
                          usePortfolioStore
                            .getState()
                            .updateHolding(holding.id, { quantity: value });
                        }
                      }}
                      className={NUM_INPUT}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      aria-label={`${t("price")} — ${holding.symbol}`}
                      type="number"
                      min={0}
                      step="any"
                      value={holding.price}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isFinite(value) && value >= 0) {
                          usePortfolioStore
                            .getState()
                            .updateHolding(holding.id, { price: value });
                        }
                      }}
                      className={NUM_INPUT}
                    />
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {money(holding.quantity * holding.price)}
                  </td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      aria-label={`${t("remove")} ${holding.symbol}`}
                      onClick={() =>
                        usePortfolioStore.getState().removeHolding(holding.id)
                      }
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        className="mt-4 flex flex-wrap items-start gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <div className="min-w-[110px] flex-1">
          <label htmlFor="pf-add-symbol" className="mb-1 block text-xs text-muted-foreground">
            {t("symbol")}
          </label>
          <input
            id="pf-add-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="VTI"
            className={`${NUM_INPUT} text-left`}
            aria-invalid={symbol.length > 0 && !symbolValid}
          />
        </div>
        <div className="min-w-[110px] flex-1">
          <label htmlFor="pf-add-class" className="mb-1 block text-xs text-muted-foreground">
            {t("assetClass")}
          </label>
          <input
            id="pf-add-class"
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value)}
            placeholder={t("classPlaceholder")}
            className={`${NUM_INPUT} text-left`}
          />
        </div>
        <div className="min-w-[90px]">
          <label htmlFor="pf-add-qty" className="mb-1 block text-xs text-muted-foreground">
            {t("quantity")}
          </label>
          <input
            id="pf-add-qty"
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="10"
            className={NUM_INPUT}
            aria-invalid={quantity.length > 0 && !quantityValid}
          />
        </div>
        <div className="min-w-[90px]">
          <label htmlFor="pf-add-price" className="mb-1 block text-xs text-muted-foreground">
            {t("price")}
          </label>
          <input
            id="pf-add-price"
            type="number"
            min={0}
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="100"
            className={NUM_INPUT}
            aria-invalid={price.length > 0 && !priceValid}
          />
        </div>
        <button
          type="submit"
          disabled={!formValid}
          className="inline-flex h-8 items-center gap-1.5 self-end rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-3.5" aria-hidden />
          {t("add")}
        </button>
      </form>
    </div>
  );
}

export function TargetsEditor({
  classes,
}: {
  classes: readonly string[];
}) {
  const t = useTranslations("portfolio-analyzer.targets");
  const targets = usePortfolioStore((state) => state.targets);
  const knownClasses = [...new Set(classes)];

  if (knownClasses.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("description")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {knownClasses.map((assetClass) => (
          <div key={assetClass}>
            <label
              htmlFor={`pf-target-${assetClass}`}
              className="mb-1 block text-xs text-muted-foreground"
            >
              {assetClass}
            </label>
            <div className="flex items-center gap-1">
              <input
                id={`pf-target-${assetClass}`}
                type="number"
                min={0}
                max={100}
                step="1"
                value={
                  targets[assetClass] !== undefined
                    ? Math.round(targets[assetClass] * 1000) / 10
                    : ""
                }
                onChange={(e) => {
                  const percent = Number(e.target.value);
                  if (Number.isFinite(percent)) {
                    usePortfolioStore
                      .getState()
                      .setTarget(assetClass, percent / 100);
                  }
                }}
                className={NUM_INPUT}
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
