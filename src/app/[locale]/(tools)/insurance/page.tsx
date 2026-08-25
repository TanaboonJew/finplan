import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InsuranceTool } from "@/components/tools/insurance/insurance-tool";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.insurance" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function InsuranceToolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InsuranceTool />;
}
