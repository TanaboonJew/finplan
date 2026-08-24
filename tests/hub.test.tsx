import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CategorySection } from "@/components/hub/category-section";
import { ToolCard } from "@/components/hub/tool-card";
import en from "@/messages/en.json";
import { TOOLS, type ToolCategory } from "@/lib/tools";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function renderWithMessages(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("ToolCard", () => {
  afterEach(cleanup);

  it("links to the tool route with localized copy", () => {
    const debt = TOOLS.find((tool) => tool.slug === "debt");
    expect(debt).toBeDefined();

    renderWithMessages(<ToolCard tool={debt!} />);

    const link = screen.getByRole("link", { name: /Debt payoff planner/ });
    expect(link).toHaveAttribute("href", "/debt");
  });

  it("shows a badge when the tool is flagged", () => {
    const featured = TOOLS.find((tool) => tool.badge === "new");
    expect(featured).toBeDefined();

    renderWithMessages(<ToolCard tool={featured!} />);

    expect(screen.getByText("New")).toBeInTheDocument();
  });
});

describe("CategorySection", () => {
  afterEach(cleanup);

  it("renders one card per tool in the category", () => {
    const budgeting: ToolCategory = {
      id: "budgeting",
      nameKey: "categories.budgeting.name",
      blurbKey: "categories.budgeting.blurb",
    };
    const tools = TOOLS.filter((tool) => tool.category === "budgeting");

    renderWithMessages(
      <CategorySection category={budgeting} tools={tools} />
    );

    expect(screen.getByRole("heading", { name: "Budgeting" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(tools.length);
  });
});
