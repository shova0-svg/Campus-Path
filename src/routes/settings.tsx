import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LAST_PUSH_KEY, setSoundEnabled, soundEnabled } from "@/lib/notify-sound";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Campus Path" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [lastPush, setLastPush] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_PUSH_KEY);
      if (raw) setLastPush(new Date(raw).toLocaleString());
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/student" aria-label="Back to profile">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <span className="ml-auto text-xs font-semibold text-primary">Settings / সেটিংস</span>
        </div>

        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {soundOn ? (
                  <Volume2 className="size-4 text-emerald" />
                ) : (
                  <VolumeX className="size-4 text-muted-foreground" />
                )}
                Notification sound / নোটিফিকেশন শব্দ
              </p>
              <p className="font-bangla mt-1 text-[11px] text-muted-foreground">
                অ্যাপ খোলা থাকলে নোটিফিকেশনের সাথে শব্দ বাজবে।
              </p>
            </div>
            <Switch
              checked={soundOn}
              aria-label="Notification sound"
              onCheckedChange={(value) => {
                setSoundOn(value);
                setSoundEnabled(value);
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Background push-এ ব্রাউজার নিজস্ব শব্দ ব্যবহার করে — এখানে শুধু অ্যাপ-খোলা অবস্থার শব্দ নিয়ন্ত্রিত
            হয়।
          </p>
          {lastPush && (
            <p className="flex items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <BellRing className="size-3.5" /> Last push / শেষ নোটিফিকেশন: {lastPush}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
