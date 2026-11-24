import { useEffect, useState, type ChangeEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import {
  MAX_IMAGES,
  SHOP_CATEGORIES,
  SHOP_CONDITIONS,
  validateProduct,
  type ShopCategory,
  type ShopCondition,
} from "@/lib/shop";
import { currentShopInstitute } from "@/lib/shop-scope";
import { parseStudent, STUDENT_KEY } from "@/lib/student";
import { createProduct, deleteShopImages, uploadShopImages } from "@/lib/repo/shop";

export const Route = createFileRoute("/shop/new")({
  head: () => ({ meta: [{ title: "Sell an item — Campus Path" }] }),
  component: NewProduct,
});

function NewProduct() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const profile =
    typeof window === "undefined" ? null : parseStudent(window.localStorage.getItem(STUDENT_KEY));

  useEffect(() => {
    if (!authLoading && !user) window.location.replace("/auth?next=/shop/new");
  }, [authLoading, user]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ShopCategory | "">("");
  const [condition, setCondition] = useState<ShopCondition | "">("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [semester, setSemester] = useState(profile ? String(profile.semester) : "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function pickImages(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - files.length);
    const next = [...files, ...picked].slice(0, MAX_IMAGES);
    setFiles(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
    e.target.value = "";
  }

  function removeImage(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!user) return;
    const check = validateProduct({
      title,
      description,
      category,
      condition,
      price,
      isNegotiable: negotiable,
      images: files.map(() => "pending"),
      contactPhone: phone,
      ...(whatsapp ? { contactWhatsapp: whatsapp } : {}),
      department,
      ...(semester ? { semester: Number(semester) } : {}),
    });
    if (Object.keys(check).length > 0) {
      setError(Object.values(check)[0] ?? "");
      return;
    }
    setBusy(true);
    setError("");
    let uploaded: string[] = [];
    try {
      uploaded = await uploadShopImages(user.id, files);
      const product = await createProduct({
        sellerId: user.id,
        instituteId: currentShopInstitute(),
        title,
        description,
        category: category as ShopCategory,
        condition: condition as ShopCondition,
        price,
        isNegotiable: negotiable,
        images: uploaded,
        contactPhone: phone,
        ...(whatsapp ? { contactWhatsapp: whatsapp } : {}),
        ...(department ? { department } : {}),
        ...(semester ? { semester: Number(semester) } : {}),
      });
      toast.success("Posted / আইটেম পোস্ট হয়েছে");
      await navigate({ to: "/shop/$productId", params: { productId: product.id } });
    } catch (e) {
      if (uploaded.length) await deleteShopImages(uploaded).catch(() => {});
      const message = e instanceof Error ? e.message : "";
      setError(
        /Max 10 active/i.test(message)
          ? "সর্বোচ্চ ১০টি active আইটেম — কিছু বেচা বা মুছে ফেলুন / Max 10 active listings"
          : /row-level security|permission|banned/i.test(message)
            ? "পোস্ট করা যাবে না — অ্যাডমিনের সাথে যোগাযোগ করুন / Posting not allowed"
            : "পোস্ট করা যায় ni — ইন্টারনেট চেক করুন / Could not post",
      );
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="bg-desk grid min-h-dvh place-items-center pb-28 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-desk min-h-dvh px-4 pb-28 pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/shop" aria-label="Back to shop">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Back to shop</span>
            </Button>
          </Link>
          <span className="ml-auto text-xs font-semibold text-primary">
            Add product / আইটেম যোগ করুন
          </span>
        </div>

        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <label htmlFor="shop-title">Title / শিরোনাম</label>
              <span>{title.length}/100</span>
            </div>
            <Input
              id="shop-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="mt-1 h-11 rounded-xl"
              placeholder="e.g. Physics book, class 11"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <label htmlFor="shop-desc">Description / বিবরণ</label>
              <span>{description.length}/2000</span>
            </div>
            <textarea
              id="shop-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="অবস্থা, ব্যবহার, বইয়ের ক্লাস ইত্যাদি…"
              className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Select value={category} onValueChange={(v) => setCategory(v as ShopCategory)}>
              <SelectTrigger className="h-11 rounded-xl [&>span]:truncate" aria-label="Category">
                <SelectValue placeholder="Category / ক্যাটাগরি" />
              </SelectTrigger>
              <SelectContent>
                {SHOP_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={condition} onValueChange={(v) => setCondition(v as ShopCondition)}>
              <SelectTrigger className="h-11 rounded-xl [&>span]:truncate" aria-label="Condition">
                <SelectValue placeholder="Condition / অবস্থা" />
              </SelectTrigger>
              <SelectContent>
                {SHOP_CONDITIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-label="Price"
              placeholder="Price ৳ / দাম"
              className="h-11 rounded-xl"
            />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Contact phone"
              placeholder="Contact phone / ফোন"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              aria-label="WhatsApp number"
              placeholder="WhatsApp (optional)"
              className="h-11 rounded-xl"
            />
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              aria-label="Department"
              placeholder="Department (optional)"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={6}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              aria-label="Semester"
              placeholder="Semester (optional)"
              className="h-11 flex-1 rounded-xl"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
              />
              Negotiable / দরদাম
            </label>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground">Photos / ছবি (1–{MAX_IMAGES})</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <div
                  key={src}
                  className="relative size-20 overflow-hidden rounded-xl border border-border"
                >
                  <img src={src} alt={`Selected ${i + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove image ${i + 1}`}
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-card/90 p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {files.length < MAX_IMAGES && (
                <label className="grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-border text-muted-foreground">
                  <ImagePlus className="size-6" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={pickImages}
                    className="hidden"
                    aria-label="Choose photos"
                  />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <Button
            variant="emerald"
            className="w-full"
            onClick={() => void submit()}
            disabled={busy}
          >
            {busy ? "Posting…" : "Post item / আইটেম পোস্ট করুন"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Meet on campus and pay in person — no in-app payment.
          </p>
        </section>
      </main>
    </div>
  );
}
