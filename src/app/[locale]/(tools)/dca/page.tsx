import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DcaTool } from "@/components/tools/dca/dca-tool";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.dca" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DcaToolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DcaTool />;
}
