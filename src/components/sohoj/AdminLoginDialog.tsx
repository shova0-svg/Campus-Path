import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleLogo } from "./GoogleLogo";
import { isAdminEmail } from "@/lib/admin";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (email: string) => void;
}

type Step = "intro" | "chooser" | "verifying" | "denied";

const googleButton =
  "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium leading-5 text-[#1F1F1F] transition-colors hover:bg-[#F2F2F2] disabled:opacity-60";

export function AdminLoginDialog({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open) {
      setStep("intro");
      setEmail("");
    }
  }, [open]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value.includes("@")) return;
    setStep("verifying");
    window.setTimeout(() => {
      if (isAdminEmail(value)) {
        onSuccess(value);
        onOpenChange(false);
      } else {
        setStep("denied");
      }
    }, 900);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        {step === "intro" && (
          <>
            <DialogHeader className="items-center text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                <ShieldCheck className="size-7" />
              </span>
              <DialogTitle className="pt-2 text-xl">Admin Login</DialogTitle>
              <DialogDescription>
                Only the verified campus admin can add, edit or delete rooms.
                <span className="mt-1 block font-bangla">শুধুমাত্র অনুমোদিত অ্যাডমিন প্রবেশ করতে পারবেন।</span>
              </DialogDescription>
            </DialogHeader>
            <button type="button" className={googleButton} onClick={() => setStep("chooser")}>
              <GoogleLogo />
              Continue with Google
            </button>
          </>
        )}

        {(step === "chooser" || step === "verifying") && (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader className="items-center text-center">
              <GoogleLogo className="size-8" />
              <DialogTitle className="pt-1 text-xl font-normal">Sign in with Google</DialogTitle>
              <DialogDescription>
                to continue to <span className="font-medium text-foreground">Sohoj Rasta</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="google-email">Email</Label>
              <Input
                id="google-email"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={step === "verifying"}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep("intro")} disabled={step === "verifying"}>
                <ArrowLeft /> Back
              </Button>
              <Button type="submit" size="lg" className="rounded-full px-6" disabled={!email.includes("@") || step === "verifying"}>
                {step === "verifying" ? (
                  <>
                    <Loader2 className="animate-spin" /> Checking…
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">Demo Google sign-in for the MVP.</p>
          </form>
        )}

        {step === "denied" && (
          <div className="space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>Access denied</DialogTitle>
              <DialogDescription>This email is not allowed to open the admin panel.</DialogDescription>
            </DialogHeader>
            <Alert variant="destructive" className="rounded-2xl">
              <ShieldAlert className="size-4" />
              <AlertTitle>Access Denied: Unauthorized Email</AlertTitle>
              <AlertDescription>
                <span className="break-all">{email.trim()}</span> is not allowed to manage Sohoj Rasta.
                <span className="mt-1 block font-bangla">এই ইমেইল দিয়ে অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।</span>
              </AlertDescription>
            </Alert>
            <button type="button" className={googleButton} onClick={() => setStep("chooser")}>
              <GoogleLogo />
              Try another Google account
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
