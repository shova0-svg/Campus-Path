/** Pure helpers for Campus Shop. No network calls, no UI imports. */

export const SHOP_CATEGORIES = [
  { id: "old_books", label: "Old Books / পুরোনো বই" },
  { id: "drawing_tools", label: "T-Scale & Drawing Tools / টি-স্কেল ও ড্রইং সরঞ্জাম" },
  { id: "engineering_instruments", label: "Engineering Instruments / ইঞ্জিনিয়ারিং যন্ত্র" },
  { id: "electronics", label: "Electronics / ইলেকট্রনিক্স" },
  { id: "others", label: "Others / অন্যান্য" },
] as const;

export const SHOP_CONDITIONS = [
  { id: "new", label: "New / নতুন" },
  { id: "like_new", label: "Like new / প্রায় নতুন" },
  { id: "used", label: "Used / ব্যবহৃত" },
  { id: "old", label: "Old / পুরোনো" },
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number]["id"];
export type ShopCondition = (typeof SHOP_CONDITIONS)[number]["id"];
export type ShopStatus = "available" | "reserved" | "sold" | "removed";
export type ShopSort = "newest" | "price_asc" | "price_desc";

export const MAX_ACTIVE_LISTINGS = 10;
export const MAX_IMAGES = 4;
export const SAFETY_NOTE =
  "Meet on campus, check the item before paying, pay in person. / ক্যাম্পাসে দেখা করুন, আগে জিনিস দেখে তারপর টাকা দিন।";

export interface ShopProduct {
  id: string;
  sellerId: string;
  instituteId: string;
  title: string;
  description: string;
  category: ShopCategory;
  condition: ShopCondition;
  price: number;
  isNegotiable: boolean;
  images: string[];
  contactPhone: string;
  contactWhatsapp?: string;
  department?: string;
  semester?: number;
  status: ShopStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ShopReport {
  id: string;
  productId: string;
  reporterId: string;
  reason: string;
  createdAt: string;
}

export interface ShopBan {
  userId: string;
  instituteId: string;
  reason: string;
  createdAt: string;
}

export interface ProductInput {
  title: string;
  description: string;
  category: ShopCategory | "";
  condition: ShopCondition | "";
  price: string | number;
  isNegotiable: boolean;
  images: string[];
  contactPhone: string;
  contactWhatsapp?: string;
  department?: string;
  semester?: number;
}

export interface ShopFilters {
  query?: string;
  category?: ShopCategory;
  condition?: ShopCondition;
  minPrice?: number;
  maxPrice?: number;
  sort?: ShopSort;
}

export function categoryLabel(id: string): string {
  return SHOP_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function conditionLabel(id: string): string {
  return SHOP_CONDITIONS.find((c) => c.id === id)?.label ?? id;
}

export function isValidPhone(value: string): boolean {
  return /^[0-9+() -]{6,20}$/.test(value.trim());
}

export function normalizePhone(value: string): string {
  return value.trim();
}

/** Client mirror of the database CHECK constraints. */
export function validateProduct(input: ProductInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = input.title.trim();
  if (title.length < 3 || title.length > 100)
    errors["title"] = "শিরোনাম ৩–১০০ অক্ষর / Title 3–100 characters";
  if (input.description.trim().length > 2000)
    errors["description"] = "বার্তা সর্বোচ্চ ২০০০ অক্ষর / Max 2000 characters";
  if (!SHOP_CATEGORIES.some((c) => c.id === input.category))
    errors["category"] = "ক্যাটাগরি বেছে নিন / Choose a category";
  if (!SHOP_CONDITIONS.some((c) => c.id === input.condition))
    errors["condition"] = "অবস্থা বেছে নিন / Choose a condition";
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 10000000)
    errors["price"] = "সঠিক দাম দিন / Valid price required";
  if (input.images.length < 1 || input.images.length > MAX_IMAGES)
    errors["images"] = `১–${MAX_IMAGES} ছবি দিন / 1–${MAX_IMAGES} images`;
  if (!isValidPhone(input.contactPhone))
    errors["contactPhone"] = "সঠিক ফোন নম্বর দিন / Valid phone number";
  if (input.contactWhatsapp && !isValidPhone(input.contactWhatsapp))
    errors["contactWhatsapp"] = "সঠিক WhatsApp নম্বর / Valid WhatsApp number";
  return errors;
}

export function formatPrice(price: number): string {
  return `৳${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function isActive(product: ShopProduct): boolean {
  return product.status === "available" || product.status === "reserved";
}

export function filterProducts(products: ShopProduct[], filters: ShopFilters): ShopProduct[] {
  const q = filters.query?.trim().toLowerCase();
  return products.filter((p) => {
    if (!isActive(p)) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.condition && p.condition !== filters.condition) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (q && !`${p.title} ${p.description} ${categoryLabel(p.category)}`.toLowerCase().includes(q))
      return false;
    return true;
  });
}

export function sortProducts(products: ShopProduct[], sort: ShopSort = "newest"): ShopProduct[] {
  return [...products].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/** Dhaka-relative short label; `now` is injectable for tests. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  const diff = now.getTime() - then;
  if (diff < 60 * 60 * 1000) return "এখনই / Just now";
  if (diff < day) return `${Math.floor(diff / (60 * 60 * 1000))} ঘণ্টা আগে / h ago`;
  if (diff < 2 * day) return "কাল / Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} দিন আগে / d ago`;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function whatsappLink(phone: string, message = "Hi, is this item still available?"): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function fileSizeLabel(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
