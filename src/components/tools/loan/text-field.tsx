"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps
  extends React.ComponentProps<"input"> {
  label: React.ReactNode;
  error?: React.ReactNode;
  hideLabel?: boolean;
}

const inputClasses = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function TextField({
  label,
  error,
  hideLabel = false,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium text-muted-foreground",
          hideLabel && "sr-only"
        )}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        data-slot="text-field"
        aria-invalid={error ? true : undefined}
        className={cn(inputClasses, error && "border-red-500 dark:border-red-400")}
        {...rest}
      />
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
