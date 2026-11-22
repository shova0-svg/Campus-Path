import { Component, type ErrorInfo, type ReactNode } from "react";
import { openFeedback } from "@/lib/feedback";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Last-resort React boundary — a failed render must never leave a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Sohoj Rasta error boundary:", error, info.componentStack);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

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
          </div>
        </div>
      </div>
    );
  }
}
