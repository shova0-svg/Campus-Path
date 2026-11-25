import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Flag, MessageCircle, Phone, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  categoryLabel,
  conditionLabel,
  formatPrice,
  SAFETY_NOTE,
  timeAgo,
  whatsappLink,
  type ShopProduct,
} from "@/lib/shop";
import {
  getProduct,
  getSellerContact,
  incrementProductViews,
  getSellerName,
  imageUrl,
  reportProduct,
} from "@/lib/repo/shop";

export const Route = createFileRoute("/shop/$productId")({
  head: () => ({ meta: [{ title: "Item details — Campus Path" }] }),
  component: ProductDetail,
});

function ProductDetail() {
  const { productId } = Route.useParams();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [seller, setSeller] = useState("Student");
  const [contact, setContact] = useState<{ phone: string; whatsapp?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const counted = useRef(false);
  const [reason, setReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let active = true;
    void getProduct(productId).then(async (p) => {
      if (!active) return;
      setProduct(p);
      setLoading(false);
      if (p) {
        if (!counted.current) {
          counted.current = true;
          void incrementProductViews(p.id);
        }
        setSeller(await getSellerName(p.sellerId));
        setContact(await getSellerContact(p.sellerId));
      }
    });
    return () => {
      active = false;
    };
  }, [productId]);

  async function submitReport() {
    if (reason.trim().length < 5) {
      toast.error("কারণ লিখুন / Reason must be at least 5 characters");
      return;
    }
    setReporting(true);
    try {
      await reportProduct(productId, reason);
      toast.success("Reported. Admin will review it.");
      setReportOpen(false);
      setReason("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(
        /duplicate|unique/i.test(msg)
          ? "আপনি ইতিমধ্যে এই আইটেমটি রিপোর্ট করেছেন / Already reported"
          : "রিপোর্ট করা যায় ni / Could not report",
      );
    } finally {
      setReporting(false);
    }
  }

  async function copyNumber(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Number copied / নম্বর কপি হয়েছে");
    } catch {
      toast.error("Copy failed — number: " + phone);
    }
  }

  if (loading) {
    return (
      <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto max-w-md space-y-3">
          <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-desk grid min-h-dvh place-items-center px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <Store className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Item not found / আইটেম পাওয়া যায়নি</p>
          <Button className="mt-4" asChild>
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images.map(imageUrl);

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/shop" aria-label="Back to shop">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Back to shop</span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setReportOpen(true)}>
            <Flag /> Report
          </Button>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          {images.length > 0 ? (
            <>
              <div className="relative aspect-square bg-muted">
                <img
                  src={images[slide] ?? images[0]}
                  alt={product.title}
                  className="size-full object-cover"
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                  {slide + 1}/{images.length}
                </span>
              </div>
              {images.length > 1 && (
                <div className="flex items-center justify-between gap-2 p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSlide((s) => (s - 1 + images.length) % images.length)}
                  >
                    ← Prev
                  </Button>
                  <div className="flex gap-1">
                    {images.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        aria-label={`Image ${i + 1}`}
                        onClick={() => setSlide(i)}
                        className={`size-2 rounded-full ${i === slide ? "bg-emerald" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSlide((s) => (s + 1) % images.length)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="grid aspect-square place-items-center bg-muted text-muted-foreground">
              <Store className="size-10" />
            </div>
          )}

          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-soft px-2.5 py-1 text-[11px] font-bold text-emerald">
                {conditionLabel(product.condition)}
              </span>
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
                {product.status === "reserved" ? "Reserved / রিজার্ভ" : "Available / বিক্রয়যোগ্য"}
              </span>
              {product.isNegotiable && (
                <span className="text-[10px] text-muted-foreground">
                  Negotiable / দরদাম করা যাবে
                </span>
              )}
            </div>
            <h1 className="font-display text-lg font-bold leading-tight">{product.title}</h1>
            <p className="text-2xl font-bold text-emerald">{formatPrice(product.price)}</p>
            <p className="text-[11px] text-muted-foreground">
              {categoryLabel(product.category)} · {timeAgo(product.createdAt)}
            </p>
            {product.description && (
              <p className="whitespace-pre-wrap text-sm text-foreground/85">
                {product.description}
              </p>
            )}
            <div className="rounded-2xl bg-muted/60 p-3 text-xs">
              <p className="font-semibold">{seller}</p>
              <p className="text-muted-foreground">
                {[product.department, product.semester ? `Sem ${product.semester}` : ""]
                  .filter(Boolean)
                  .join(" · ") || "Campus seller"}
              </p>
            </div>
            <p className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary-soft p-3 text-[11px] text-primary">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" /> {SAFETY_NOTE}
            </p>
          </div>
        </section>

        {contact ? (
          <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button asChild className="bg-emerald text-emerald-foreground hover:bg-emerald/90">
              <a href={`tel:${contact.phone}`}>
                <Phone /> Call / কল
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={whatsappLink(contact.whatsapp || contact.phone)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle /> WhatsApp
              </a>
            </Button>
            <Button variant="outline" onClick={() => void copyNumber(contact.phone)}>
              <Copy /> Copy number
            </Button>
          </section>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card p-3 text-center text-[11px] text-muted-foreground">
            Sign in to contact this seller / যোগাযোগ করতে লগইন করুন
          </p>
        )}
      </main>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Report this item / আইটেম রিপোর্ট</DialogTitle>
            <DialogDescription>Admin will review it. Please give a short reason.</DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={4}
            aria-label="Report reason"
            placeholder="কারণ লিখুন / Reason…"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring"
          />
          <p className="text-right text-[10px] text-muted-foreground">{reason.length}/500</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button variant="emerald" onClick={() => void submitReport()} disabled={reporting}>
              {reporting ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
