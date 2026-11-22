import { ArrowRight, Clock3, Footprints, MapPin, Sparkles } from "lucide-react";
import type { Journey } from "@/lib/student";

export function JourneyCard({ journey }: { journey: Journey }) {
  const { current, next } = journey;

  return (
    <section className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="bg-hero px-5 py-5 text-primary-foreground">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
          <Sparkles className="size-3.5" /> Next Class Journey
        </p>
        <p className="font-bangla mt-1 text-xs text-primary-foreground/75">
          {journey.day} · {journey.routine.title}
        </p>
      </div>

      <div className="divide-y divide-border">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Current class ends
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {current ? current.subject : "No class right now"}
            </p>
            {current && (
              <p className="truncate text-[11px] text-muted-foreground">
                {current.teacher} · Room {current.room}
              </p>
            )}
          </div>
          <span className="shrink-0 font-display text-2xl font-bold text-primary">
            {journey.currentEndsAt ?? "--:--"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 bg-primary-soft/40 p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Next class starts
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {next ? next.subject : "No more classes today"}
            </p>
            {next && (
              <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <MapPin className="size-3 shrink-0" /> Room {next.room} · {next.teacher}
              </p>
            )}
          </div>
          <span className="shrink-0 font-display text-2xl font-bold text-primary">
            {journey.nextStartsAt ?? "--:--"}
          </span>
        </div>

        {next && (
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-soft text-emerald">
                <Footprints className="size-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Walking time
                </p>
                <p className="text-sm font-semibold">{journey.walkingMinutes} min</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Leave at
              </p>
              <p className="inline-flex items-center gap-1 font-display text-2xl font-bold text-emerald">
                <ArrowRight className="size-4" /> {journey.leaveAt ?? "--:--"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-border bg-muted/30 px-4 py-2.5 text-[10px] text-muted-foreground">
        <Clock3 className="size-3" /> Based on your routine + campus map distances
      </div>
    </section>
  );
}
