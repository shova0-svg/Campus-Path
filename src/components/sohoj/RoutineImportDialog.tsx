import { useState } from "react";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileUp,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoutineEditor } from "./RoutineEditor";
import { supabase } from "@/integrations/supabase/client";
import { DEPARTMENT_OPTIONS } from "@/lib/teachers";
import { INSTITUTES } from "@/lib/campus-data";
import type { ClassRoutine } from "@/lib/routine";
import type { Teacher } from "@/lib/teachers";
import {
  buildImportedRoutine,
  CSV_TEMPLATE,
  missingRoomsFromRoutine,
  parseCsv,
  validateImportedRoutine,
  type Warning,
} from "@/lib/routine-import";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instituteId: string;
  teachers: Teacher[];
  knownRooms: string[];
  onPublish: (routine: ClassRoutine, newRooms: string[]) => void;
}

type Method = "csv" | "image";

export default function RoutineImportDialog({
  open,
  onOpenChange,
  instituteId,
  teachers,
  knownRooms,
  onPublish,
}: Props) {
  const [method, setMethod] = useState<Method>("csv");
  const [csv, setCsv] = useState("");
  const [meta, setMeta] = useState({
    department: DEPARTMENT_OPTIONS[1]?.english ?? "Computer Science & Technology",
    semester: "1",
    group: "A",
    shift: "Morning",
  });
  const [draft, setDraft] = useState<ClassRoutine | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sohoj-routine-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function buildFromCsv(text: string) {
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setError("CSV-empty — add at least one class row / CSV খালি");
      return;
    }
    const routine = buildImportedRoutine(
      instituteId,
      {
        ...meta,
        semester: Number(meta.semester),
        title: `${meta.department} · ${meta.shift} · Group ${meta.group}`,
      },
      rows,
    );
    setDraft(routine);
    setWarnings(validateImportedRoutine(routine, teachers, knownRooms));
    setError("");
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in first / প্রথমে লগইন করুন");
      const form = new FormData();
      form.append("file", file);
      form.append("institute_id", instituteId);
      form.append("department", meta.department);
      form.append("semester", meta.semester);
      form.append("group", meta.group);
      form.append("shift", meta.shift);
      const base = import.meta.env["VITE_SUPABASE_URL"] ?? "";
      const res = await fetch(`${base}/functions/v1/parse-routine`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
      });
      const body = (await res.json()) as { data?: ClassRoutine; error?: string };
      if (!res.ok || !body.data) throw new Error(body.error ?? "OCR failed");
      const routine: ClassRoutine = {
        ...body.data,
        instituteId,
        semester: Number(meta.semester),
        department: meta.department,
        group: meta.group,
        shift: meta.shift as ClassRoutine["shift"],
        title: `${meta.department} · ${meta.shift} · Group ${meta.group}`,
        source: "imported",
        verified: false,
        version: 1,
      };
      setDraft(routine);
      setWarnings(validateImportedRoutine(routine, teachers, knownRooms));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image read kora jay ni");
    } finally {
      setBusy(false);
    }
  }

  function publish(routine: ClassRoutine) {
    const errors = warnings.filter((w) => w.level === "error");
    if (errors.length > 0) {
      setError("Fix the errors above first / উপরের ভুলগুলো ঠিক করুন");
      return;
    }
    onPublish(
      { ...routine, version: routine.version ?? 1 },
      missingRoomsFromRoutine(routine, knownRooms),
    );
    onOpenChange(false);
    setDraft(null);
    setWarnings([]);
  }

  const institute = INSTITUTES.find((i) => i.id === instituteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl p-0">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle>Import routine</DialogTitle>
          <DialogDescription className="font-bangla">
            CSV paste/upload বা ছবি থেকে ২-৩ মিনিটে পুরো রুটিন যোগ করুন — {institute?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Metadata required before publish */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">Department</label>
              <Select
                value={meta.department}
                onValueChange={(v) => setMeta({ ...meta, department: v })}
              >
                <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Import department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d.key} value={d.english}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">Semester</label>
              <Select
                value={meta.semester}
                onValueChange={(v) => setMeta({ ...meta, semester: v })}
              >
                <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Import semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">Group</label>
              <Select value={meta.group} onValueChange={(v) => setMeta({ ...meta, group: v })}>
                <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Import group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "None"].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">Shift</label>
              <Select value={meta.shift} onValueChange={(v) => setMeta({ ...meta, shift: v })}>
                <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Import shift">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Morning", "Evening"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!draft ? (
            <>
              <div className="flex gap-1 rounded-full bg-muted p-1">
                {(
                  [
                    ["csv", FileSpreadsheet, "CSV / paste"],
                    ["image", ImageIcon, "Image / OCR"],
                  ] as const
                ).map(([id, Icon, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${
                      method === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" /> {label}
                  </button>
                ))}
              </div>

              {method === "csv" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">Paste the table (or upload .csv)</p>
                    <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                      <Download className="size-3.5" /> Template
                    </Button>
                  </div>
                  <textarea
                    value={csv}
                    onChange={(e) => setCsv(e.target.value)}
                    rows={8}
                    placeholder={CSV_TEMPLATE}
                    className="w-full rounded-xl border border-input bg-background p-2 font-mono text-[11px]"
                  />
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3 text-xs font-semibold text-primary">
                    <FileUp className="size-4" /> .csv upload
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) setCsv(await file.text());
                      }}
                    />
                  </label>
                  <Button variant="emerald" className="w-full" onClick={() => buildFromCsv(csv)}>
                    Review classes →
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    routine-er chobi upload korun. AI key configure na thakle friendly error dekha
                    jay.
                  </p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-xs font-semibold text-primary">
                    {busy ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <ImageIcon className="size-5" />
                    )}
                    Image upload (max 4MB)
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImage(e.target.files?.[0])}
                    />
                  </label>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-primary/20 bg-primary-soft/50 p-3">
                <p className="text-xs font-semibold">
                  Review — {draft.entries.length} classes · {warnings.length} checks
                </p>
                <p className="font-bangla mt-0.5 text-[11px] text-muted-foreground">
                  ভুলগুলো ঠিক করে Publish চাপুন। সব রুম অটো তৈরি হবে।
                </p>
                {warnings.length > 0 && (
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                    {warnings.map((w, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-1.5 text-[11px] ${
                          w.level === "error" ? "text-destructive" : "text-amber-700"
                        }`}
                      >
                        <AlertTriangle className="mt-0.5 size-3 shrink-0" /> {w.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <RoutineEditor
                instituteId={instituteId}
                initial={draft}
                hideParser
                publishLabel="Publish routine"
                onSave={publish}
                onCancel={() => {
                  setDraft(null);
                  setWarnings([]);
                }}
              />
            </>
          )}

          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
