import { useEffect, useState, type FormEvent } from "react";
import { Bell, BookOpen, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleLogo } from "./GoogleLogo";
import { INSTITUTES } from "@/lib/campus-data";
import { DEPARTMENT_OPTIONS, departmentEnglish } from "@/lib/teachers";
import { parseStudent, STUDENT_KEY, type StudentProfile } from "@/lib/student";

interface Props {
  onLogin: (profile: StudentProfile) => void;
}

export function StudentSetup({ onLogin }: Props) {
  const [step, setStep] = useState<"intro" | "form" | "verifying">("intro");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [instituteId, setInstituteId] = useState(INSTITUTES[0]?.id ?? "rpi");
  const [department, setDepartment] = useState(DEPARTMENT_OPTIONS[1]?.english ?? "");
  const [semester, setSemester] = useState("1");
  const [group, setGroup] = useState("A");
  const [shift, setShift] = useState("Morning");

  useEffect(() => {
    const saved = parseStudent(window.localStorage.getItem(STUDENT_KEY));
    if (saved) {
      setEmail(saved.email);
      setName(saved.name);
      setInstituteId(saved.instituteId);
      setDepartment(departmentEnglish(saved.department));
      setSemester(String(saved.semester));
      setGroup(saved.group);
      setShift(saved.shift);
      setStep("form");
    }
  }, []);

  function continueWithGoogle(e?: FormEvent) {
    e?.preventDefault();
    if (!email.includes("@")) return;
    setStep("verifying");
    window.setTimeout(() => {
      onLogin({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        instituteId,
        department,
        semester: Number(semester) || 1,
        group,
        shift,
      });
      setStep("form");
    }, 700);
  }

  if (step === "intro") {
    return (
      <section className="animate-rise rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <UserRound className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-xl font-semibold">Student account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue with Google — Class-er information ar Next Class Journey dekhte.
        </p>
        <form onSubmit={continueWithGoogle} className="mt-5 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="mt-1 h-11 rounded-xl"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-white px-3 text-sm font-medium text-[#1F1F1F] hover:bg-[#F2F2F2]"
          >
            <GoogleLogo className="size-5" /> Continue with Google
          </button>
        </form>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Demo mode: email diye local account kholbe. Real Google sign-in-er jonno Firebase / Google
          OAuth credential lagbe.
        </p>
      </section>
    );
  }

  return (
    <section className="animate-rise space-y-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold">Your class profile</h1>
          <p className="truncate text-[11px] text-muted-foreground">{email}</p>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="আপনার নাম"
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

      <Button
        variant="emerald"
        className="w-full"
        onClick={() =>
          onLogin({
            email,
            name,
            instituteId,
            department,
            semester: Number(semester) || 1,
            group,
            shift,
          })
        }
      >
        Save profile
      </Button>

      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Bell className="size-3.5 text-primary" /> Phone notification
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          App install korle class-er age local reminder dekha jay. Real push notification-er jonno
          Firebase Cloud Messaging setup lagbe.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={async () => {
            if (typeof Notification === "undefined") return;
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              new Notification("Sohoj Rasta", { body: "Class reminder on kora hoyeche ✅" });
            }
          }}
        >
          Enable reminders
        </Button>
      </div>
    </section>
  );
}
