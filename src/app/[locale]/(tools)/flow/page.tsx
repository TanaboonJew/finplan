import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FlowTool } from "@/components/tools/flow/flow-tool";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "flow" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function FlowToolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FlowTool />;
}
