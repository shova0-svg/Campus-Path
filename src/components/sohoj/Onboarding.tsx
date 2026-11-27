import { safeGet, safeSet } from "@/lib/storage";
import { useEffect, useState } from "react";
import { Bell, CalendarClock, Download, MapPin, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { needsHomeScreenHint } from "@/lib/notify";

const SEEN_KEY = "sohoj-rasta-onboarded-v1";

const STEPS = [
  {
    icon: MapPin,
    title: "Find any room",
    body: "Room name search korun ba QR scan korun — offline-aeo cholbe।",
  },
  {
    icon: CalendarClock,
    title: "See your routine",
    body: "Department, semester ar group select kore nijer class dekha jay।",
  },
  {
    icon: Bell,
    title: "Enable reminders",
    body: "Class close thakleo 'Leave now' push paben — app band thakleo।",
  },
] as const;

/** First-visit 3-step intro. Shows once; skippable. */
export function Onboarding() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return safeGet(SEEN_KEY) !== "1";
  });
  const [step, setStep] = useState(0);

  function finish() {
    safeSet(SEEN_KEY, "1");
    setOpen(false);
  }

  const active = STEPS[step]!;
  const Icon = active.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : finish())}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-primary" /> {active.title}
          </DialogTitle>
          <DialogDescription className="font-bangla">{active.body}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={finish}>
            Skip
          </Button>
          <Button
            variant="emerald"
            className="flex-1"
            onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
          >
            {step === STEPS.length - 1 ? "Got it" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Android shows a real install button; iOS gets a manual home-screen hint. */
export function InstallHint() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const iosHint = needsHomeScreenHint();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (dismissed || (!promptEvent && !iosHint)) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary-soft/60 px-3 py-2 text-xs">
      <Download className="size-4 shrink-0 text-primary" />
      <span className="font-bangla min-w-0 flex-1 text-foreground">
        {promptEvent
          ? "App-ta home screen-e install korun — push ar offline better cholbe।"
          : "iPhone-e Share → Add to Home Screen diye app-ta add korun।"}
      </span>
      {promptEvent && (
        <Button size="sm" variant="emerald" onClick={install}>
          Install
        </Button>
      )}
      <button type="button" aria-label="Dismiss install hint" onClick={() => setDismissed(true)}>
        <X className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}
