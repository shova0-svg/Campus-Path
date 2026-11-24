import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { GoogleLogo } from "@/components/sohoj/GoogleLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Campus Path" },
      { name: "description", content: "Sign in or create your Campus Path account." },
      { property: "og:title", content: "Sign in — Campus Path" },
      { property: "og:description", content: "Sign in or create your Campus Path account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

const googleButton =
  "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium leading-5 text-[#1F1F1F] transition-colors hover:bg-[#F2F2F2] disabled:opacity-60";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const next = new URLSearchParams(window.location.search).get("next");
      const allowed = next === "/cr" || next === "/updates" ? next : "/";
      void navigate({ to: allowed as "/", replace: true });
    }
  }, [loading, user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const mail = email.trim();
    if (!mail.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          toast.error("Enter your name");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) setSentTo(mail);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
        toast.success("Signed in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(mail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSentTo(mail);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    const { signInWithGoogle: google } = await import("@/lib/supabase-auth");
    await google();
  }

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-md md:max-w-lg">
        <header className="bg-hero rounded-b-[2rem] px-5 pb-14 pt-7 text-primary-foreground">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-1 text-xs text-primary-foreground/80"
          >
            <ArrowLeft className="size-4" /> Back to app
          </Link>
          <div className="flex flex-col items-center gap-3 text-center">
            <Logo size={72} showTagline />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Reset password"
                    : "Welcome back"}
              </h1>
              <p className="font-bangla text-xs text-primary-foreground/75">
                {mode === "signup"
                  ? "নতুন অ্যাকাউন্ট খুলুন"
                  : mode === "forgot"
                    ? "পাসওয়ার্ড ভুলে গেছেন?"
                    : "আপনার অ্যাকাউন্টে প্রবেশ করুন"}
              </p>
            </div>
          </div>
        </header>

        <section className="-mt-8 px-5 pb-10">
          <div className="space-y-5 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            {sentTo ? (
              <div className="space-y-3 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <MailCheck className="size-7" />
                </span>
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a link to{" "}
                  <span className="break-all font-medium text-foreground">{sentTo}</span>.
                  {mode === "forgot"
                    ? " Open it to set a new password."
                    : " Open it to confirm your account."}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSentTo(null);
                    setMode("signin");
                  }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                {mode !== "forgot" && (
                  <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1" role="tablist">
                    {(["signin", "signup"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        role="tab"
                        aria-selected={mode === m}
                        onClick={() => setMode(m)}
                        className={cn(
                          "h-9 rounded-full text-sm font-medium transition-colors",
                          mode === m
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground",
                        )}
                      >
                        {m === "signin" ? "Sign in" : "Sign up"}
                      </button>
                    ))}
                  </div>
                )}

                {mode !== "forgot" && (
                  <div className="space-y-2.5">
                    <button type="button" className={googleButton} onClick={signInWithGoogle}>
                      <GoogleLogo /> Continue with Google
                    </button>
                    <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span className="h-px flex-1 bg-border" /> or with email{" "}
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                )}

                <form onSubmit={submit} className="space-y-3.5">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="auth-name">Your name</Label>
                      <Input
                        id="auth-name"
                        autoComplete="name"
                        placeholder="Rahim Uddin"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-email">Email</Label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  {mode !== "forgot" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auth-password">Password</Label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            className="text-xs font-medium text-primary"
                            onClick={() => setMode("forgot")}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <Input
                        id="auth-password"
                        type="password"
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full rounded-full"
                    disabled={busy}
                  >
                    {busy && <Loader2 className="animate-spin" />}
                    {mode === "signup"
                      ? "Create account"
                      : mode === "forgot"
                        ? "Send reset link"
                        : "Sign in"}
                  </Button>
                  {mode === "forgot" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setMode("signin")}
                    >
                      Back to sign in
                    </Button>
                  )}
                </form>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
