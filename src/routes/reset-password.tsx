import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/sohoj/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Campus Path" },
      { name: "description", content: "Choose a new password for your Campus Path account." },
      { property: "og:title", content: "Set a new password — Campus Path" },
      {
        property: "og:description",
        content: "Choose a new password for your Campus Path account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-md md:max-w-lg">
        <header className="bg-hero rounded-b-[2rem] px-5 pb-14 pt-7 text-primary-foreground">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <h1 className="text-lg font-bold">Set a new password</h1>
          </div>
        </header>
        <section className="-mt-8 px-5 pb-10">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Save password
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
