import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  CheckCircle2,
  MapPinned,
  QrCode,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: MapPinned,
    title: "Find any room",
    body: "Search by room number or scan a QR checkpoint — step-by-step directions, no GPS needed.",
  },
  {
    icon: BookOpen,
    title: "Know your next class",
    body: "Your semester routine, subject, teacher and room — always up to date.",
  },
  {
    icon: BellRing,
    title: "Never miss a class",
    body: "Leave-now reminders based on real campus walking time.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    body: "Last-known map and routine stay on your device when the network drops.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#081628] text-white">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 10%, rgba(20,54,95,.85), transparent 70%), radial-gradient(45% 40% at 10% 90%, rgba(201,150,47,.12), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 md:px-8 lg:px-12">
        {/* nav */}
        <header className="py-5 md:py-7">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2.5">
              <Logo variant="icon" size={36} />
              <span className="font-display text-lg leading-none tracking-tight">
                <span className="font-light text-white">Campus </span>
                <span className="font-bold text-[#F0CC76]">Path</span>
              </span>
            </span>
            <div className="hidden flex-1 text-center leading-tight lg:block">
              <p className="text-[10px] font-semibold tracking-wide text-white/65">
                Development By Siratun Janaat Shova
              </p>
              <p className="mt-0.5 text-[10px] text-white/40">
                Rajshahi Govt. Polytechnic Institute, Computer Science and Technology 1st semester
              </p>
            </div>
            <nav className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" size="sm" asChild className="text-white/80 hover:text-white">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="rounded-full bg-[#C9962F] px-4 font-semibold text-[#081628] hover:bg-[#F6D98A]"
              >
                <Link to="/auth">Create account</Link>
              </Button>
            </nav>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3 text-center text-[10px] leading-relaxed text-white/45 lg:hidden">
            <p className="font-semibold text-white/60">Development By Siratun Janaat Shova</p>
            <p>
              Rajshahi Govt. Polytechnic Institute, Computer Science and Technology 1st semester
            </p>
          </div>
        </header>

        {/* hero */}
        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-14">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#9FD8E6]">
              <Sparkles className="size-3.5" /> Rajshahi Govt. Polytechnic Institute
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
              Every room. <br />
              <span className="text-[#F0CC76]">One sohoj path.</span>
            </h1>
            <p className="font-bangla mt-5 text-base leading-relaxed text-white/70 md:text-lg">
              ক্যাম্পাসে নিজের পথ খুঁজে নিন — রুম, ক্লাস রুটিন, নোটিশ ও পরবর্তী ক্লাসের যাত্রা, সব এক জায়গায়।
            </p>
            <p className="mt-3 text-sm text-white/55 md:text-base">
              Find your way on campus. Built for Bangladesh polytechnic students — works offline, no
              GPS needed.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-full bg-[#C9962F] px-7 text-sm font-bold text-[#081628] shadow-lg shadow-[#C9962F]/20 hover:bg-[#F6D98A]"
              >
                <Link to="/auth">
                  Get started <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-white/20 bg-white/5 px-7 text-sm font-semibold text-white hover:bg-white/10"
              >
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>

            <ul className="mt-9 grid gap-3 sm:grid-cols-2">
              {["Free for students", "Offline-first", "QR checkpoints", "Class reminders"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-white/70 md:text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-[#F0CC76]" /> {t}
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* product preview card */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#9FD8E6]/10 to-[#C9962F]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1F3A] shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Logo variant="icon" size={32} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9FD8E6]">
                      Today · Sunday
                    </p>
                    <p className="text-sm font-semibold">Rajshahi Polytechnic</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  ROUTE READY
                </span>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Next class journey
                  </p>
                  <p className="mt-2 text-base font-semibold">Physics-I · Room 2302</p>
                  <p className="mt-1 text-xs text-white/60">SYED MAHMUDUN NABI KHONDKER</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#9FD8E6]">
                    <span className="rounded-full bg-white/10 px-2 py-1">Walk 6 min</span>
                    <span className="rounded-full bg-white/10 px-2 py-1">Leave 09:24</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    [QrCode, "Scan QR"],
                    [BookOpen, "Routine"],
                    [BellRing, "Reminders"],
                  ].map(([Icon, label]) => {
                    const I = Icon as typeof QrCode;
                    return (
                      <div
                        key={label as string}
                        className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-3 text-center"
                      >
                        <I className="size-4 text-[#F0CC76]" />
                        <span className="text-[10px] font-medium text-white/70">
                          {label as string}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-[#C9962F]/10 p-3 text-xs text-[#F6D98A]">
                  <ShieldCheck className="size-4 shrink-0" /> Verified by campus admin · works
                  offline
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* features */}
        <section className="grid gap-3 border-t border-white/10 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:py-10">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Icon className="size-5 text-[#F0CC76]" />
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-[11px] leading-snug text-white/55">{body}</p>
            </div>
          ))}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5 text-[11px] text-white/45">
          <span className={cn("font-bangla")}>
            ক্যাম্পাস পাথ · Made for Bangladesh polytechnic students
          </span>
          <span>Campus Path © 2026</span>
        </footer>
      </div>
    </div>
  );
}
