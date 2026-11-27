import { useEffect, useState, type ChangeEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus, Loader2, Star, X } from "lucide-react";
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
import { parseStudent, STUDENT_KEY } from "@/lib/student";
import { createProduct, deleteShopImages, uploadShopImages } from "@/lib/repo/shop";
import { safeGet } from "@/lib/storage";
import {
  isValidBdPhone,
  MAX_IMAGES,
  SHOP_CATEGORIES,
  SHOP_CONDITIONS,
  validateProduct,
  type ShopCategory,
  type ShopCondition,
} from "@/lib/shop";
import { currentShopInstitute } from "@/lib/shop-scope";

export const Route = createFileRoute("/shop/new")({
  head: () => ({ meta: [{ title: "Sell an item — Campus Path" }] }),
  component: NewProduct,
});

type ImageItem = { key: string; preview: string; file: File };

function NewProduct() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const profile = typeof window === "undefined" ? null : parseStudent(safeGet(STUDENT_KEY));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ShopCategory | "">("");
  const [condition, setCondition] = useState<ShopCondition | "">("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pickupLocation, setPickupLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [semester, setSemester] = useState(profile ? String(profile.semester) : "");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) window.location.replace("/auth?next=/shop/new");
  }, [authLoading, user]);

  useEffect(
    () => () => {
      images.forEach((i) => URL.revokeObjectURL(i.preview));
    },
    [images],
  );

  function pickImages(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
      .slice(0, MAX_IMAGES - images.length)
      .map((file) => ({ key: crypto.randomUUID(), preview: URL.createObjectURL(file), file }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function setCover(index: number) {
    setImages((prev) => {
      if (!prev[index]) return prev;
      return [prev[index]!, ...prev.filter((_, i) => i !== index)];
    });
  }

  async function submit() {
    if (!user) return;
    const qty = Number(quantity);
    const check = validateProduct({
      title,
      description,
      category,
      condition,
      price,
      isNegotiable: negotiable,
      images: images.map(() => "pending"),
      quantity: qty,
      department,
      pickupLocation,
      ...(semester ? { semester: Number(semester) } : {}),
    });
    if (Object.keys(check).length > 0) {
      setError(Object.values(check)[0] ?? "");
      return;
    }
    if (!isValidBdPhone(contactPhone)) {
      setError("017XXXXXXXX ফরম্যাটে ফোন দিন / Enter a valid BD phone number");
      return;
    }
    if (contactWhatsapp && !isValidBdPhone(contactWhatsapp)) {
      setError("সঠিক WhatsApp নম্বর দিন / Enter a valid WhatsApp number");
      return;
    }
    setBusy(true);
    setError("");
    let uploaded: string[] = [];
    try {
      uploaded = images.length
        ? await uploadShopImages(
            user.id,
            images.map((i) => i.file),
          )
        : [];
      const product = await createProduct({
        sellerId: user.id,
        instituteId: currentShopInstitute(),
        title: title.trim(),
        description: description.trim(),
        category: category as ShopCategory,
        condition: condition as ShopCondition,
        price,
        isNegotiable: negotiable,
        images: uploaded,
        quantity: qty,
        department,
        pickupLocation,
        contactPhone,
        ...(contactWhatsapp ? { contactWhatsapp } : {}),
        ...(semester ? { semester: Number(semester) } : {}),
      });
      toast.success("Posted / আইটেম পোস্ট হয়েছে");
      await navigate({ to: "/shop/$productId", params: { productId: product.id } });
    } catch (e) {
      if (uploaded.length) await deleteShopImages(uploaded).catch(() => {});
      const message = e instanceof Error ? e.message : "";
      setError(
        /Max 10 active|Max 30 active|Max 10 new listings/i.test(message)
          ? "সর্বোচ্চ লিস্টিং সীমা শেষ — কিছু আইটেম বাদ দিন / Listing limit reached"
          : /row-level security|permission|banned/i.test(message)
            ? "পোস্ট করা যাবে না — অ্যাডমিনের সাথে যোগাযোগ করুন / Posting not allowed"
            : /upload|image|ছবি/i.test(message)
              ? "ছবি আপলোড ব্যর্থ — ফর্ম রেখে আবার চেষ্টা করুন / Image upload failed — please retry"
              : "পোস্ট করা যায় ni — আবার চেষ্টা করুন / Could not post — please retry",
      );
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="bg-desk grid min-h-dvh place-items-center pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/shop" aria-label="Back to shop">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Shop</span>
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
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-label="Price"
              placeholder="Price ৳ / দাম"
              className="h-11 rounded-xl"
            />
            <Input
              type="number"
              min={0}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              aria-label="Quantity"
              placeholder="Quantity / পরিমাণ"
              className="h-11 rounded-xl"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <label htmlFor="shop-pickup">Pickup on campus / ক্যাম্পাসে পিকআপ</label>
              <span>{pickupLocation.length}/100</span>
            </div>
            <Input
              id="shop-pickup"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value.slice(0, 100))}
              maxLength={100}
              className="mt-1 h-11 rounded-xl"
              placeholder="e.g. Library gate / লাইব্রেরি গেট"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              aria-label="Phone"
              placeholder="Phone / ফোন (01XXXXXXXXX)"
              className="h-11 rounded-xl"
            />
            <Input
              value={contactWhatsapp}
              onChange={(e) => setContactWhatsapp(e.target.value)}
              aria-label="WhatsApp"
              placeholder="WhatsApp (optional)"
              className="h-11 rounded-xl"
            />
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
            />
            Negotiable / দরদাম
          </label>

          <div>
            <p className="text-[10px] text-muted-foreground">
              Photos / ছবি (1–{MAX_IMAGES}) · tap ★ for cover
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((item, i) => (
                <div
                  key={item.key}
                  className="relative size-20 overflow-hidden rounded-xl border border-border"
                >
                  <img
                    src={item.preview}
                    alt={`Selected ${i + 1}`}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Set ${i + 1} as cover`}
                    onClick={() => setCover(i)}
                    className="absolute left-1 top-1 rounded-full bg-card/90 p-0.5"
                  >
                    <Star
                      className={`size-3.5 ${i === 0 ? "fill-current text-emerald" : "text-muted-foreground"}`}
                    />
                  </button>
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
              {images.length < MAX_IMAGES && (
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
