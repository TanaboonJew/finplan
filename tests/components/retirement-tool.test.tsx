import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { RetirementTool } from "@/components/tools/retirement/retirement-tool";
import { createRetirementDemoSnapshot } from "@/lib/demo/retirement";
import { useRetirementStore } from "@/lib/storage/retirement-store";

function renderTool() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <RetirementTool />
    </NextIntlClientProvider>
  );
}

describe("RetirementTool", () => {
  beforeEach(() => {
    localStorage.clear();
    useRetirementStore.getState().reset();
  });

  afterEach(cleanup);

  it("renders the default plan with stats, chart card and scenarios", async () => {
    renderTool();

    expect(await screen.findByText("FIRE number")).toBeInTheDocument();
    expect(screen.getByText("Your plan")).toBeInTheDocument();
    expect(screen.getByText("Growth projection")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByText("Bear market").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the shortfall and required saving for the demo persona", async () => {
    useRetirementStore.getState().replaceState(createRetirementDemoSnapshot());
    renderTool();

    expect(await screen.findByText("Shortfall at retirement")).toBeInTheDocument();
    expect(screen.getByText(/Currently saving/i)).toBeInTheDocument();
  });

  it("flags inverted ages with a validation hint", async () => {
    useRetirementStore.getState().setCurrentAge(70);
    useRetirementStore.getState().setRetirementAge(60);
    renderTool();

    expect(
      await screen.findByText(
        "Retirement age must be after your current age."
      )
    ).toBeInTheDocument();
  });
});
