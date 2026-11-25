import type { ReactNode } from "react";
import { AlertTriangle, Flag, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  description?: string;
  onRetry: () => void;
  onHome: () => void;
  onReport: () => void;
  children?: ReactNode;
}

/** Shared, English-only, theme-aware error screen for every failure boundary. */
export function ErrorState({
  title = "Something went wrong",
  description = "This page couldn't be loaded. Your saved data is safe — try again or go back home.",
  onRetry,
  onHome,
  onReport,
  children,
}: Props) {
  return (
    <div className="bg-desk flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-float)]">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </span>
        <h1 className="font-display mt-4 text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-6 grid gap-2">
          <Button onClick={onRetry}>
            <RotateCcw /> Try again
          </Button>
          <Button variant="outline" onClick={onHome}>
            <Home /> Go home
          </Button>
          <Button variant="ghost" onClick={onReport}>
            <Flag /> Report this issue
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
