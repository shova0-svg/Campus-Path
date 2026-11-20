import { Clock3, DoorOpen, GraduationCap, UserRound } from "lucide-react";
import { DAY_ORDER, type ClassRoutine } from "@/lib/routine";

interface Props {
  routine: ClassRoutine;
  onSelectRoom?: (room: string) => void;
}

export function RoutineView({ routine, onSelectRoom }: Props) {
  const activeDays = DAY_ORDER.filter((d) => routine.entries.some((e) => e.day === d));
  const bySlot = (day: string, period: number) =>
    routine.entries.find((e) => e.day === day && period >= e.period && period <= e.endPeriod);

  return (
    <section className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Class routine
        </p>
        <h2 className="mt-0.5 text-base font-semibold leading-tight">{routine.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3" /> Started {routine.classStart}
          </span>
          {routine.classLoad != null && <span>Load: {routine.classLoad}</span>}
          <span>{routine.entries.length} classes</span>
          {!routine.verified && (
            <span className="rounded-full bg-landmark-soft px-2 py-0.5 font-semibold text-landmark">
              Verify in Admin Panel
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {activeDays.map((day) => (
              <tr key={day}>
                <th className="sticky left-0 z-10 border-b border-r border-border bg-card px-1 py-1.5 text-left text-[10px] font-semibold text-foreground">
                  {day.slice(0, 3)}
                </th>
                {routine.periods.map((p) => {
                  const entry = bySlot(day, p.id);
                  const isStart = entry?.period === p.id;
                  if (!entry) {
                    return (
                      <td
                        key={p.id}
                        className="border-b border-r border-border px-0.5 py-1.5 text-muted-foreground/40"
                      >
                        —
                      </td>
                    );
                  }
                  if (!isStart)
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
                      <button
                        type="button"
                        onClick={() => entry.room && onSelectRoom?.(entry.room)}
                        className="h-full w-full rounded-lg bg-primary-soft px-1 py-1 text-left transition-colors hover:bg-primary/10"
                        title={`${entry.subject} · ${entry.teacher} · Room ${entry.room}`}
                      >
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
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="border-t border-border px-4 py-3">
        <summary className="cursor-pointer text-xs font-semibold text-primary">
          Subjects & teachers (
          {routine.entries.length ? new Set(routine.entries.map((e) => e.code)).size : 0})
        </summary>
        <ul className="mt-2 space-y-1.5">
          {[...new Map(routine.entries.map((e) => [e.code, e])).values()].map((e) => (
            <li key={e.code} className="rounded-xl bg-muted/60 px-2.5 py-2 text-[11px]">
              <span className="flex items-center gap-1.5 font-semibold">
                <GraduationCap className="size-3.5 text-primary" /> {e.subject}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                <UserRound className="size-3" /> {e.teacher}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
