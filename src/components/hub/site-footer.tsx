import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl space-y-2 px-4 py-8 text-sm text-muted-foreground sm:flex sm:items-baseline sm:justify-between sm:gap-6 sm:space-y-0">
        <p>{t("localNote")}</p>
        <p className="shrink-0">
          {t("disclaimer")}{" "}
          <span className="tabular-nums">
            {t("copyright", { year: new Date().getFullYear() })}
          </span>
        </p>
      </div>
    </footer>
  );
}
