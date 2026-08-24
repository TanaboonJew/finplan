import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("hub");

  return (
    <section className="flex flex-col items-center gap-5 py-16 text-center sm:py-24">
      <Badge
        variant="outline"
        className="gap-1.5 rounded-full px-3 py-1 text-xs font-normal text-muted-foreground"
      >
        <Sparkles className="size-3 text-primary" aria-hidden="true" />
        {t("heroBadge")}
      </Badge>
      <h1 className="max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        {t("heroTitle")}
      </h1>
      <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        {t("heroSubtitle")}
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/#tools">{t("heroBrowse")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/debt">{t("heroFeatured")}</Link>
        </Button>
      </div>
    </section>
  );
}
