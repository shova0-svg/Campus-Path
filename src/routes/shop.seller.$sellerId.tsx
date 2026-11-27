import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/sohoj/shop/ProductCard";
import { ShopImage } from "@/components/sohoj/shop/ShopImage";
import { getShopPublicProfile, imageUrl, listMyProducts } from "@/lib/repo/shop";
import type { ShopProduct } from "@/lib/shop";

export const Route = createFileRoute("/shop/seller/$sellerId")({
  head: () => ({ meta: [{ title: "Seller shop — Campus Path" }] }),
  component: SellerShop,
});

function SellerShop() {
  const { sellerId } = Route.useParams();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getShopPublicProfile>>>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getShopPublicProfile(sellerId).catch(() => null),
      listMyProducts(sellerId).catch(() => []),
    ]).then(([p, rows]) => {
      if (!active) return;
      setProfile(p);
      setProducts(rows.filter((r) => r.status === "available" || r.status === "reserved"));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [sellerId]);

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <Link to="/shop" aria-label="Back to shop">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <ArrowLeft /> Shop
          </Button>
        </Link>

        <section className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          {profile?.avatar_url ? (
            <img
              src={imageUrl(profile.avatar_url)}
              alt=""
              className="size-14 rounded-2xl object-cover"
            />
          ) : (
            <span className="grid size-14 place-items-center rounded-2xl bg-emerald-soft text-emerald">
              <Store className="size-6" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-bold">
              {profile?.shop_name ?? "Campus seller"}
              {profile?.is_verified && <BadgeCheck className="size-4 text-emerald" />}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {[profile?.department, profile?.institute_id].filter(Boolean).join(" · ")}
            </p>
            <p className="text-[10px] text-muted-foreground">{profile?.total_sold ?? 0} sold</p>
          </div>
        </section>

        {profile?.bio && (
          <p className="rounded-2xl border border-border bg-card p-3 text-xs">{profile.bio}</p>
        )}

        <h2 className="text-sm font-bold">Active items / চলতি আইটেম</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No active items / কোনো চলতি আইটেম নেই।
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
