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
import { ShopAccessGate } from "@/components/sohoj/shop/ShopAccessGate";
import { ShopProfileErrorState } from "@/components/sohoj/shop/ShopProfileErrorState";
import { useAuth } from "@/hooks/use-auth";
import { useShopProfile } from "@/hooks/use-shop-profile";
import { parseStudent, STUDENT_KEY } from "@/lib/student";
import {
  createProduct,
  deleteShopImages,
  getProduct,
  setProductStatus,
  updateProduct,
  uploadShopImages,
} from "@/lib/repo/shop";
import { safeGet } from "@/lib/storage";
import { shopImageUrl } from "@/lib/shop-image";
import {
  MAX_IMAGES,
  SHOP_CATEGORIES,
  SHOP_CONDITIONS,
  SHOP_STATUS_TABS,
  validateProduct,
  type ShopCategory,
  type ShopCondition,
  type ShopStatus,
} from "@/lib/shop";
import { currentShopInstitute } from "@/lib/shop-scope";

export const Route = createFileRoute("/shop/new")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } => ({
    ...(typeof search["edit"] === "string" ? { edit: search["edit"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Sell an item — Campus Path" }] }),
  component: NewProduct,
});

type ImageItem = { key: string; preview: string; file?: File; path?: string };

function NewProduct() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile: shopProfile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useShopProfile();
  const { edit } = Route.useSearch();
  const navigate = useNavigate();
  const profile = typeof window === "undefined" ? null : parseStudent(safeGet(STUDENT_KEY));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ShopCategory | "">("");
  const [condition, setCondition] = useState<ShopCondition | "">("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pickupLocation, setPickupLocation] = useState("");
  const [status, setStatus] = useState<ShopStatus>("available");
  const [negotiable, setNegotiable] = useState(false);
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [semester, setSemester] = useState(profile ? String(profile.semester) : "");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(Boolean(edit));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) window.location.replace("/auth?next=/shop/new");
  }, [authLoading, user]);

  useEffect(() => {
    if (!edit) return;
    let active = true;
    void getProduct(edit)
      .then((p) => {
        if (!active) return;
        if (!p) {
          setError("Product not found / পণ্য পাওয়া যায়নি");
          return;
        }
        setTitle(p.title);
        setDescription(p.description);
        setCategory(p.category);
        setCondition(p.condition);
        setPrice(String(p.price));
        setQuantity(String(p.quantity));
        setPickupLocation(p.pickupLocation ?? "");
        setStatus(p.status === "removed" ? "hidden" : p.status);
        setNegotiable(p.isNegotiable);
        setDepartment(p.department ?? "");
        setSemester(p.semester != null ? String(p.semester) : "");
        setImages(
          p.images.map((path, i) => ({
            key: `existing-${i}`,
            preview: shopImageUrl(path),
            path,
          })),
        );
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load product / পণ্য লোড করা যায়নি"),
      )
      .finally(() => active && setEditLoading(false));
    return () => {
      active = false;
    };
  }, [edit]);

  useEffect(
    () => () => {
      images.filter((i) => i.file).forEach((i) => URL.revokeObjectURL(i.preview));
    },
    [images],
  );

  function pickImages(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
      .slice(0, MAX_IMAGES - images.length)
      .map((file) => ({
        key: crypto.randomUUID(),
        preview: URL.createObjectURL(file),
        file,
      }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const item = prev[index];
      if (item?.path) setRemovedPaths((paths) => [...paths, item.path!]);
      else if (item?.file) URL.revokeObjectURL(item.preview);
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
    setBusy(true);
    setError("");
    const newPaths: string[] = [];
    try {
      const files = images.filter((i) => i.file).map((i) => i.file!);
      const uploaded = files.length ? await uploadShopImages(user.id, files) : [];
      newPaths.push(...uploaded);
      let uploadIndex = 0;
      const ordered = images.map((item) =>
        item.path ? item.path : (uploaded[uploadIndex++] ?? ""),
      );
      if (edit) {
        await updateProduct(edit, {
          title: title.trim(),
          description: description.trim(),
          category: category as ShopCategory,
          condition: condition as ShopCondition,
          price: Number(price),
          isNegotiable: negotiable,
          images: ordered,
          quantity: qty,
          department,
          pickupLocation,
          ...(semester ? { semester: Number(semester) } : {}),
        });
        await setProductStatus(edit, status);
        if (removedPaths.length) await deleteShopImages(removedPaths);
        toast.success("Product updated / আইটেম বদলেছে");
        await navigate({ to: "/shop/my" });
      } else {
        const product = await createProduct({
          sellerId: user.id,
          instituteId: currentShopInstitute(),
          title,
          description,
          category: category as ShopCategory,
          condition: condition as ShopCondition,
          price,
          isNegotiable: negotiable,
          images: ordered,
          quantity: qty,
          department,
          pickupLocation,
          ...(semester ? { semester: Number(semester) } : {}),
        });
        if (status !== "available") await setProductStatus(product.id, status);
        toast.success("Posted / আইটেম পোস্ট হয়েছে");
        await navigate({ to: "/shop/$productId", params: { productId: product.id } });
      }
    } catch (e) {
      if (newPaths.length) await deleteShopImages(newPaths).catch(() => {});
      const message = e instanceof Error ? e.message : "";
      setError(
        /Max 10 active/i.test(message)
          ? "সর্বোচ্চ ১০টি active আইটেম — কিছু বেচা বা মুছে ফেলুন / Max 10 active listings"
          : /row-level security|permission|banned/i.test(message)
            ? "পোস্ট করা যাবে না — অ্যাডমিনের সাথে যোগাযোগ করুন / Posting not allowed"
            : /upload|image|ছবি/i.test(message)
              ? "ছবি আপলোড ব্যর্থ — ফর্ম রেখে আবার চেষ্টা করুন / Image upload failed — form kept, please retry"
              : "সংরক্ষণ করা যায় ni — আবার চেষ্টা করুন / Could not save — please retry",
      );
    } finally {
      setBusy(false);
    }
  }

  if (profileError)
    return <ShopProfileErrorState error={profileError} onRetry={() => void refreshProfile()} />;
  if (authLoading || profileLoading || editLoading || !user) {
    return (
      <div className="bg-desk grid min-h-dvh place-items-center pb-[calc(7rem+env(safe-area-inset-bottom))] text-sm text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!shopProfile) return <ShopAccessGate onReady={() => void refreshProfile()} />;

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/shop" aria-label="Back to shop">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Back to shop</span>
            </Button>
          </Link>
          <span className="ml-auto text-xs font-semibold text-primary">
            {edit ? "Edit product / আইটেম সম্পাদনা" : "Add product / আইটেম যোগ করুন"}
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
            <Select value={status} onValueChange={(v) => setStatus(v as ShopStatus)}>
              <SelectTrigger className="h-11 rounded-xl" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOP_STATUS_TABS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
              />
              Negotiable / দরদাম
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              aria-label="Department"
              placeholder="Department (optional)"
              className="h-11 rounded-xl"
            />
            <Input
              type="number"
              min={1}
              max={6}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              aria-label="Semester"
              placeholder="Semester (optional)"
              className="h-11 rounded-xl"
            />
          </div>

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
            {busy
              ? "Saving…"
              : edit
                ? "Save changes / পরিবর্তন সংরক্ষণ"
                : "Post item / আইটেম পোস্ট করুন"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Meet on campus and pay in person — no in-app payment.
          </p>
        </section>
      </main>
    </div>
  );
}
