import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartCard } from "@/components/shared/chart-card";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { StatCard } from "@/components/shared/stat-card";
import en from "@/messages/en.json";

function renderWithMessages(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

afterEach(cleanup);

describe("StatCard", () => {
  it("renders label, value and optional sublabel", () => {
    renderWithMessages(
      <StatCard
        label="Total interest"
        value="$2,345.60"
        sublabel="Across 3 debts"
      />
    );
    expect(screen.getByText("Total interest")).toBeInTheDocument();
    expect(screen.getByText("$2,345.60")).toBeInTheDocument();
    expect(screen.getByText("Across 3 debts")).toBeInTheDocument();
  });

  it("applies tone classes to the value", () => {
    renderWithMessages(<StatCard label="Saved" value="$10" tone="positive" />);
    expect(screen.getByText("$10").className).toContain("emerald-600");
  });

  it("keeps the default tone neutral", () => {
    const { getByText } = renderWithMessages(
      <StatCard label="Balance" value="$1" />
    );
    expect(getByText("$1").className).toContain("text-foreground");
  });
});

describe("ChartCard", () => {
  it("renders a titled card with a chart area", () => {
    renderWithMessages(
      <ChartCard title="Balance over time" description="Monthly">
        <div data-testid="chart-child" />
      </ChartCard>
    );
    expect(
      screen.getByRole("heading", { name: "Balance over time" })
    ).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });
});

describe("ExportImportButtons", () => {
  it("triggers export on click", () => {
    const onExport = vi.fn();
    renderWithMessages(
      <ExportImportButtons onExport={onExport} onImport={() => {}} />
    );
    fireEvent.click(screen.getByRole("button", { name: /Export JSON/ }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("parses an imported JSON file and passes it up", async () => {
    const onImport = vi.fn();
    const { container } = renderWithMessages(
      <ExportImportButtons onExport={() => {}} onImport={onImport} />
    );
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File([JSON.stringify({ app: "finplan" })], "plan.json", {
      type: "application/json",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onImport).toHaveBeenCalled());
    expect(onImport).toHaveBeenCalledWith({ app: "finplan" });
  });

  it("reports invalid JSON through onError", async () => {
    const onError = vi.fn();
    const { container } = renderWithMessages(
      <ExportImportButtons
        onExport={() => {}}
        onImport={() => {}}
        onError={onError}
      />
    );
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["{oops"], "broken.json", {
      type: "application/json",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("disables both buttons while disabled", () => {
    renderWithMessages(
      <ExportImportButtons onExport={() => {}} onImport={() => {}} disabled />
    );
    expect(screen.getByRole("button", { name: /Export JSON/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Import JSON/ })).toBeDisabled();
  });
});

describe("SeedDemoButton", () => {
  it("seeds immediately without a confirm message", () => {
    const onSeed = vi.fn();
    renderWithMessages(<SeedDemoButton onSeed={onSeed} />);
    fireEvent.click(screen.getByRole("button", { name: /Seed demo data/ }));
    expect(onSeed).toHaveBeenCalledTimes(1);
  });

  it("respects the confirmation dialog", () => {
    const onSeed = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm");

    confirmSpy.mockReturnValue(false);
    renderWithMessages(
      <SeedDemoButton onSeed={onSeed} confirmMessage="Sure?" />
    );
    fireEvent.click(screen.getByRole("button", { name: /Seed demo data/ }));
    expect(onSeed).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Seed demo data/ }));
    expect(onSeed).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith("Sure?");

    confirmSpy.mockRestore();
  });
});
