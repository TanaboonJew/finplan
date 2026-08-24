import { useTranslations } from "next-intl";
import type { ToolCategory, ToolMeta } from "@/lib/tools";
import { ToolCard } from "./tool-card";

interface CategorySectionProps {
  category: ToolCategory;
  tools: readonly ToolMeta[];
}

export function CategorySection({ category, tools }: CategorySectionProps) {
  const t = useTranslations();

  return (
    <section id={`category-${category.id}`} className="scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">
        {t(category.nameKey)}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(category.blurbKey)}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  );
}
