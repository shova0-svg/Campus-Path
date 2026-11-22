import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, ExternalLink, Mail, Phone, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  groupTeachers,
  phoneHref,
  searchTeachers,
  allTeachers,
  TEACHER_SOURCE,
  teacherId,
  type Teacher,
  type TeacherStore,
} from "@/lib/teachers";
import { teachersResource } from "@/lib/resources";

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
  const allGroups = useMemo(() => groupTeachers(teachers), [teachers]);
  const results = useMemo(() => searchTeachers(teachers, query), [teachers, query]);
  const groups = useMemo(() => groupTeachers(results), [results]);
  const shown = activeDepartment ? groups.filter((g) => g.key === activeDepartment) : groups;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link to="/">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <ArrowLeft /> Back to home
          </Button>
        </Link>
        <a href={TEACHER_SOURCE} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            Source <ExternalLink className="size-3.5" />
          </Button>
        </a>
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
            <ul className="space-y-2.5">
              {group.teachers.map((teacher) => (
                <TeacherCard key={teacherId(teacher)} teacher={teacher} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
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
    </li>
  );
}
