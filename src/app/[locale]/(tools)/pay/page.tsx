import { setRequestLocale } from "next-intl/server";
import { ToolPlaceholder } from "@/components/hub/tool-placeholder";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PayToolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ToolPlaceholder slug="pay" />;
}