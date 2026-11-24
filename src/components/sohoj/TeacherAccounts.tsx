import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTINES } from "@/lib/routine";
import { resolveTeacher } from "@/lib/routine-teachers";
import { TEACHERS } from "@/lib/teachers";
import {
  createTeacherAccount,
  listTeacherProfiles,
  setTeacherReminder,
  type TeacherProfileRow,
} from "@/lib/repo/teacher-profiles";

interface Props {
  instituteId: string;
}

export function TeacherAccounts({ instituteId }: Props) {
  const options = useMemo(() => {
    const map = new Map<string, { teacher: string; acronym: string; phone?: string }>();
    for (const routine of ROUTINES) {
      for (const subject of routine.subjects) {
        if (!map.has(subject.teacher))
          map.set(subject.teacher, {
            teacher: subject.teacher,
            acronym: subject.acronym,
            ...(subject.teacherPhone ? { phone: subject.teacherPhone } : {}),
          });
      }
    }
    return [...map.values()];
  }, []);

  const [teacherName, setTeacherName] = useState(options[0]?.teacher ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState<TeacherProfileRow[]>([]);

  useEffect(() => {
    void listTeacherProfiles(instituteId)
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, [instituteId]);

  async function create() {
    if (!email.includes("@")) {
      setError("সঠিক email দিন / Valid email required");
      return;
    }
    setBusy(true);
    setError("");
    setPassword(null);
    try {
      const selected = options.find((o) => o.teacher === teacherName);
      const resolved = selected
        ? resolveTeacher(selected.teacher, selected.phone ?? "", TEACHERS)
        : null;
      const result = await createTeacherAccount({
        email: email.trim().toLowerCase(),
        teacherName,
        instituteId,
        ...(resolved?.id ? { directoryId: resolved.id } : {}),
      });
      setPassword(result.password);
      setEmail("");
      setProfiles(await listTeacherProfiles(instituteId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Account create hoy ni");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <div className="space-y-2 rounded-2xl border border-border p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <UserPlus className="size-3.5 text-primary" /> Create teacher account
        </p>
        <p className="text-[11px] text-muted-foreground">
          স্যারের নিজের ক্লাসের আগে Push notification যাবে — শিক্ষার্থীদের মতোই।
        </p>
        <Select value={teacherName} onValueChange={setTeacherName}>
          <SelectTrigger className="h-10 rounded-xl [&>span]:truncate" aria-label="Routine teacher">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => {
              const matched = resolveTeacher(o.teacher, o.phone ?? "", TEACHERS);
              return (
                <SelectItem key={o.teacher} value={o.teacher}>
                  {o.teacher} ({o.acronym}){matched ? ` · ${matched.name}` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teacher@example.com"
          aria-label="Teacher email"
          className="h-10 rounded-xl"
        />
        <Button variant="emerald" size="sm" className="w-full" onClick={create} disabled={busy}>
          <UserPlus className="size-4" /> {busy ? "Creating…" : "Create account"}
        </Button>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
        {password && (
          <div className="rounded-xl bg-emerald-soft p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald">
              <KeyRound className="size-3.5" /> Temporary password (copy now)
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate text-[11px]">{password}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void navigator.clipboard?.writeText(password)}
                aria-label="Copy password"
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-emerald/80">
              স্যারকে password-ta দিন — আর দেখা যাবে না।
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Teacher accounts ({profiles.length})</p>
        {profiles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
            Ekhono kono teacher account nei.
          </p>
        ) : (
          profiles.map((p) => (
            <div key={p.userId} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{p.teacherName}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {p.directoryId ? "Directory linked" : "Routine name only"}
                </span>
              </span>
              <Button
                size="sm"
                variant={p.reminderEnabled ? "emerald" : "outline"}
                onClick={() =>
                  void setTeacherReminder(p.userId, !p.reminderEnabled).then(() =>
                    setProfiles((prev) =>
                      prev.map((x) =>
                        x.userId === p.userId ? { ...x, reminderEnabled: !x.reminderEnabled } : x,
                      ),
                    ),
                  )
                }
              >
                {p.reminderEnabled ? "Reminders on" : "Reminders off"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
