import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JourneyCard } from "@/components/sohoj/JourneyCard";
import { StudentSetup } from "@/components/sohoj/StudentSetup";
import { buildingsResource, routinesResource } from "@/lib/resources";
import { loadStudentProfile, saveStudentProfile } from "@/lib/repo/student";
import { nextClassJourney, parseStudent, STUDENT_KEY, type StudentProfile } from "@/lib/student";
import { enableNotifications, notificationsEnabled, scheduleJourneyReminders } from "@/lib/notify";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student — Sohoj Rasta" },
      { name: "description", content: "Your class journey, based on your routine and campus map." },
    ],
  }),
  component: StudentPage,
});

function StudentPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [routines, setRoutines] = useState(() => routinesResource.get());
  const [allBuildings, setAllBuildings] = useState(() => buildingsResource.get());

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    const cached = parseStudent(window.localStorage.getItem(STUDENT_KEY));
    setProfile(cached);
    if (user?.id && !cached) {
      void loadStudentProfile(user.id).then((remote) => {
        if (remote) {
          const merged = { ...remote, email: user.email ?? remote.email };
          setProfile(merged);
          window.localStorage.setItem(STUDENT_KEY, JSON.stringify(merged));
        }
      });
    }
    routinesResource.refresh();
    buildingsResource.refresh();
  }, []);

  useEffect(() => routinesResource.subscribe(setRoutines), []);
  useEffect(() => buildingsResource.subscribe(setAllBuildings), []);

  const buildings = useMemo(() => {
    const grouped: Record<string, (typeof allBuildings)[number][]> = {};
    for (const b of allBuildings) (grouped[b.instituteId] ??= []).push(b);
    return grouped;
  }, [allBuildings]);

  const journey = useMemo(
    () =>
      profile
        ? nextClassJourney(profile, routines, buildings[profile.instituteId] ?? [], new Date())
        : null,
    [profile, routines, buildings],
  );

  useEffect(() => {
    if (!journey || !notificationsEnabled()) return;
    return scheduleJourneyReminders(journey);
  }, [journey]);

  async function handleEnablePush(): Promise<string | null> {
    const ok = await enableNotifications();
    toast(ok ? "Class reminders on" : "Notification permission denied", {
      description: ok ? "Routine er upor base kore reminder jay" : "Browser setting-e allow koro",
    });
    return ok ? "enabled" : null;
  }

  function login(next: StudentProfile) {
    setProfile(next);
    window.localStorage.setItem(STUDENT_KEY, JSON.stringify(next));
    if (user?.id) void saveStudentProfile(user.id, next, notificationsEnabled()).catch(() => {});
  }

  function logout() {
    setProfile(null);
    window.localStorage.removeItem(STUDENT_KEY);
  }

  return (
    <div className="bg-desk min-h-dvh px-4 py-6 lg:flex lg:justify-center">
      <main className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> Back to home
            </Button>
          </Link>
          {profile && (
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut /> Logout
            </Button>
          )}
        </div>

        {!profile ? (
          <StudentSetup onLogin={login} onEnablePush={handleEnablePush} />
        ) : (
          <>
            <StudentSetup onLogin={login} onEnablePush={handleEnablePush} />
            <Button variant="outline" className="w-full" onClick={handleEnablePush}>
              <Bell className="size-4" /> Enable class reminders
            </Button>
            {journey ? (
              <JourneyCard journey={journey} />
            ) : (
              <p className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Ei profile-er jonno kono routine paoa jay ni. Department/semester/shift thik kore
                save koro.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
