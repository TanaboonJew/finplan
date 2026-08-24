import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoneyInput } from "@/components/shared/money-input";
import en from "@/messages/en.json";

function renderWithMessages(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("MoneyInput", () => {
  afterEach(cleanup);

  it("associates the visible label with the input", () => {
    renderWithMessages(
      <MoneyInput
        label="Monthly income"
        currency="$"
        value={2500}
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText("Monthly income")).toHaveValue("2500");
  });

  it("emits parsed numbers while typing", () => {
    const onChange = vi.fn();
    renderWithMessages(
      <MoneyInput label="Amount" value={null} onChange={onChange} />
    );

    const input = screen.getByLabelText("Amount");
    fireEvent.change(input, { target: { value: "1,234.56" } });
    expect(onChange).toHaveBeenLastCalledWith(1234.56);
  });

  it("emits null when cleared and keeps partial drafts editable", () => {
    const onChange = vi.fn();
    renderWithMessages(
      <MoneyInput label="Amount" value={12} onChange={onChange} />
    );

    const input = screen.getByLabelText("Amount");
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);

    const typing = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(typing.value).toBe("");

    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "12." },
    });
    expect(onChange).toHaveBeenLastCalledWith(12);
    expect((screen.getByLabelText("Amount") as HTMLInputElement).value).toBe(
      "12."
    );
  });

  it("follows external value changes but not mid-edit drafts", () => {
    const { rerender } = renderWithMessages(
      <MoneyInput label="Balance" value={100} onChange={() => {}} />
    );
    const input = screen.getByLabelText("Balance");

    fireEvent.change(input, { target: { value: "55" } });
    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <MoneyInput label="Balance" value={100} onChange={() => {}} />
      </NextIntlClientProvider>
    );
    expect((input as HTMLInputElement).value).toBe("55");

    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <MoneyInput label="Balance" value={999} onChange={() => {}} />
      </NextIntlClientProvider>
    );
    expect((input as HTMLInputElement).value).toBe("999");
  });

  it("shows a currency prefix when provided", () => {
    renderWithMessages(
      <MoneyInput
        label="Rent"
        currency="$"
        value={800}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("$")).toBeInTheDocument();
  });
});
