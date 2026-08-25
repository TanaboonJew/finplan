import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreditCardTool } from "@/components/tools/credit-card/credit-card-tool";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.credit-card" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CreditCardToolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CreditCardTool />;
}
