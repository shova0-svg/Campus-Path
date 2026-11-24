import { useEffect, useState } from "react";
import { Plus, Trash2, UserRoundCheck } from "lucide-react";
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
import { INSTITUTES } from "@/lib/campus-data";
import { DEPARTMENT_OPTIONS } from "@/lib/teachers";
import { ROUTINES } from "@/lib/routine";
import { crErrorMessage, isValidCrEmail, normalizeEmail } from "@/lib/class-updates";
import { addCr, listCrs, removeCr, type CrRow } from "@/lib/repo/crs";

const SEMESTERS = [...new Set(ROUTINES.map((r) => r.semester))].sort((a, b) => a - b);

export function CrAdmin({ instituteId }: { instituteId: string }) {
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState(DEPARTMENT_OPTIONS[1]?.english ?? "");
  const [semester, setSemester] = useState(String(SEMESTERS[0] ?? 1));
  const [shift, setShift] = useState("1");
  const [rows, setRows] = useState<CrRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CrRow | null>(null);

  useEffect(() => {
    void listCrs(instituteId)
      .then(setRows)
      .catch(() => setRows([]));
  }, [instituteId]);

  async function add() {
    const normalized = normalizeEmail(email);
    if (!isValidCrEmail(normalized)) {
      setError("সঠিক email দিন / Valid email required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addCr({
        email: normalized,
        instituteId,
        department,
        semester: Number(semester),
        shift: Number(shift),
      });
      setEmail("");
      setRows(await listCrs(instituteId));
    } catch (e) {
      setError(crErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <div className="space-y-2 rounded-2xl border border-border p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <UserRoundCheck className="size-3.5 text-primary" /> Assign CR / ক্লাস প্রতিনিধি
        </p>
        <p className="text-[11px] text-muted-foreground">
          verified email দিয়ে লগইন করলে স্যার/ভাই CR Section পাবেন।
        </p>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="h-10 rounded-xl [&>span]:truncate" aria-label="CR department">
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
        <div className="grid grid-cols-2 gap-2">
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="h-10 rounded-xl" aria-label="CR semester">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}th Semester
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger className="h-10 rounded-xl" aria-label="CR shift">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Shift</SelectItem>
              <SelectItem value="2">2nd Shift</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cr@example.com"
          aria-label="CR email"
          className="h-10 rounded-xl"
        />
        {error && <p className="text-[11px] text-destructive">{error}</p>}
        <Button variant="emerald" size="sm" className="w-full" onClick={add} disabled={busy}>
          <Plus className="size-4" /> {busy ? "Adding…" : "Add CR"}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Assigned CRs ({rows.length})</p>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
            Ekhono kono CR nei.
          </p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{r.email}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {r.department} · Sem {r.semester} · {r.shift === 1 ? "1st" : "2nd"} Shift
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Remove ${r.email}`}
                onClick={() => setPendingDelete(r)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this CR?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.email} will no longer post updates for that class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (pendingDelete)
                  void removeCr(pendingDelete.id).then(() => {
                    setRows((prev) => prev.filter((r) => r.id !== pendingDelete.id));
                  });
                setPendingDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
