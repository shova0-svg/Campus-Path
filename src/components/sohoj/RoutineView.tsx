import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  DoorOpen,
  GraduationCap,
  UserRound,
} from "lucide-react";
import {
  blocksForDay,
  DAYS,
  dhakaNow,
  format12,
  PERIOD_TIMES,
  PERIODS,
  resolveBlock,
  type Block,
  type Day,
  type Period,
  type Routine,
  type Subject,
} from "@/lib/routine";
import { cn } from "@/lib/utils";

interface Props {
  routine: Routine;
  onSelectRoom?: (room: string) => void;
}

const DAY_LABEL: Record<Day, string> = {
  Sun: "Sunday / রবি",
  Mon: "Monday / সোম",
  Tue: "Tuesday / মঙ্গল",
  Wed: "Wednesday / বুধ",
  Thu: "Thursday / বৃহস্পতি",
};

function ordinal(n: number): string {
  const suffix = n === 1 ? "st" : n === 3 ? "rd" : "th";
  return `${n}${suffix}`;
}

function blockAt(routine: Routine, day: Day, period: Period): Block | undefined {
  return routine.blocks.find(
    (b) => b.day === day && b.startPeriod <= period && period <= b.endPeriod,
  );
}

function cellValue(value: number | null): string {
  return value == null ? "-" : String(value);
}

function SubjectTable({ subjects }: { subjects: Subject[] }) {
  const heads = [
    "S.N",
    "Code",
    "Subject",
    "Teacher",
    "Acronym",
    "T",
    "P",
    "C",
    "Theory cont.",
    "Theory final",
    "Practical cont.",
    "Practical final",
    "Total",
  ];
  return (
    <div className="overflow-x-auto px-4 pb-4">
      <table className="w-full min-w-[900px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-muted/60 text-muted-foreground">
            {heads.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap border-b border-r border-border px-2 py-2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map((s, i) => (
            <tr key={s.code} className="border-b border-border/60">
              {[
                String(i + 1),
                s.code,
                s.name,
                s.teacher,
                s.acronym,
                cellValue(s.T),
                cellValue(s.P),
                cellValue(s.C),
                cellValue(s.theoryContinuous),
                cellValue(s.theoryFinal),
                cellValue(s.practicalContinuous),
                cellValue(s.practicalFinal),
                String(s.total),
              ].map((value, j) => (
                <td
                  key={j}
                  className={cn("whitespace-nowrap px-2 py-2", j === 2 ? "font-semibold" : "")}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RoutineView({ routine, onSelectRoom }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [activeDay, setActiveDay] = useState<Day>(() => {
    const d = dhakaNow().day;
    return d ?? "Sun";
  });
  const [weekOpen, setWeekOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);

  useEffect(() => {
    const d = dhakaNow().day;
    setActiveDay(d ?? "Sun");
    const timer = window.setInterval(() => {
      const current = dhakaNow();
      setNow(new Date());
      setActiveDay(current.day ?? "Sun");
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const isWeekend = dhakaNow(now).day === null;
  const today = dhakaNow(now).day;
  const todayBlocks = activeDay === today ? blocksForDay(routine, activeDay) : [];
  const currentBlock = todayBlocks.find(
    (b) => nowMinutes(now) >= b.startMinute && nowMinutes(now) <= b.endMinute,
  );
  const nextBlock = todayBlocks.find(
    (b) => b.startMinute >= (currentBlock?.endMinute ?? nowMinutes(now)),
  );
  const classStart = new Date(`${routine.classStart}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <section className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
      {/* 1. Header */}
      <div className="bg-hero px-5 py-5 text-primary-foreground">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
          <CalendarDays className="size-3.5" /> Class routine / ক্লাস রুটিন
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold leading-tight">
          Department of Computer Science &amp; Technology
        </h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-primary-foreground/80">
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1">
            {ordinal(routine.semester)} Semester (1st Shift)
          </span>
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1">
            Class Start: {classStart}
          </span>
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1">
            Class Load: {routine.classLoad}
          </span>
          <span className="rounded-full bg-emerald/20 px-2.5 py-1 font-semibold text-emerald">
            Today: {today ?? (isWeekend ? "Weekend" : "—")}
          </span>
        </div>
      </div>

      {/* 2. Day tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 [scrollbar-width:none]">
        {DAYS.map((day) => {
          const active = day === activeDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {isWeekend && (
        <p className="font-bangla border-b border-border bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
          আজ ক্লাস নেই / No classes today — showing Sunday
        </p>
      )}

      {/* 3. Day timeline (all 7 periods) */}
      <div className="space-y-2 p-4">
        {PERIODS.map((period) => {
          const block = blockAt(routine, activeDay, period);
          if (!block) {
            return (
              <div
                key={`free-${period}`}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-3.5 py-2.5"
              >
                <span className="w-14 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                  P{period}
                </span>
                <span className="font-bangla text-xs text-muted-foreground">
                  Free / কোনো ক্লাস নেই · {PERIOD_TIMES[period]}
                </span>
              </div>
            );
          }
          if (block.startPeriod !== period) return null;

          const resolved = resolveBlock(routine, block);
          const isNow = currentBlock?.block === block;
          const isNext = nextBlock?.block === block;
          return (
            <div
              key={`${block.day}-${block.startPeriod}`}
              className={cn(
                "animate-rise rounded-2xl border p-3 shadow-[var(--shadow-card)]",
                isNow ? "border-emerald bg-emerald-soft/40" : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Clock3 className="size-3.5" />
                  {block.startPeriod === block.endPeriod
                    ? `Period ${block.startPeriod}`
                    : `Period ${block.startPeriod}-${block.endPeriod}`}
                  <span className="font-normal text-muted-foreground">| {resolved.time12}</span>
                </div>
                {isNow && (
                  <span className="rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold text-emerald-foreground">
                    Now
                  </span>
                )}
                {isNext && !isNow && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Next
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-start gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                  {resolved.subject.acronym}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{resolved.subject.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                    <UserRound className="size-3 shrink-0" /> {resolved.subject.teacher}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {resolved.subject.code}
                    </span>
                    {block.room && (
                      <button
                        type="button"
                        onClick={() => onSelectRoom?.(block.room)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-bold text-emerald"
                      >
                        <DoorOpen className="size-3" /> {block.room}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Full week grid */}
      <details className="group border-t border-border" open={weekOpen}>
        <summary
          className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold text-primary"
          onClick={(e) => {
            e.preventDefault();
            setWeekOpen((v) => !v);
          }}
        >
          Full week / পুরো সপ্তাহ
          <ChevronDown className={cn("size-4 transition-transform", weekOpen && "rotate-180")} />
        </summary>
        <div className="overflow-x-auto px-4 pb-3">
          <table className="w-full min-w-[600px] border-collapse text-center text-[11px]">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground">
                <th className="sticky left-0 z-10 w-12 border-b border-r border-border bg-muted/60 px-1 py-2 font-semibold">
                  Day
                </th>
                {PERIODS.map((p) => (
                  <th key={p} className="border-b border-r border-border px-1 py-1.5 font-semibold">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <th className="sticky left-0 z-10 border-b border-r border-border bg-card px-1 py-1.5 text-left text-[10px] font-semibold">
                    {day}
                  </th>
                  {PERIODS.map((p) => {
                    const block = blockAt(routine, day, p);
                    if (!block)
                      return (
                        <td
                          key={p}
                          className="border-b border-r border-border py-1.5 text-muted-foreground/40"
                        >
                          X
                        </td>
                      );
                    if (block.startPeriod !== p)
                      return (
                        <td
                          key={p}
                          className="border-b border-r border-border bg-primary-soft/40"
                        />
                      );
                    const s = resolveBlock(routine, block).subject;
                    return (
                      <td
                        key={p}
                        colSpan={block.endPeriod - block.startPeriod + 1}
                        className="border-b border-r border-border p-1 align-top"
                      >
                        <div className="rounded-lg bg-primary-soft px-1 py-1 text-left">
                          <span className="block truncate font-bold text-primary">{s.acronym}</span>
                          <span className="block truncate font-mono text-[9px] text-muted-foreground">
                            {s.code}
                          </span>
                          <span className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] font-semibold text-emerald">
                            <DoorOpen className="size-2.5 shrink-0" /> {block.room}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* 5. Subjects table */}
      <details className="group border-t border-border" open={subjectsOpen}>
        <summary
          className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold text-primary"
          onClick={(e) => {
            e.preventDefault();
            setSubjectsOpen((v) => !v);
          }}
        >
          <span className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5" /> Subjects ({routine.subjects.length})
          </span>
          <ChevronDown
            className={cn("size-4 transition-transform", subjectsOpen && "rotate-180")}
          />
        </summary>
        <SubjectTable subjects={routine.subjects} />
      </details>

      <div className="flex items-center gap-1.5 border-t border-border bg-muted/30 px-4 py-2.5 text-[10px] text-muted-foreground">
        <Clock3 className="size-3" /> Period times 1st shift · Asia/Dhaka (UTC+6) · tap a room to
        see its classes
      </div>
    </section>
  );
}

function nowMinutes(now: Date): number {
  return dhakaNow(now).minute;
}
