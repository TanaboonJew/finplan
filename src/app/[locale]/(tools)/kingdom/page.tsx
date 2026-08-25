import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { KingdomTool } from "@/components/tools/kingdom/kingdom-tool";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.kingdom" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function KingdomToolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <KingdomTool />;
}
