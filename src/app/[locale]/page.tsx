import { setRequestLocale } from "next-intl/server";
import { CategorySection } from "@/components/hub/category-section";
import { Hero } from "@/components/hub/hero";
import { StatsBand } from "@/components/hub/stats-band";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24">
      <Hero />
      <StatsBand toolCount={TOOLS.length} />
      <div id="tools" className="mt-14 space-y-14 scroll-mt-20">
        {TOOL_CATEGORIES.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            tools={TOOLS.filter((tool) => tool.category === category.id)}
          />
        ))}
      </div>
    </div>
  );
}
