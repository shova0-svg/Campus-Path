import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, ClipboardCheck, Flag, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JourneyCard } from "@/components/sohoj/JourneyCard";
import { StudentSetup } from "@/components/sohoj/StudentSetup";
import { buildingsResource } from "@/lib/resources";
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
import { useCrRole } from "@/hooks/use-cr-role";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student — Campus Path" },
      { name: "description", content: "Your class journey, based on your routine and campus map." },
    ],
  }),
  component: StudentPage,
});

function StudentPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
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
    buildingsResource.refresh();
  }, []);

  useEffect(() => buildingsResource.subscribe(setAllBuildings), []);

  const buildings = useMemo(() => {
    const grouped: Record<string, (typeof allBuildings)[number][]> = {};
    for (const b of allBuildings) (grouped[b.instituteId] ??= []).push(b);
    return grouped;
  }, [allBuildings]);

  const journey = useMemo(
    () =>
      profile ? nextClassJourney(profile, new Date(), buildings[profile.instituteId] ?? []) : null,
    [profile, buildings],
  );

  useEffect(() => {
    if (!journey) return;
    logEvent("journey_view");
    if (!notificationsEnabled()) return;
    return scheduleJourneyReminders(journey);
  }, [journey]);

  const { isCr: isCrUser } = useCrRole();
  const [remindersOn, setRemindersOn] = useState(false);
  useEffect(() => setRemindersOn(notificationsEnabled()), []);
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
    <div className="bg-desk min-h-dvh px-4 pb-28 pt-6 lg:flex lg:justify-center">
      <main className="w-full max-w-md space-y-4 md:max-w-2xl lg:max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" aria-label="Back to home">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Back to home</span>
            </Button>
          </Link>
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            <Logo variant="icon" size={24} />
            {isCrUser && (
              <Button variant="ghost" size="sm" asChild aria-label="CR section">
                <Link to="/cr">
                  <ClipboardCheck /> <span className="hidden sm:inline">CR</span>
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Send feedback"
              onClick={() => openFeedback({ page: "student" })}
            >
              <MessageSquare /> <span className="hidden sm:inline">Feedback</span>
            </Button>
            {profile && (
              <Button variant="ghost" size="sm" aria-label="Log out" onClick={logout}>
                <LogOut /> <span className="hidden sm:inline">Logout</span>
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
                এই সেমিস্টারের রুটিন এখনো যোগ করা হয়নি / Routine for this semester is not added yet.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
