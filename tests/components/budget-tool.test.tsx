import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { BudgetTool } from "@/components/tools/budget/budget-tool";
import { createBudgetDemoState } from "@/lib/demo/budget";
import {
  EMPTY_BUDGET_STATE,
  useBudgetStore,
} from "@/lib/storage/budget-store";

function renderTool() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <BudgetTool />
    </NextIntlClientProvider>
  );
}

describe("BudgetTool", () => {
  beforeEach(() => {
    localStorage.clear();
    useBudgetStore.setState({ ...EMPTY_BUDGET_STATE });
  });

  afterEach(cleanup);

  it("renders the empty state before any category exists", async () => {
    renderTool();
    expect(await screen.findByText("No categories yet")).toBeInTheDocument();
    expect(screen.getByText("Categories × 12 months")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add category/i })
    ).toBeDisabled();
    expect(
      screen.getByText("Record spending to get a score")
    ).toBeInTheDocument();
  });

  it("shows stats, grid rows, and chart after demo data is seeded", async () => {
    useBudgetStore.getState().replaceAll(createBudgetDemoState());
    renderTool();

    expect(await screen.findByText("Planned this year")).toBeInTheDocument();
    expect(screen.getByText("Recorded so far")).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.getByText("Health score")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByText("Groceries").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/recorded months within plan/)
    ).toBeInTheDocument();
  });

  it("adds a category through the form and drops the empty state", async () => {
    renderTool();

    fireEvent.change(await screen.findByLabelText("Category name"), {
      target: { value: "Coffee fund" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));

    expect((await screen.findAllByText("Coffee fund")).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("No categories yet")).not.toBeInTheDocument();
  });

  it("records an entry for a chosen month and lists it in the log", async () => {
    useBudgetStore.getState().addCategory("Groceries", "expense");
    renderTool();

    await screen.findByRole("table");

    fireEvent.change(screen.getByLabelText("Month"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "42.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Record$/i }));

    expect(
      (await screen.findAllByText("April")).length
    ).toBeGreaterThanOrEqual(1);
    expect(useBudgetStore.getState().entries).toHaveLength(1);
    expect(useBudgetStore.getState().entries[0]).toMatchObject({
      month: 3,
      amount: 42.5,
    });
  });

  it("shows the need-category hint in the record card when empty", async () => {
    renderTool();
    expect(
      await screen.findByText("Add a category first to record spending.")
    ).toBeInTheDocument();
  });
});
