export const FIELD_LABEL_CLASS =
  "text-sm font-medium text-muted-foreground";

export const FIELD_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors " +
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tabular-nums";

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
