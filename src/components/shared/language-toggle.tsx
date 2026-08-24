"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageToggle() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale =
    locale === routing.defaultLocale
      ? routing.locales.find((candidate) => candidate !== routing.defaultLocale)
      : routing.defaultLocale;

  if (!nextLocale) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 px-2 font-mono text-xs uppercase tabular-nums"
      aria-label={t("switchLanguage")}
      title={t("switchLanguage")}
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          router.replace(pathname, { locale: nextLocale });
        })
      }
    >
      <Globe className="size-4" />
      {locale}
    </Button>
  );
}
