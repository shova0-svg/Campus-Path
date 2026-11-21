import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  DoorOpen,
  GraduationCap,
  UserRound,
} from "lucide-react";
import { DAY_ORDER, type ClassRoutine, type RoutineEntry } from "@/lib/routine";
import { cn } from "@/lib/utils";

interface Props {
  routine: ClassRoutine;
  onSelectRoom?: (room: string) => void;
}

function slotTime(routine: ClassRoutine, entry: RoutineEntry): string {
  const first = routine.periods.find((p) => p.id === entry.period)?.time.split(/\s*[-–]\s*/)[0];
  const last = routine.periods.find((p) => p.id === entry.endPeriod)?.time.split(/\s*[-–]\s*/)[1];
  return first && last ? `${first} – ${last}` : (first ?? "");
}

export function RoutineView({ routine, onSelectRoom }: Props) {
  const days = DAY_ORDER.filter((d) => routine.entries.some((e) => e.day === d));
  const today = DAY_ORDER[new Date().getDay()];
  const [activeDay, setActiveDay] = useState<string>(
    today && days.includes(today) ? today : (days[0] ?? "Sunday"),
  );

  useEffect(() => {
    setActiveDay(today && days.includes(today) ? today : (days[0] ?? "Sunday"));
  }, [routine.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const entries = routine.entries
    .filter((e) => e.day === activeDay)
    .sort((a, b) => a.period - b.period);
  const subjects = [...new Map(routine.entries.map((e) => [e.code, e])).values()];

  return (
    <section className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="bg-hero px-5 py-5 text-primary-foreground">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
          <CalendarDays className="size-3.5" /> Class routine
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold leading-tight">{routine.title}</h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-primary-foreground/80">
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1">
            Started {routine.classStart}
          </span>
          {routine.classLoad != null && (
            <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1">
              Load {routine.classLoad}
            </span>
          )}
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1">
            {routine.entries.length} classes
          </span>
          {!routine.verified && (
            <span className="rounded-full bg-landmark px-2.5 py-1 font-bold text-primary-foreground">
              Verify in Admin Panel
            </span>
          )}
        </div>
      </div>

      {/* Day picker */}
      <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 [scrollbar-width:none]">
        {days.map((day) => {
          const count = routine.entries.filter((e) => e.day === day).length;
          const active = day === activeDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {day.slice(0, 3)}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[9px]",
                  active ? "bg-primary-foreground/20" : "bg-card",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day timeline */}
      <div className="space-y-2.5 p-4">
        {entries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            আজ কোনো ক্লাস নেই।
          </p>
        ) : (
          entries.map((e, i) => (
            <div
              key={e.id}
              className="animate-rise flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft px-1 py-2 text-primary">
                <span className="text-sm font-bold">P{e.period}</span>
                {e.endPeriod > e.period && (
                  <span className="text-[9px] font-semibold">–P{e.endPeriod}</span>
                )}
                <span className="mt-1 w-full border-t border-primary/20 pt-1 text-center text-[8px] font-medium">
                  {slotTime(routine, e).split(" – ")[0]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                    {e.acronym}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{e.subject}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                  <UserRound className="size-3 shrink-0" /> {e.teacher}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{e.code}</span>
                  {e.room && (
                    <button
                      type="button"
                      onClick={() => onSelectRoom?.(e.room)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-bold text-emerald"
                    >
                      <DoorOpen className="size-3" /> {e.room}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full week + subjects, kept intact */}
      <details className="group border-t border-border">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold text-primary">
          Full week grid + subjects
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="overflow-x-auto px-4 pb-3">
          <table className="w-full min-w-[560px] border-collapse text-center text-[11px]">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground">
                <th className="sticky left-0 z-10 w-16 border-b border-r border-border bg-muted/60 px-1 py-2 font-semibold">
                  Day
                </th>
                {routine.periods.map((p) => (
                  <th
                    key={p.id}
                    className="border-b border-r border-border px-1 py-1.5 font-semibold"
                  >
                    <span className="block text-xs text-foreground">{p.label}</span>
                    <span className="block text-[9px] font-normal">{p.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_ORDER.filter((d) => routine.entries.some((e) => e.day === d)).map((day) => (
                <tr key={day}>
                  <th className="sticky left-0 z-10 border-b border-r border-border bg-card px-1 py-1.5 text-left text-[10px] font-semibold text-foreground">
                    {day.slice(0, 3)}
                  </th>
                  {routine.periods.map((p) => {
                    const entry = routine.entries.find(
                      (e) => e.day === day && p.id >= e.period && p.id <= e.endPeriod,
                    );
                    if (!entry)
                      return (
                        <td
                          key={p.id}
                          className="border-b border-r border-border px-0.5 py-1.5 text-muted-foreground/40"
                        >
                          —
                        </td>
                      );
                    if (entry.period !== p.id)
                      return (
                        <td
                          key={p.id}
                          className="border-b border-r border-border bg-primary-soft/40"
                        />
                      );
                    return (
                      <td
                        key={p.id}
                        colSpan={entry.endPeriod - entry.period + 1}
                        className="border-b border-r border-border p-1 align-top"
                      >
                        <div className="rounded-lg bg-primary-soft px-1 py-1 text-left">
                          <span className="block truncate font-bold text-primary">
                            {entry.acronym}
                          </span>
                          <span className="block truncate font-mono text-[9px] text-muted-foreground">
                            {entry.code}
                          </span>
                          {entry.room && (
                            <span className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] font-semibold text-emerald">
                              <DoorOpen className="size-2.5 shrink-0" /> {entry.room}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <GraduationCap className="size-3.5 text-primary" /> Subjects & teachers (
            {subjects.length})
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {subjects.map((e) => (
              <li key={e.code} className="rounded-xl bg-muted/60 px-2.5 py-2 text-[11px]">
                <span className="block truncate font-semibold">{e.subject}</span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-muted-foreground">
                  <UserRound className="size-3 shrink-0" /> {e.teacher}
                  <span className="ml-auto font-mono text-[9px]">{e.code}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <div className="flex items-center gap-1.5 border-t border-border bg-muted/30 px-4 py-2.5 text-[10px] text-muted-foreground">
        <Clock3 className="size-3" /> Period times follow the institute notice board · tap a room to
        see its classes
      </div>
    </section>
  );
}
