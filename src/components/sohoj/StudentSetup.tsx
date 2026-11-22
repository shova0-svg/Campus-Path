import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
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
import { INSTITUTES } from "@/lib/campus-data";
import { DEPARTMENT_OPTIONS, departmentEnglish } from "@/lib/teachers";
import { parseStudent, STUDENT_KEY, type StudentProfile } from "@/lib/student";

interface Props {
  onLogin: (profile: StudentProfile) => void;
  onEnablePush?: () => Promise<string | null>;
}

export function StudentSetup({ onLogin, onEnablePush }: Props) {
  const { user, displayName } = useAuth();
  const [name, setName] = useState(displayName ?? "");
  const [instituteId, setInstituteId] = useState(INSTITUTES[0]?.id ?? "rpi");
  const [department, setDepartment] = useState(DEPARTMENT_OPTIONS[1]?.english ?? "");
  const [semester, setSemester] = useState("1");
  const [group, setGroup] = useState("A");
  const [shift, setShift] = useState("Morning");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = parseStudent(window.localStorage.getItem(STUDENT_KEY));
    if (existing) {
      setName(existing.name);
      setInstituteId(existing.instituteId);
      setDepartment(departmentEnglish(existing.department));
      setSemester(String(existing.semester));
      setGroup(existing.group);
      setShift(existing.shift);
      setSaved(true);
    }
  }, []);

  function save() {
    onLogin({
      email: user?.email ?? "",
      name: name.trim() || displayName || "",
      instituteId,
      department,
      semester: Number(semester) || 1,
      group,
      shift,
    });
    setSaved(true);
  }

  return (
    <section className="animate-rise space-y-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
          <BookOpen className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-semibold">Your class profile</h1>
          <p className="truncate text-[11px] text-muted-foreground">
            {user?.email ?? "Sign in first"} · {displayName ?? ""}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Ei information-er upor base kore tomake class reminder jay — shudhu tomar polytechnic-er
        information dekha jay.
      </p>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="তোমার নাম"
          className="mt-1 h-10 rounded-xl"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Polytechnic</label>
        <Select value={instituteId} onValueChange={setInstituteId}>
          <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Student institute">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INSTITUTES.filter((i) => i.type === "government").map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Department</label>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Student department">
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
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">Semester</label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Student semester">
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
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Student group">
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
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger className="mt-1 h-10 rounded-xl" aria-label="Student shift">
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

      <Button variant="emerald" className="w-full" onClick={save}>
        {saved ? <CheckCircle2 className="size-4" /> : null}
        {saved ? "Update profile" : "Save profile"}
      </Button>
    </section>
  );
}
