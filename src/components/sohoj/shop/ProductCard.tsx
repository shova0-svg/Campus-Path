import { Link } from "@tanstack/react-router";
import { Heart, Store } from "lucide-react";
import { categoryLabel, conditionLabel, formatPrice, timeAgo, type ShopProduct } from "@/lib/shop";
import { imageUrl } from "@/lib/repo/shop";

interface Props {
  product: ShopProduct;
  wishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  compact?: boolean;
}

export function ProductCard({ product, wishlisted, onToggleWishlist, compact }: Props) {
  return (
    <div className="animate-rise relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30">
      <Link
        to="/shop/$productId"
        params={{ productId: product.id }}
        className={compact ? "block w-36 shrink-0" : "block"}
      >
        <div
          className={
            compact ? "relative aspect-square bg-muted" : "relative aspect-square bg-muted"
          }
        >
          {product.images[0] ? (
            <img
              src={imageUrl(product.images[0]!)}
              alt={product.title}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <Store className="size-8" />
            </span>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[9px] font-bold text-foreground backdrop-blur">
            {conditionLabel(product.condition).split(" / ")[0]}
          </span>
          {product.status === "reserved" && (
            <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
              Reserved
            </span>
          )}
        </div>
        <div className="space-y-1 p-2.5">
          <p className="line-clamp-2 min-h-8 text-xs font-semibold leading-tight">
            {product.title}
          </p>
          <p className="text-sm font-bold text-emerald">
            {formatPrice(product.price)}
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="ml-1 text-[10px] font-normal text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {product.department || categoryLabel(product.category)}
          </p>
          <p className="text-[9px] text-muted-foreground">{timeAgo(product.createdAt)}</p>
        </div>
      </Link>
      {onToggleWishlist && (
        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => onToggleWishlist(product.id)}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card/90 text-muted-foreground backdrop-blur transition-colors hover:text-destructive"
        >
          <Heart className={`size-4 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />
        </button>
      )}
    </div>
  );
}
