import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  Building2,
  ExternalLink,
  Flag,
  Mail,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  groupTeachers,
  phoneHref,
  searchTeachers,
  allTeachers,
  TEACHER_SOURCE,
  TEACHERS,
  teacherId,
  type Teacher,
  type TeacherStore,
} from "@/lib/teachers";
import { teachersResource } from "@/lib/resources";
import { openFeedback } from "@/lib/feedback";
import { scheduleByTeacherId } from "@/lib/routine-teachers";
import { format12 } from "@/lib/routine";
import type { TeacherSchedule } from "@/lib/routine-teachers";

interface Props {
  instituteName: string;
}

export function TeacherDirectory({ instituteName }: Props) {
  const [store, setStore] = useState<TeacherStore>(() =>
    teachersResource.get().reduce<TeacherStore>((acc, t) => {
      const id = t.instituteId ?? "rpi";
      (acc[id] ??= []).push(t);
      return acc;
    }, {}),
  );
  const [query, setQuery] = useState("");
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () =>
      setStore(
        teachersResource.get().reduce<TeacherStore>((acc, t) => {
          const id = t.instituteId ?? "rpi";
          (acc[id] ??= []).push(t);
          return acc;
        }, {}),
      );
    return teachersResource.subscribe(refresh);
  }, []);

  const teachers = useMemo(() => allTeachers(store), [store]);
  const directory = useMemo(
    () => [...new Map([...TEACHERS, ...teachers].map((t) => [teacherId(t), t])).values()],
    [teachers],
  );
  const schedules = useMemo(() => scheduleByTeacherId(directory), [directory]);
  const allGroups = useMemo(() => groupTeachers(teachers), [teachers]);
  const results = useMemo(() => searchTeachers(teachers, query), [teachers, query]);
  const groups = useMemo(() => groupTeachers(results), [results]);
  const shown = activeDepartment ? groups.filter((g) => g.key === activeDepartment) : groups;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeft /> Back to home
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={TEACHER_SOURCE} target="_blank" rel="noopener noreferrer">
            Source <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>

      <section className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="bg-hero px-5 py-5 text-primary-foreground">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
            <UserRound className="size-3.5" /> Faculty directory
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold">শিক্ষকবৃন্দ</h1>
          <p className="mt-1 text-xs text-primary-foreground/75">
            {instituteName} · {teachers.length} teachers · {allGroups.length} departments
          </p>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveDepartment(null);
              }}
              placeholder="নাম, পদবি, ইমেইল বা রুম খুঁজুন…"
              aria-label="Search teachers"
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveDepartment(null)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                !activeDepartment
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              All ({results.length})
            </button>
            {allGroups.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveDepartment(g.key)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeDepartment === g.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {g.key.replace("-", " ")} ({g.teachers.length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {shown.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          কোনো শিক্ষক পাওয়া যায়নি।
        </p>
      ) : (
        shown.map((group) => (
          <section key={group.key} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Building2 className="size-3.5 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
                {group.label}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {group.teachers.length}
              </span>
            </div>
            <ul className="grid-cols-1 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.teachers.map((teacher) => (
                <TeacherCard
                  key={teacherId(teacher)}
                  teacher={teacher}
                  schedule={schedules.get(teacherId(teacher))}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function TeacherCard({
  teacher,
  schedule,
}: {
  teacher: Teacher;
  schedule?: (TeacherSchedule & { routineName: string }) | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="animate-rise flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-card)]">
      {teacher.photo ? (
        <img
          src={teacher.photo}
          alt={teacher.name}
          loading="lazy"
          className="size-16 shrink-0 rounded-xl bg-muted object-cover"
        />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <UserRound className="size-6" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{teacher.name}</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{teacher.designation}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {teacher.mobile && (
            <a
              href={phoneHref(teacher.mobile)}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-semibold text-emerald"
            >
              <Phone className="size-3" /> {teacher.mobile}
            </a>
          )}
          {teacher.email && (
            <a
              href={`mailto:${teacher.email}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary"
            >
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{teacher.email}</span>
            </a>
          )}
          {teacher.room && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Room {teacher.room}
            </span>
          )}
        </div>
      </div>
      {schedule && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 self-start rounded-lg bg-primary-soft px-2 py-1.5 text-[10px] font-bold text-primary"
        >
          Classes / ক্লাস
        </button>
      )}
      <button
        type="button"
        aria-label={`Report wrong info about ${teacher.name}`}
        onClick={() =>
          openFeedback({
            category: "wrong_routine",
            message: `Teacher ${teacher.name} — `,
            page: "teachers",
          })
        }
        className="shrink-0 self-start rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
      >
        <Flag className="size-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader className="text-left">
            <DialogTitle>{teacher.name} · Classes / ক্লাস</DialogTitle>
            <DialogDescription className="font-bangla">
              সব রুটিন থেকে weekly schedule — {schedule?.classes.length ?? 0} ক্লাস
            </DialogDescription>
          </DialogHeader>
          {schedule?.now && (
            <p className="rounded-xl bg-emerald-soft px-3 py-2 text-xs font-bold text-emerald">
              Now in room {schedule.now.room} / এখন {schedule.now.room} রুমে · {schedule.now.subject}
            </p>
          )}
          {schedule?.next && !schedule.now && (
            <p className="rounded-xl bg-primary-soft px-3 py-2 text-xs font-semibold text-primary">
              Next class / পরের ক্লাস: {schedule.next.subject} · Room {schedule.next.room} ·{" "}
              {format12(schedule.next.startMinute)}
            </p>
          )}
          <ul className="max-h-72 space-y-1.5 overflow-y-auto">
            {schedule?.classes.map((c, i) => (
              <li key={i} className="rounded-xl bg-muted/60 px-2.5 py-2 text-[11px]">
                <span className="font-semibold">{c.subject}</span>
                <span className="ml-1.5 rounded-full bg-card px-1.5 text-[9px] text-muted-foreground">
                  Sem {c.semester} · {c.acronym}
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  {c.day} · P{c.period}
                  {c.endPeriod > c.period ? `-${c.endPeriod}` : ""} · {c.time12} · Room {c.room}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </li>
  );
}
