import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { DebtTool } from "@/components/tools/debt/debt-tool";
import { createDebtDemoSnapshot } from "@/lib/demo/debt";
import { useDebtStore } from "@/lib/storage/debt-store";

function renderTool() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <DebtTool />
    </NextIntlClientProvider>
  );
}

describe("DebtTool", () => {
  beforeEach(() => {
    localStorage.clear();
    useDebtStore.getState().reset();
  });

  afterEach(cleanup);

  it("renders the empty state with an add form before any debt exists", async () => {
    renderTool();
    expect(
      await screen.findByText("No debts yet")
    ).toBeInTheDocument();
    expect(screen.getByText("Your debts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add debt/i })).toBeEnabled();
  });

  it("shows stats and strategy plans after demo data is seeded", async () => {
    useDebtStore.getState().replaceState(createDebtDemoSnapshot());
    renderTool();

    expect(await screen.findByText("Total debt")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Snowball" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Avalanche" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hybrid" })).toBeInTheDocument();
    expect(screen.getAllByText("Cheapest").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("warns when minimum payments cannot cover interest", async () => {
    useDebtStore.getState().addDebt({
      name: "Forever debt",
      balance: 1000,
      annualRate: 0.12,
      minimumPayment: 0,
    });
    renderTool();

    expect(
      await screen.findByText(
        /cannot cover the accruing interest/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Total debt")).not.toBeInTheDocument();
  });
});
