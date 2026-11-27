import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  Heart,
  Package,
  Plus,
  Ruler,
  Search,
  SlidersHorizontal,
  Store,
  WifiOff,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/sohoj/shop/ProductCard";
import {
  SHOP_CATEGORIES,
  SHOP_CONDITIONS,
  type ShopCategory,
  type ShopCondition,
  type ShopProduct,
  type ShopSort,
} from "@/lib/shop";
import { currentShopInstitute } from "@/lib/shop-scope";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useShopProfile } from "@/hooks/use-shop-profile";
import { listProducts } from "@/lib/repo/shop";
import { listWishlistIds, toggleWishlist } from "@/lib/repo/wishlist";
import { recentProductIds } from "@/lib/shop-recent";
import { DEPARTMENT_OPTIONS } from "@/lib/teachers";

export const Route = createFileRoute("/shop/")({
  head: () => ({ meta: [{ title: "Campus Shop — Campus Path" }] }),
  component: ShopHome,
});

const CATEGORY_ICONS: Record<ShopCategory, typeof BookOpen> = {
  old_books: BookOpen,
  drawing_tools: Ruler,
  engineering_instruments: Wrench,
  electronics: Cpu,
  others: Package,
};

const SEGMENTS = [
  { to: "/shop", label: "Home" },
  { to: "/shop/wishlist", label: "Wishlist" },
  { to: "/shop/requests", label: "Requests" },
  { to: "/shop/my", label: "My Shop" },
] as const;

function ShopHome() {
  const { profile, loading: profileLoading } = useShopProfile();
  const institute = currentShopInstitute();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<ShopCategory | "all">("all");
  const [condition, setCondition] = useState<ShopCondition | "all">("all");
  const [department, setDepartment] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<ShopSort>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const { online } = useConnectivity();
  const touchY = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (nextPage: number, append = false) => {
      if (nextPage === 0) setLoading(true);
      setBusy(true);
      const min = minPrice.trim() === "" ? undefined : Number(minPrice);
      const max = maxPrice.trim() === "" ? undefined : Number(maxPrice);
      const result = await listProducts(
        institute,
        {
          query: debounced,
          ...(category !== "all" ? { category } : {}),
          ...(condition !== "all" ? { condition } : {}),
          ...(min !== undefined && Number.isFinite(min) ? { minPrice: min } : {}),
          ...(max !== undefined && Number.isFinite(max) ? { maxPrice: max } : {}),
          sort,
        },
        nextPage,
      );
      setProducts((prev) => (append ? [...prev, ...result.items] : result.items));
      setHasMore(result.hasMore);
      setPage(nextPage);
      setLoading(false);
      setBusy(false);
    },
    [institute, debounced, category, condition, minPrice, maxPrice, sort],
  );

  useEffect(() => {
    void load(0);
    void listWishlistIds().then(setWishlist);
    setRecent(recentProductIds());
  }, [load]);

  const visibleProducts = useMemo(
    () => (department ? products.filter((p) => p.department === department) : products),
    [products, department],
  );

  const sections = useMemo(
    () => ({
      newArrivals: [...visibleProducts]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
      under500: visibleProducts.filter((p) => p.price < 500).slice(0, 8),
      books: visibleProducts.filter((p) => p.category === "old_books").slice(0, 8),
      recent: recent
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as ShopProduct[],
    }),
    [visibleProducts, recent, products],
  );

  if (profileLoading) {
    return (
      <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto max-w-md space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }
  async function toggleHeart(id: string) {
    const wasActive = wishlist.includes(id);
    setWishlist((prev) => (wasActive ? prev.filter((x) => x !== id) : [...prev, id]));
    try {
      const active = await toggleWishlist(id, wasActive);
      setWishlist((prev) =>
        active ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id),
      );
    } catch {
      setWishlist((prev) => (wasActive ? [...prev, id] : prev.filter((x) => x !== id)));
    }
  }

  const cardProps = { wishlist, onToggleWishlist: (id: string) => void toggleHeart(id) };

  function horizontal(title: string, items: ShopProduct[]) {
    if (items.length === 0) return null;
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-bold">{title}</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {items.map((p) => (
            <div key={p.id} className="w-36 shrink-0">
              <ProductCard product={p} compact {...cardProps} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="bg-desk min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Link to="/" aria-label="Back to home">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft />
            </Button>
          </Link>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items / আইটেম খুঁজুন"
              aria-label="Search shop items"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Filters and sort"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal />
          </Button>
        </div>
        <div className="mx-auto mt-2 flex max-w-md gap-1 rounded-xl bg-muted p-1">
          {SEGMENTS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex-1 rounded-lg py-1.5 text-center text-[10px] font-semibold text-muted-foreground hover:bg-card hover:text-primary"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
        <section className="rounded-2xl bg-hero px-4 py-4 text-primary-foreground">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
            <Store className="size-3.5" /> Campus Shop
          </p>
          <h1 className="font-display mt-1 text-lg font-bold">
            Find it on campus / ক্যাম্পাসে খুঁজে নিন
          </h1>
          <p className="mt-1 text-[11px] text-primary-foreground/75">
            Buy and sell used items. Pay in person.
          </p>
        </section>

        {!profile && (
          <Link
            to="/shop/new"
            className="block rounded-2xl border border-emerald bg-emerald-soft p-3 text-xs font-semibold text-emerald"
          >
            Sell something? Set up your shop first / কিছু বেচতে চান? আগে দোকান খুলুন →
          </Link>
        )}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`grid w-16 shrink-0 place-items-center gap-1 rounded-2xl border p-2 text-[9px] font-semibold ${category === "all" ? "border-emerald bg-emerald-soft text-emerald" : "border-border bg-card text-muted-foreground"}`}
          >
            <Package className="size-5" /> All
          </button>
          {SHOP_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.id];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`grid w-16 shrink-0 place-items-center gap-1 rounded-2xl border p-2 text-center text-[9px] font-semibold leading-tight ${category === c.id ? "border-emerald bg-emerald-soft text-emerald" : "border-border bg-card text-muted-foreground"}`}
              >
                <Icon className="size-5" /> {c.label.split(" / ")[0]}
              </button>
            );
          })}
        </div>

        {!online && (
          <p className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-[11px] text-muted-foreground">
            <WifiOff className="size-4" /> Offline — showing cached items / অফলাইন
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="aspect-square bg-muted" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {horizontal("New arrivals / নতুন আইটেম", sections.newArrivals)}
            {horizontal("Under ৳500 / ৫০০ টাকার কম", sections.under500)}
            {horizontal("Old Books / পুরোনো বই", sections.books)}
            {horizontal("Recently viewed / সম্প্রতি দেখা", sections.recent)}

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">All items / সব আইটেম</h2>
                <span className="text-[10px] text-muted-foreground">
                  {visibleProducts.length} found
                </span>
              </div>
              {visibleProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No items found / কোনো আইটেম পাওয়া যায়নি।
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {visibleProducts.map((p) => (
                    <ProductCard key={p.id} product={p} {...cardProps} />
                  ))}
                </div>
              )}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void load(page + 1, true)}
                  >
                    {busy ? "Loading…" : "Load more / আরও"}
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Link
        to="/shop/new"
        aria-label="Sell an item"
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-full bg-emerald text-emerald-foreground shadow-[var(--shadow-float)]"
      >
        <Plus className="size-6" />
      </Link>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="fixed bottom-0 left-0 top-auto w-full max-w-none translate-x-0 translate-y-0 rounded-t-3xl border-t bg-background p-5">
          <DialogHeader>
            <DialogTitle>Filters / ফিল্টার</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Select
              value={condition}
              onValueChange={(v) => setCondition(v as ShopCondition | "all")}
            >
              <SelectTrigger aria-label="Condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any condition</SelectItem>
                {SHOP_CONDITIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger aria-label="Department">
                <SelectValue placeholder="Department / বিভাগ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All departments</SelectItem>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <SelectItem key={d.key} value={d.english}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price"
                placeholder="Min ৳"
              />
              <Input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price"
                placeholder="Max ৳"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as ShopSort)}>
              <SelectTrigger aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest / নতুন</SelectItem>
                <SelectItem value="price_asc">Price low → high</SelectItem>
                <SelectItem value="price_desc">Price high → low</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCategory("all");
                  setCondition("all");
                  setDepartment("");
                  setMinPrice("");
                  setMaxPrice("");
                  setSort("newest");
                }}
              >
                Reset
              </Button>
              <Button
                variant="emerald"
                className="flex-1"
                onClick={() => {
                  setFiltersOpen(false);
                  void load(0);
                }}
              >
                Apply / প্রয়োগ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
