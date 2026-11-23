import { Component, type ErrorInfo, type ReactNode } from "react";
import { openFeedback } from "@/lib/feedback";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Removes a stale service worker/cache and reloads, without touching saved data. */
async function resetApp(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  window.location.href = "/?fresh=1";
}

/** Last-resort React boundary — a failed render must never leave a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Always log the REAL error and component stack, including in production.
    console.error("Campus Path error boundary:", error, info);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const showDebug =
      import.meta.env.DEV ||
      (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"));

    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <p className="text-3xl">🛠️</p>
          <h1 className="mt-3 text-lg font-semibold text-foreground">Kichhu ekta bhalo chaleni</h1>
          <p className="font-bangla mt-1 text-sm text-muted-foreground">
            কোনো একটি পেজ লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন বা আমাদের জানান — ডাটা নিরাপদেই আছে।
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Try again / আবার চেষ্টা
            </button>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-xl border border-input px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Go home / হোমে যান
            </button>
            <button
              onClick={() =>
                openFeedback({
                  category: "bug",
                  message: `Auto error report: ${error.message.slice(0, 300)}`,
                  page: "error-boundary",
                })
              }
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              Report this / জানান
            </button>
            <button
              onClick={() => void resetApp()}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Reset app / ক্যাশে মুছুন — reload fresh
            </button>
          </div>
          {showDebug && (
            <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-muted p-2 text-left font-mono text-[10px] text-destructive">
              {error.message}
              {"\n"}
              {(error.stack ?? "").split("\n").slice(0, 8).join("\n")}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
