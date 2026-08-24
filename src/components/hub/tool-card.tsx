"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { TOOL_ICONS, type ToolMeta } from "@/lib/tools";

interface ToolCardProps {
  tool: ToolMeta;
}

export function ToolCard({ tool }: ToolCardProps) {
  const t = useTranslations();
  const Icon = TOOL_ICONS[tool.iconId];

  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {tool.badge ? (
        <Badge
          variant={tool.badge === "new" ? "default" : "secondary"}
          className="absolute right-4 top-4"
        >
          {t(`hub.badges.${tool.badge}`)}
        </Badge>
      ) : null}
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="font-semibold leading-snug">{t(tool.titleKey)}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t(tool.descriptionKey)}
      </p>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary">
        {t("hub.cta")}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
