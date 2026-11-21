import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, Clock3, DoorOpen, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTITUTES } from "@/lib/campus-data";
import {
  currentClasses,
  DAY_ORDER,
  parseRoutineStore,
  ROUTINE_STORE_KEY,
  type ClassRoutine,
  type RoutineEntry,
} from "@/lib/routine";

function slotTime(routine: ClassRoutine, entry: RoutineEntry): string {
  const first = routine.periods.find((p) => p.id === entry.period)?.time.split(/\s*[-–]\s*/)[0];
  const last = routine.periods.find((p) => p.id === entry.endPeriod)?.time.split(/\s*[-–]\s*/)[1];
  return first && last ? `${first} – ${last}` : (first ?? "");
}

export function LiveClasses() {
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    try {
      setRoutines(parseRoutineStore(window.localStorage.getItem(ROUTINE_STORE_KEY)));
    } catch {
      setRoutines(parseRoutineStore(null));
    }
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const day = DAY_ORDER[now.getDay()];
  const live = currentClasses(routines, now);
  const today = routines.flatMap((r) =>
    r.entries.filter((e) => e.day === day).map((e) => ({ routine: r, entry: e })),
  );
  const upcoming = today
    .filter(({ entry }) => entry.period * 100 > now.getHours() * 100 + now.getMinutes())
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <ArrowLeft /> Back to home
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => setNow(new Date())}
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"
        >
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="bg-hero px-5 py-5 text-primary-foreground">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
            <CalendarClock className="size-3.5" /> Right now on campus
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold">এখন কী চলছে</h1>
          <p className="mt-1 text-xs text-primary-foreground/75">
            {day} · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
            {live.length} classes running
          </p>
        </div>

        {live.length > 0 ? (
          <ul className="divide-y divide-border">
            {live.map((e) => {
              const routine = routines.find((r) => e.id.startsWith(r.id));
              return (
                <li key={e.id} className="flex items-start gap-3 p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary">
                    {e.acronym}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.subject}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <UserRound className="size-3 shrink-0" /> {e.teacher}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 font-bold text-emerald">
                        <DoorOpen className="size-3" /> Room {e.room}
                      </span>
                      {routine && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock3 className="size-3" /> P{e.period}
                          {e.endPeriod > e.period ? `–P${e.endPeriod}` : ""} ·{" "}
                          {slotTime(routine, e)}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {routine?.title ?? routine?.department} ·{" "}
                      {INSTITUTES.find((i) => i.id === routine?.instituteId)?.name}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            এখন কোনো ক্লাস চলছে না। নিচে আজকের পরের ক্লাসগুলো দেখুন।
          </p>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">আজ বাকি ক্লাস</h2>
          <ul className="mt-2 space-y-1.5">
            {upcoming.map(({ entry, routine }) => (
              <li
                key={`${routine.id}-${entry.id}`}
                className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-2 text-xs"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-[10px] font-bold text-primary">
                  {entry.acronym}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">{entry.subject}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {entry.teacher}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  P{entry.period} · {slotTime(routine, entry).split(" – ")[0]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
