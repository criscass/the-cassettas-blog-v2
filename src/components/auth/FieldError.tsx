import { cn } from "@lib/utils";

/**
 * Inline replacement for the native HTML5 validation bubbles (the forms set
 * `noValidate`). Renders the message under its field in the rose error tone
 * the design system already uses for the form-level error banner.
 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-rose-700 dark:text-rose-300">
      {message}
    </p>
  );
}

/** Input/textarea classes, switching the border to rose when the field errors. */
export function fieldInputClasses(hasError: boolean, extra?: string): string {
  return cn(
    "rounded-lg border bg-transparent px-3 py-2 focus:outline-none",
    hasError
      ? "border-rose-500/60 focus:border-rose-500/80"
      : "border-border focus:border-accent/50",
    extra,
  );
}
