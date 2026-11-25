import { useState, type ChangeEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleLogo } from "@/components/sohoj/GoogleLogo";
import { useAuth } from "@/hooks/use-auth";
import { DEPARTMENT_OPTIONS } from "@/lib/teachers";
import { currentShopInstitute } from "@/lib/shop-scope";
import { validateShopProfile, type ShopProfile } from "@/lib/shop";
import { saveShopProfile, uploadShopAvatar } from "@/lib/repo/shop";
import { signInWithGoogle } from "@/lib/supabase-auth";

/** Signed-out / first-time seller gate. Browsing starts after the profile exists. */
export function ShopAccessGate({ onReady }: { onReady: (profile: ShopProfile) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [department, setDepartment] = useState(DEPARTMENT_OPTIONS[1]?.english ?? "");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    const check = validateShopProfile({ shopName: name, bio, phone, whatsapp, department });
    if (Object.keys(check).length > 0) {
      setError(Object.values(check)[0] ?? "");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let avatarUrl = "";
      if (avatar && user) avatarUrl = await uploadShopAvatar(user.id, avatar);
      await saveShopProfile({
        shopName: name,
        bio,
        phone,
        ...(whatsapp ? { whatsapp } : {}),
        department,
        ...(avatarUrl ? { avatarUrl } : {}),
        instituteId: currentShopInstitute(),
      });
      onReady({
        userId: user!.id,
        shopName: name,
        ...(avatarUrl ? { avatarUrl } : {}),
        bio,
        phone,
        ...(whatsapp ? { whatsapp } : {}),
        instituteId: currentShopInstitute(),
        department,
        isVerified: false,
        totalSold: 0,
        createdAt: new Date().toISOString(),
      });
      toast.success("Shop created / দোকান তৈরি হয়েছে");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create shop");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
        <main className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-soft text-emerald">
            <Store className="size-7" />
          </span>
          <h1 className="font-display mt-4 text-xl font-bold">Campus Shop / ক্যাম্পাস শপ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to browse and sell with classmates. / দেখতে ও বেচতে লগইন করুন।
          </p>
          <Button className="mt-5 w-full" onClick={() => void signInWithGoogle()}>
            <GoogleLogo /> Continue with Google
          </Button>
          <Button variant="ghost" className="mt-2 w-full" asChild>
            <Link to="/auth">Sign in with email / ইমেইল দিয়ে লগইন</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="rounded-3xl bg-hero px-5 py-5 text-primary-foreground">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
            <Store className="size-3.5" /> Campus Shop
          </p>
          <h1 className="font-display mt-1 text-lg font-bold">Set up your shop / দোকান খুলুন</h1>
          <p className="font-bangla mt-1 text-xs text-primary-foreground/75">
            নাম, ফোন ও বিভাগ দিয়ে একবার সেটাপ করলেই বেচা যাবে।
          </p>
        </div>

        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div>
            <label htmlFor="shop-name" className="text-[10px] text-muted-foreground">
              Shop name / দোকানের নাম
            </label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="mt-1 h-11 rounded-xl"
            />
          </div>
          <div>
            <label htmlFor="shop-phone" className="text-[10px] text-muted-foreground">
              Phone / ফোন
            </label>
            <Input
              id="shop-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712345678"
              className="mt-1 h-11 rounded-xl"
            />
          </div>
          <div>
            <label htmlFor="shop-whatsapp" className="text-[10px] text-muted-foreground">
              WhatsApp (optional)
            </label>
            <Input
              id="shop-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-1 h-11 rounded-xl"
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-11 rounded-xl [&>span]:truncate" aria-label="Department">
              <SelectValue placeholder="Department / বিভাগ" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENT_OPTIONS.map((d) => (
                <SelectItem key={d.key} value={d.english}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <label className="text-[10px] text-muted-foreground" htmlFor="shop-avatar">
              Shop photo / ছবি (optional)
            </label>
            <Input
              id="shop-avatar"
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAvatar(e.target.files?.[0] ?? null)
              }
              className="mt-1 h-11 rounded-xl"
            />
          </div>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <Button
            variant="emerald"
            className="w-full"
            onClick={() => void submit()}
            disabled={busy}
          >
            {busy ? "Saving…" : "Create my shop / আমার দোকান খুলুন"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Your phone is shown only to signed-in students. / ফোন শুধু লগইন করা ব্যবহারকারীরা দেখবেন।
          </p>
        </section>
      </main>
    </div>
  );
}
