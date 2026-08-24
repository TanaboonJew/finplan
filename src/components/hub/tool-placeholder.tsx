import { Hammer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface ToolPlaceholderProps {
  slug: string;
}

export function ToolPlaceholder({ slug }: ToolPlaceholderProps) {
  const t = useTranslations();

  return (
    <article className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-20 text-center sm:py-28">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Hammer className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight">
        {t(`tools.${slug}.title`)}
      </h1>
      <p className="text-muted-foreground">{t(`tools.${slug}.description`)}</p>
      <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {t("toolPage.comingSoon")}
      </p>
      <Button asChild className="mt-2">
        <Link href="/">{t("toolPage.back")}</Link>
      </Button>
    </article>
  );
}
