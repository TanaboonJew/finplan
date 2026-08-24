"use client";

import type { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SeedDemoButtonProps
  extends Omit<
    React.ComponentProps<"button"> &
      VariantProps<typeof buttonVariants>,
    "onClick" | "type"
  > {
  onSeed: () => void;
  confirmMessage?: string;
}

export function SeedDemoButton({
  onSeed,
  confirmMessage,
  variant = "outline",
  size = "sm",
  className,
  ...rest
}: SeedDemoButtonProps) {
  const t = useTranslations("shared");

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        onSeed();
      }}
      {...rest}
    >
      <Sparkles className="size-4" aria-hidden />
      {t("seedDemo")}
    </Button>
  );
}
