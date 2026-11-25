import { Component, type ErrorInfo, type ReactNode } from "react";
import { openFeedback } from "@/lib/feedback";
import { ErrorState } from "@/components/sohoj/ErrorState";

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
      <ErrorState
        title="Something went wrong"
        description="This page couldn't be loaded. Your saved data is safe — try again or go back home."
        onRetry={() => window.location.reload()}
        onHome={() => {
          window.location.href = "/";
        }}
        onReport={() =>
          openFeedback({
            category: "bug",
            message: `Auto error report: ${error.message.slice(0, 300)}`,
            page: "error-boundary",
          })
        }
      >
        <button
          onClick={() => void resetApp()}
          className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Reset app and clear cache
        </button>
        {showDebug && (
          <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-muted p-2 text-left font-mono text-[10px] text-destructive">
            {error.message}
            {"\n"}
            {(error.stack ?? "").split("\n").slice(0, 8).join("\n")}
          </pre>
        )}
      </ErrorState>
    );
  }
}
