import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DEPARTMENT_OPTIONS } from "@/lib/teachers";
import { validateShopProfile, type ShopProfile } from "@/lib/shop";
import { saveShopProfile } from "@/lib/repo/shop";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ShopProfile;
  onSaved: () => void;
}

export function EditShopProfileDialog({ open, onOpenChange, profile, onSaved }: Props) {
  const [name, setName] = useState(profile.shopName);
  const [phone, setPhone] = useState(profile.phone);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? "");
  const [department, setDepartment] = useState(profile.department);
  const [bio, setBio] = useState(profile.bio);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const check = validateShopProfile({ shopName: name, bio, phone, whatsapp, department });
    if (Object.keys(check).length > 0) {
      setError(Object.values(check)[0] ?? "");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveShopProfile({
        shopName: name,
        bio,
        phone,
        ...(whatsapp ? { whatsapp } : {}),
        department,
        instituteId: profile.instituteId,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        ...(profile.semester != null ? { semester: profile.semester } : {}),
      });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit shop / দোকান সম্পাদনা</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Shop name"
            placeholder="Shop name"
          />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Phone"
            placeholder="Phone"
          />
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            aria-label="WhatsApp"
            placeholder="WhatsApp (optional)"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Department"
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d.key} value={d.english}>
                {d.label}
              </option>
            ))}
          </select>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={3}
            aria-label="Bio"
            placeholder="About your shop"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <Button variant="emerald" className="w-full" onClick={() => void save()} disabled={busy}>
            {busy ? "Saving…" : "Save / সংরক্ষণ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
