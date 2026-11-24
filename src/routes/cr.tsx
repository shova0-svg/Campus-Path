import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Pencil, Plus, Send, Trash2, Zap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCrRole } from "@/hooks/use-cr-role";
import {
  dateLabel,
  dhakaDate,
  isActive,
  sortUpdates,
  UPDATE_TYPES,
  validateUpdate,
  type ClassKey,
  type ClassUpdate,
  type UpdateType,
} from "@/lib/class-updates";
import {
  classUpdatesResource,
  createUpdate,
  softDeleteUpdate,
  updateUpdate,
} from "@/lib/repo/classUpdates";
import { ROUTINES } from "@/lib/routine";
import { toast } from "sonner";

export const Route = createFileRoute("/cr")({
  head: () => ({
    meta: [
      { title: "CR Section — Campus Path" },
      { name: "description", content: "Class representative updates for your class." },
    ],
  }),
  component: CrPage,
});

function tomorrow(): string {
  const d = new Date(`${dhakaDate()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function CrPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loading: crLoading, assignments, isCr } = useCrRole();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) window.location.replace("/auth?next=/cr");
  }, [authLoading, user, navigate]);

  const assignment = assignments[selected] ?? assignments[0] ?? null;
  const classKey = useMemo<ClassKey | null>(
    () =>
      assignment
        ? {
            instituteId: assignment.instituteId,
            department: assignment.department,
            semester: assignment.semester,
            shift: assignment.shift,
          }
        : null,
    [assignment?.id],
  );

  const resource = useMemo(() => (classKey ? classUpdatesResource(classKey) : null), [classKey]);
  const [mine, setMine] = useState<ClassUpdate[]>([]);
  useEffect(() => {
    if (!resource) return;
    setMine(resource.get());
    void resource.refresh();
    return resource.subscribe(setMine);
  }, [resource]);

  const routine = ROUTINES.find(
    (r) => r.semester === assignment?.semester && r.shift === assignment?.shift,
  );

  const [type, setType] = useState<UpdateType | "">("");
  const [subjectCode, setSubjectCode] = useState("");
  const [eventDate, setEventDate] = useState(tomorrow);
  const [eventTime, setEventTime] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<ClassUpdate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClassUpdate | null>(null);

  function prefill(kind: "off" | "ct") {
    setType(kind === "off" ? "class_off" : "class_test");
    setEventDate(tomorrow());
    setTitle(kind === "off" ? "কাল ক্লাস বন্ধ / Class off tomorrow" : "কাল CT / CT tomorrow");
    setBody("");
    setUrgent(kind === "off");
  }

  async function post() {
    if (!classKey || !resource) return;
    const check = validateUpdate({ type, title, body, eventDate, eventTime, urgent });
    if (Object.keys(check.errors).length > 0) {
      setNotice(Object.values(check.errors)[0] ?? "");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      if (editing) {
        await updateUpdate(editing.id, {
          type: type as UpdateType,
          subjectCode,
          eventDate,
          eventTime,
          title,
          body,
          urgent,
        });
        toast.success("Update edited");
      } else {
        await createUpdate({
          ...classKey,
          type: type as UpdateType,
          ...(subjectCode ? { subjectCode } : {}),
          eventDate,
          ...(eventTime ? { eventTime } : {}),
          title,
          ...(body ? { body } : {}),
          urgent,
        });
        toast.success("Update posted");
      }
      setTitle("");
      setBody("");
      setType("");
      setEditing(null);
      await resource.refresh();
    } catch {
      toast.error("Internet দরকার / Internet needed to post");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || crLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-desk text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  if (!isCr || !assignment) {
    return (
      <div className="bg-desk min-h-dvh px-4 pb-28 pt-6">
        <main className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-3xl">📋</p>
          <h1 className="mt-3 font-display text-xl font-semibold">আপনি CR নন</h1>
          <p className="mt-1 text-sm text-muted-foreground">You are not a CR for any class.</p>
          <Button className="mt-5" asChild>
            <Link to="/">
              <ArrowLeft /> Home
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const shown = sortUpdates(mine.filter((u) => isActive(u))).filter(
    (u) =>
      u.department === assignment.department &&
      u.semester === assignment.semester &&
      u.shift === assignment.shift,
  );

  return (
    <div className="bg-desk min-h-dvh px-4 pb-28 pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link to="/">
              <ArrowLeft /> Home
            </Link>
          </Button>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">
            CR SECTION
          </span>
        </div>

        <section className="rounded-3xl bg-hero px-5 py-5 text-primary-foreground">
          <h1 className="font-display text-lg font-semibold">
            CR of {assignment.department} · {assignment.semester}th Semester (
            {assignment.shift === 1 ? "1st" : "2nd"} Shift)
          </h1>
          <p className="font-bangla mt-1 text-xs text-primary-foreground/75">
            ক্লাস আপডেট পোস্ট করুন — শুধু আপনার ক্লাসের শিক্ষার্থীরা দেখতে পাবেন।
          </p>
        </section>

        {assignments.length > 1 && (
          <Select value={String(selected)} onValueChange={(v) => setSelected(Number(v))}>
            <SelectTrigger className="h-11 rounded-xl bg-card" aria-label="Choose CR class">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((a, i) => (
                <SelectItem key={a.id} value={String(i)}>
                  {a.department} · Sem {a.semester} · {a.shift === 1 ? "1st" : "2nd"} Shift
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => prefill("off")}>
              কাল ক্লাস বন্ধ / Class off
            </Button>
            <Button size="sm" variant="outline" onClick={() => prefill("ct")}>
              কাল CT / CT tomorrow
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={type} onValueChange={(v) => setType(v as UpdateType)}>
              <SelectTrigger className="h-10 rounded-xl" aria-label="Update type">
                <SelectValue placeholder="Type / ধরন" />
              </SelectTrigger>
              <SelectContent>
                {UPDATE_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subjectCode} onValueChange={setSubjectCode}>
              <SelectTrigger
                className="h-10 rounded-xl [&>span]:truncate"
                aria-label="Update subject"
              >
                <SelectValue placeholder="সব ক্লাস / All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">সব ক্লাস / All classes</SelectItem>
                {routine?.subjects.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              aria-label="Event date"
              className="h-10 rounded-xl"
            />
            <Input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              aria-label="Event time"
              className="h-10 rounded-xl"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <label htmlFor="cr-title">Title / শিরোনাম</label>
              <span>{title.length}/100</span>
            </div>
            <Input
              id="cr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <label htmlFor="cr-body">Message / বার্তা</label>
              <span>{body.length}/1000</span>
            </div>
            <Input
              id="cr-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            <Zap className="size-3.5 text-amber-500" /> Urgent / জরুরি
          </label>
          {notice && <p className="text-[11px] text-destructive">{notice}</p>}
          <Button variant="emerald" className="w-full" onClick={post} disabled={busy}>
            <Send className="size-4" />{" "}
            {busy ? "Posting…" : editing ? "Save changes" : "Post update"}
          </Button>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Your posted updates ({shown.length})</h2>
          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
              Ekhono kono update nei.
            </p>
          ) : (
            shown.map((u) => (
              <div key={u.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.urgent ? "bg-destructive/15 text-destructive" : "bg-primary-soft text-primary"}`}
                  >
                    {UPDATE_TYPES.find((t) => t.id === u.type)?.label ?? u.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {dateLabel(u.eventDate)}
                  </span>
                  {u.updatedAt !== u.createdAt && (
                    <span className="text-[10px] text-muted-foreground">edited</span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold">{u.title}</p>
                {u.body && (
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                    {u.body}
                  </p>
                )}
                <div className="mt-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(u);
                      setType(u.type);
                      setSubjectCode(u.subjectCode ?? "");
                      setEventDate(u.eventDate ?? "");
                      setEventTime(u.eventTime ?? "");
                      setTitle(u.title);
                      setBody(u.body ?? "");
                      setUrgent(u.urgent);
                    }}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(u)}>
                    <Trash2 className="size-3.5 text-destructive" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this update?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.title} will be hidden from students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (pendingDelete)
                  void softDeleteUpdate(pendingDelete.id).then(() => resource?.refresh());
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
