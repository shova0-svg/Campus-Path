import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Flag, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JourneyCard } from "@/components/sohoj/JourneyCard";
import { StudentSetup } from "@/components/sohoj/StudentSetup";
import { buildingsResource, routinesResource } from "@/lib/resources";
import { loadStudentProfile, saveStudentProfile } from "@/lib/repo/student";
import { nextClassJourney, parseStudent, STUDENT_KEY, type StudentProfile } from "@/lib/student";
import {
  disableNotifications,
  enableNotifications,
  needsHomeScreenHint,
  notificationsEnabled,
  scheduleJourneyReminders,
} from "@/lib/notify";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { openFeedback } from "@/lib/feedback";
import { logEvent } from "@/lib/analytics";
import { InstallHint } from "@/components/sohoj/Onboarding";

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
    if (!journey) return;
    logEvent("journey_view");
    if (!notificationsEnabled()) return;
    return scheduleJourneyReminders(journey);
  }, [journey]);

  const [remindersOn, setRemindersOn] = useState(notificationsEnabled);
  const iosHint = needsHomeScreenHint();

  async function handleTogglePush() {
    if (remindersOn) {
      await disableNotifications();
      setRemindersOn(false);
      if (user?.id) void saveStudentProfile(user.id, profile!, false).catch(() => {});
      toast("Class reminders off");
      return;
    }
    const ok = await enableNotifications();
    setRemindersOn(ok);
    toast(ok ? "Class reminders on" : "Notification permission denied", {
      description: ok
        ? "Class close thakleo push jay — app band thakleo chalbe"
        : "Browser setting-e allow koro / iOS-e PWA home screen-e add koro",
    });
    if (ok && user?.id && profile) void saveStudentProfile(user.id, profile, true).catch(() => {});
    if (ok) logEvent("reminder_enabled");
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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openFeedback({ page: "student" })}>
              <MessageSquare /> Feedback
            </Button>
            {profile && (
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut /> Logout
              </Button>
            )}
          </div>
        </div>

        {!profile ? (
          <StudentSetup onLogin={login} onEnablePush={handleTogglePush} />
        ) : (
          <>
            <StudentSetup onLogin={login} onEnablePush={handleTogglePush} />
            <Button
              variant={remindersOn ? "emerald" : "outline"}
              className="w-full"
              onClick={handleTogglePush}
            >
              <Bell className="size-4" />{" "}
              {remindersOn ? "Reminders on — tap to off" : "Enable class reminders"}
            </Button>
            {iosHint && (
              <p className="text-center font-bangla text-[11px] text-muted-foreground">
                iPhone-e push-er jonno app-ta Home Screen-e add koro (Share → Add to Home Screen)।
              </p>
            )}
            <InstallHint />
            {journey ? (
              <>
                <JourneyCard journey={journey} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() =>
                    openFeedback({
                      category: "wrong_routine",
                      message: "Routine / class info is wrong — ",
                      page: "student",
                    })
                  }
                >
                  <Flag /> Report wrong class info
                </Button>
              </>
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
