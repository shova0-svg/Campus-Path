import { safeGet } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClassUpdates } from "@/hooks/use-class-updates";
import { dateLabel, UPDATE_TYPES, type UpdateType } from "@/lib/class-updates";
import { parseStudent, STUDENT_KEY, type StudentProfile } from "@/lib/student";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "Class Updates — Campus Path" },
      { name: "description", content: "Updates posted by your class representative." },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(() =>
    parseStudent(typeof window === "undefined" ? null : safeGet(STUDENT_KEY)),
  );
  const [filter, setFilter] = useState<UpdateType | "all">("all");
  const { updates, markSeen } = useClassUpdates(profile);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const shown = useMemo(
    () => updates.filter((u) => filter === "all" || u.type === filter),
    [updates, filter],
  );
  const types = useMemo(() => {
    const present = new Set(updates.map((u) => u.type));
    return UPDATE_TYPES.filter((t) => present.has(t.id));
  }, [updates]);

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link to="/">
              <ArrowLeft /> Home
            </Link>
          </Button>
          <span className="text-xs font-semibold text-primary">Class Updates / ক্লাস আপডেট</span>
        </div>

        {!profile ? (
          <p className="rounded-3xl border border-dashed border-border bg-card p-8 text-center font-bangla text-sm text-muted-foreground">
            প্রফাইল সম্পূর্ণ করলে ক্লাস আপডেট দেখা যাবে / Complete your student profile to see updates.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              >
                All ({updates.length})
              </button>
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${filter === t.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
                >
                  {t.label.split(" / ")[0]}
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border bg-card p-8 text-center font-bangla text-sm text-muted-foreground">
                Updates are not available yet / এখনো কোনো আপডেট নেই।
              </p>
            ) : (
              <ul className="space-y-2">
                {shown.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.urgent ? "bg-destructive/15 text-destructive" : "bg-primary-soft text-primary"}`}
                      >
                        {u.urgent && <Zap className="mr-1 inline size-3" />}
                        {UPDATE_TYPES.find((t) => t.id === u.type)?.label ?? u.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {dateLabel(u.eventDate)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold">{u.title}</p>
                    {u.body && (
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                        {u.body}
                      </p>
                    )}
                    {u.subjectCode && (
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {u.subjectCode}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
