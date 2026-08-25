import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PortfolioAnalyzerTool } from "@/components/tools/portfolio-analyzer/portfolio-analyzer-tool";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "tools.portfolio-analyzer",
  });
  return { title: t("title"), description: t("description") };
}

export default async function PortfolioAnalyzerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortfolioAnalyzerTool />;
}
