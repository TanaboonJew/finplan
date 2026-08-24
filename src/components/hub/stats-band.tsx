import { useTranslations } from "next-intl";

interface StatsBandProps {
  toolCount: number;
}

export function StatsBand({ toolCount }: StatsBandProps) {
  const t = useTranslations("hub");

  const stats = [
    { value: String(toolCount), label: t("statsToolsLabel") },
    { value: t("statsPrivateValue"), label: t("statsPrivateLabel") },
    { value: t("statsCostValue"), label: t("statsCostLabel") },
  ];

  return (
    <section className="grid gap-x-8 gap-y-6 border-y py-10 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left"
        >
          <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">
            {stat.value}
          </span>
          <span className="max-w-xs text-sm text-muted-foreground">
            {stat.label}
          </span>
        </div>
      ))}
    </section>
  );
}
