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
export type ShopStatus = "available" | "reserved" | "sold" | "removed" | "hidden";
export type ShopSort = "newest" | "price_asc" | "price_desc";

export const MAX_ACTIVE_LISTINGS = 10;
export const MAX_IMAGES = 5;
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
  /** Optional client-only price history; not stored in the DB. */
  oldPrice?: number;
  isNegotiable: boolean;
  images: string[];
  quantity: number;
  views: number;
  department?: string;
  semester?: number;
  pickupLocation?: string;
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
  quantity: number;
  department?: string;
  semester?: number;
  pickupLocation?: string;
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
  if (title.length < 1 || title.length > 100)
    errors["title"] = "শিরোনাম ৩–১০০ অক্ষর / Title 3–100 characters";
  if (input.description.trim().length > 2000)
    errors["description"] = "বার্তা সর্বোচ্চ ২০০০ অক্ষর / Max 2000 characters";
  if (!SHOP_CATEGORIES.some((c) => c.id === input.category))
    errors["category"] = "ক্যাটাগরি বেছে নিন / Choose a category";
  if (!SHOP_CONDITIONS.some((c) => c.id === input.condition))
    errors["condition"] = "অবস্থা বেছে নিন / Choose a condition";
  const price = Number(input.price);
  if (!Number.isInteger(price) || price < 0 || price > 10000000)
    errors["price"] = "সঠিক দাম দিন / Valid price required";
  if (input.images.length < 1 || input.images.length > MAX_IMAGES)
    errors["images"] = `১–${MAX_IMAGES} ছবি দিন / 1–${MAX_IMAGES} images`;
  if ((input.pickupLocation ?? "").length > 100)
    errors["pickupLocation"] = "পিকআপ স্থান সর্বোচ্চ ১০০ অক্ষর / Pickup location max 100 characters";
  return errors;
}

export function formatPrice(price: number): string {
  return `৳${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function isActive(product: ShopProduct): boolean {
  return ["available", "active", "reserved", "sold"].includes(product.status);
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

export interface ShopProfile {
  userId: string;
  shopName: string;
  avatarUrl?: string;
  bio: string;
  phone: string;
  whatsapp?: string;
  instituteId: string;
  department: string;
  semester?: number;
  isVerified: boolean;
  totalSold: number;
  showPhone: boolean;
  createdAt: string;
}

export interface ShopProfileInput {
  shopName: string;
  bio: string;
  phone: string;
  whatsapp?: string;
  department: string;
  semester?: number;
  avatarUrl?: string;
  showPhone?: boolean;
}

/** BD mobile: 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX. */
export function isValidBdPhone(value: string): boolean {
  return /^(?:\+?8801\d{9}|01\d{9})$/.test(value.trim());
}

/** Client mirror of the shop_profiles CHECK constraints. */
export function validateShopProfile(input: ShopProfileInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.shopName.trim();
  if (name.length < 2 || name.length > 60)
    errors["shopName"] = "দোকানের নাম ২–৬০ অক্ষর / Shop name 2–60 characters";
  if (input.bio.trim().length > 500) errors["bio"] = "সর্বোচ্চ ৫০০ অক্ষর / Max 500 characters";
  if (!isValidBdPhone(input.phone))
    errors["phone"] = "018XXXXXXXX ফরম্যাটে ফোন দিন / Enter a BD mobile like 01XXXXXXXXX";
  if (input.whatsapp && !isValidBdPhone(input.whatsapp))
    errors["whatsapp"] = "সঠিক WhatsApp নম্বর / Valid WhatsApp number";
  if (!input.department.trim()) errors["department"] = "বিভাগ বেছে নিন / Department required";
  return errors;
}

export const SHOP_STATUS_TABS: { id: ShopStatus; label: string }[] = [
  { id: "available", label: "Active / বিক্রির জন্য" },
  { id: "reserved", label: "Reserved / রিজার্ভ" },
  { id: "sold", label: "Sold / বিক্রি হয়ে গেছে" },
  { id: "hidden", label: "Hidden / লুকানো" },
];

export function statusLabel(status: ShopStatus): string {
  if (status === "removed" || status === "hidden") return "Hidden / লুকানো";
  return SHOP_STATUS_TABS.find((t) => t.id === status)?.label ?? status;
}

/** Server trigger applies the same rule; this keeps the UI in sync. */
export function statusForQuantity(quantity: number, current: ShopStatus): ShopStatus {
  return quantity <= 0 && (current === "available" || current === "reserved") ? "sold" : current;
}

export function canRelist(product: ShopProduct): boolean {
  return product.status === "sold" && product.quantity > 0;
}
