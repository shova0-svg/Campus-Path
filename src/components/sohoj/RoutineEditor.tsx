import { useState } from "react";
import { FileUp, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PERIODS,
  DAY_ORDER,
  hasOcrEndpoint,
  parseRoutineText,
  uploadRoutineForOCR,
  type ClassRoutine,
  type DayName,
  type RoutineEntry,
  type Shift,
} from "@/lib/routine";
import { cn } from "@/lib/utils";

interface Props {
  instituteId: string;
  initial: ClassRoutine | null;
  onSave: (routine: ClassRoutine) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  /** Review mode: hide the text parser and relabel the save action. */
  hideParser?: boolean;
  publishLabel?: string;
}

function blankRoutine(instituteId: string): ClassRoutine {
  const now = new Date().toISOString();
  return {
    id: `routine-${Date.now()}`,
    instituteId,
    semester: 1,
    shift: "Morning",
    department: "Computer Science & Technology",
    title: "New routine",
    classStart: "",
    periods: DEFAULT_PERIODS,
    entries: [],
    source: "admin",
    verified: true,
    createdAt: now,
    updatedAt: now,
  };
}

const field = "h-10 rounded-xl";

export function RoutineEditor({
  instituteId,
  initial,
  onSave,
  onDelete,
  onCancel,
  hideParser = false,
  publishLabel = "Save routine",
}: Props) {
  const [draft, setDraft] = useState<ClassRoutine>(
    initial ? { ...initial } : blankRoutine(instituteId),
  );
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const patch = (p: Partial<ClassRoutine>) => setDraft((d) => ({ ...d, ...p }));
  const patchEntry = (id: string, p: Partial<RoutineEntry>) =>
    patch({ entries: draft.entries.map((e) => (e.id === id ? { ...e, ...p } : e)) });

  function autoParse() {
    if (!paste.trim()) {
      setMessage("Routine text paste koro (e.g. 'Sunday' then '1: 28533 MSU 2302')");
      return;
    }
    const entries = parseRoutineText(paste, draft.id);
    patch({
      entries,
      title:
        draft.title === "New routine"
          ? `${ordinal(draft.semester)} Semester · ${draft.shift} Shift`
          : draft.title,
    });
    setMessage(`${entries.length} ta class chine nichi. Room gulo save korle auto create hobey.`);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const result = hasOcrEndpoint() ? await uploadRoutineForOCR(file, draft.id) : null;
      if (result?.entries.length) {
        patch({
          entries: result.entries,
          classStart: result.classStart ?? draft.classStart,
          ...(result.classLoad != null ? { classLoad: result.classLoad } : {}),
          file: file.name,
          verified: false,
        });
        setMessage(`OCR-e ${result.entries.length} ta class peyechi — check kore save koro.`);
      } else {
        patch({ file: file.name, verified: false });
        setMessage(
          hasOcrEndpoint()
            ? "OCR kichu chinte parlo na — nicher text box-e paste kore auto-parse koro."
            : "Cloud OCR endpoint setup nei. File reference save hoyeche — text paste kore auto-parse koro.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "OCR failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Semester</Label>
          <Input
            type="number"
            min={1}
            max={12}
            className={field}
            value={draft.semester}
            onChange={(e) => patch({ semester: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-xs">Shift</Label>
          <select
            className={cn(field, "w-full border border-input bg-background px-2 text-sm")}
            value={draft.shift}
            onChange={(e) => patch({ shift: e.target.value as Shift })}
          >
            {["Morning", "Evening", "Day", "Night"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Department</Label>
          <Input
            className={field}
            value={draft.department}
            onChange={(e) => patch({ department: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Class start</Label>
          <Input
            className={field}
            placeholder="27-09-2026"
            value={draft.classStart}
            onChange={(e) => patch({ classStart: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Title</Label>
        <Input
          className={field}
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </div>

      {!hideParser && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <WandSparkles className="size-3.5" /> Auto routine maker
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Image/PDF upload (Cloud OCR configured hole) ba niche routine text paste koro — software
            itself subject, teacher, room chine grid banabe.
          </p>
          <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40">
            <FileUp className="size-4 text-primary" /> {draft.file ?? "Image / PDF upload"}
            <input
              type="file"
              accept="image/*,.pdf,.txt,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={4}
            placeholder={"Sunday\n1: 28533 MSU 2302\n2: 25922 NN 2106\nMonday\n1: 28533 AAM 1305"}
            className="mt-2 w-full rounded-xl border border-input bg-background p-2 font-mono text-[11px]"
          />
          <Button
            type="button"
            size="sm"
            variant="emerald"
            className="mt-2 w-full"
            onClick={autoParse}
            disabled={busy}
          >
            <Sparkles className="size-3.5" /> Auto parse & make routine
          </Button>
          {message && <p className="mt-2 text-[11px] text-muted-foreground">{message}</p>}
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold">
          Classes ({draft.entries.length}){" "}
          <span className="font-normal text-muted-foreground">— room gulo auto create hobey</span>
        </p>
        <div className="space-y-1.5">
          {draft.entries.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[3rem_2rem_3.5rem_1fr_1fr_3.5rem_1.4rem] items-center gap-1 rounded-xl bg-muted/60 p-1.5 text-[10px]"
            >
              <select
                value={e.day}
                onChange={(ev) => patchEntry(e.id, { day: ev.target.value as DayName })}
                className="rounded-md border border-border bg-background px-0.5 py-1"
              >
                {DAY_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {d.slice(0, 3)}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                max={7}
                value={e.period}
                onChange={(ev) =>
                  patchEntry(e.id, {
                    period: Number(ev.target.value),
                    endPeriod: Number(ev.target.value),
                  })
                }
                className="h-7 rounded-md px-0.5 text-center"
              />
              <Input
                value={e.acronym}
                onChange={(ev) => patchEntry(e.id, { acronym: ev.target.value })}
                className="h-7 rounded-md px-1"
              />
              <Input
                value={e.subject}
                onChange={(ev) => patchEntry(e.id, { subject: ev.target.value })}
                className="h-7 rounded-md px-1"
                placeholder="Subject"
              />
              <Input
                value={e.teacher}
                onChange={(ev) => patchEntry(e.id, { teacher: ev.target.value })}
                className="h-7 rounded-md px-1"
                placeholder="Teacher"
              />
              <Input
                value={e.room}
                onChange={(ev) => patchEntry(e.id, { room: ev.target.value })}
                className="h-7 rounded-md px-1"
                placeholder="Room"
              />
              <button
                type="button"
                aria-label="Remove class"
                onClick={() => patch({ entries: draft.entries.filter((x) => x.id !== e.id) })}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {draft.entries.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
              Ekhono kono class nei — text paste kore auto parse koro.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="emerald"
          className="flex-1"
          onClick={() =>
            onSave({
              ...draft,
              title: draft.title || `Semester ${draft.semester}`,
              updatedAt: new Date().toISOString(),
            })
          }
        >
          {publishLabel}
        </Button>
        {initial && onDelete && (
          <Button
            variant="outline"
            onClick={() => onDelete(initial.id)}
            aria-label="Delete routine"
          >
            <Trash2 />
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
