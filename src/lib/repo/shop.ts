import { supabase } from "@/integrations/supabase/client";
import { SHOP_BUCKET, compressForUpload, shopImageUrl } from "@/lib/shop-image";
import {
  MAX_IMAGES,
  type ProductInput,
  type ShopBan,
  type ShopCategory,
  type ShopCondition,
  type ShopFilters,
  type ShopProduct,
  type ShopReport,
  type ShopSort,
  type ShopStatus,
} from "@/lib/shop";
import { db } from "./client";

const BUCKET = SHOP_BUCKET;

type Row = {
  id: string;
  seller_id: string;
  institute_id: string;
  title: string;
  description: string;
  category: string;
  item_condition: string;
  price: string | number;
  is_negotiable: boolean;
  images: string[] | null;
  quantity: number;
  views: number;
  department: string | null;
  semester: number | null;
  pickup_location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function fromRow(row: Row): ShopProduct {
  return {
    id: row.id,
    sellerId: row.seller_id,
    instituteId: row.institute_id,
    title: row["title"],
    description: row["description"],
    category: row["category"] as ShopCategory,
    condition: row["item_condition"] as ShopCondition,
    price: Number(row["price"]),
    isNegotiable: row["is_negotiable"],
    images: row["images"] ?? [],
    quantity: row.quantity ?? 1,
    views: row.views ?? 0,
    ...(row["department"] ? { department: row["department"] } : {}),
    ...(row["semester"] != null ? { semester: row["semester"] } : {}),
    ...(row["pickup_location"] ? { pickupLocation: row["pickup_location"] } : {}),
    status: row.status as ShopStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isMissingShopTable(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "PGRST205" || code === "42P01" || code === "404";
}

export interface ProductPage {
  items: ShopProduct[];
  hasMore: boolean;
}

/** Feed query. Sold/removed rows are hidden by the RLS policy as well. */
export async function listProducts(
  instituteId: string,
  filters: ShopFilters = {},
  page = 0,
  pageSize = 12,
): Promise<ProductPage> {
  const empty = { items: [], hasMore: false };
  try {
    let query = db
      .from("shop_products")
      .select("*")
      .eq("institute_id", instituteId)
      .in("status", ["available", "active", "reserved", "sold"]);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.condition) query = query.eq("item_condition", filters.condition);
    if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
    if (filters.query?.trim()) {
      const q = filters.query.trim();
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }
    const sort: ShopSort = filters.sort ?? "newest";
    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    const from = page * pageSize;
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    const items = (data ?? []).map((r) => fromRow(r as Row));
    return { items, hasMore: items.length === pageSize };
  } catch {
    return empty; // missing table / offline: caller renders the empty state
  }
}

export async function getProduct(id: string): Promise<ShopProduct | null> {
  const { data, error } = await db.from("shop_products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : null;
}

export async function listMyProducts(
  sellerId: string,
  instituteId?: string,
): Promise<ShopProduct[]> {
  let query = db
    .from("shop_products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (instituteId) query = query.eq("institute_id", instituteId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

function toRow(input: ProductInput): Record<string, unknown> {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    item_condition: input.condition,
    price: Number(input.price),
    is_negotiable: input.isNegotiable,
    images: input.images.slice(0, MAX_IMAGES),
    quantity: Math.max(0, input.quantity),
    ...(input.department ? { department: input.department.trim() } : {}),
    ...(input.semester != null ? { semester: input.semester } : {}),
    ...(input.pickupLocation ? { pickup_location: input.pickupLocation.trim().slice(0, 100) } : {}),
  };
}

export async function createProduct(
  input: ProductInput & { sellerId: string; instituteId: string },
): Promise<ShopProduct> {
  const { data, error } = await db
    .from("shop_products")
    .insert({ ...toRow(input), seller_id: input.sellerId, institute_id: input.instituteId })
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<ShopProduct> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row["title"] = patch.title.trim();
  if (patch.description !== undefined) row["description"] = patch.description.trim();
  if (patch.category !== undefined) row["category"] = patch.category;
  if (patch.condition !== undefined) row["item_condition"] = patch.condition;
  if (patch.price !== undefined) row["price"] = Number(patch.price);
  if (patch.isNegotiable !== undefined) row["is_negotiable"] = patch.isNegotiable;
  if (patch.images !== undefined) row["images"] = patch.images.slice(0, MAX_IMAGES);
  if (patch.quantity !== undefined) row["quantity"] = Math.max(0, patch.quantity);
  if (patch.department !== undefined) row["department"] = patch.department.trim() || null;
  if (patch.semester !== undefined) row["semester"] = patch.semester;
  if (patch.pickupLocation !== undefined)
    row["pickup_location"] = patch.pickupLocation.trim().slice(0, 100) || null;
  const { data, error } = await db
    .from("shop_products")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function setProductStatus(id: string, status: ShopStatus): Promise<void> {
  const { error } = await db.from("shop_products").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await db.from("shop_products").delete().eq("id", id);
  if (error) throw error;
}

export async function getSellerName(sellerId: string): Promise<string> {
  try {
    const { data, error } = await db.rpc("shop_seller_name", { _seller: sellerId });
    if (error) return "Student";
    return String(data ?? "Student");
  } catch {
    return "Student";
  }
}

export async function relistProduct(id: string): Promise<void> {
  const { error } = await db
    .from("shop_products")
    .update({ status: "available", quantity: 1 })
    .eq("id", id);
  if (error) throw error;
}

export async function incrementProductViews(id: string): Promise<void> {
  try {
    await db.rpc("shop_increment_views", { p_product: id });
  } catch {
    /* view counting is best-effort */
  }
}

export async function reportProduct(productId: string, reason: string): Promise<void> {
  const { error } = await db
    .from("shop_reports")
    .insert({ product_id: productId, reason: reason.trim() });
  if (error) throw error; // unique(product_id, reporter_id) prevents a second report
}

export async function listReports(instituteId?: string): Promise<ShopReport[]> {
  try {
    const { data, error } = await db
      .from("shop_reports")
      .select("*, shop_products(institute_id)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const rows = (data ?? []) as (Record<string, unknown> & {
      shop_products: { institute_id: string } | null;
    })[];
    return rows
      .filter((r) => !instituteId || r.shop_products?.institute_id === instituteId)
      .map((r) => ({
        id: String(r["id"]),
        productId: String(r["product_id"]),
        reporterId: String(r["reporter_id"]),
        reason: String(r["reason"]),
        createdAt: String(r["created_at"]),
      }));
  } catch {
    return [];
  }
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await db.from("shop_reports").delete().eq("id", id);
  if (error) throw error;
}

export async function listBans(instituteId?: string): Promise<ShopBan[]> {
  try {
    let query = db.from("shop_bans").select("*").order("created_at", { ascending: false });
    if (instituteId) query = query.eq("institute_id", instituteId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      userId: String(r.user_id),
      instituteId: String(r.institute_id ?? ""),
      reason: String(r["reason"] ?? ""),
      createdAt: String(r["created_at"]),
    }));
  } catch {
    return [];
  }
}

export async function banUser(input: {
  userId: string;
  instituteId: string;
  reason: string;
}): Promise<void> {
  const { error } = await db.from("shop_bans").insert({
    user_id: input.userId,
    institute_id: input.instituteId,
    reason: input.reason.trim(),
  });
  if (error) throw error;
}

export async function unbanUser(userId: string): Promise<void> {
  const { error } = await db.from("shop_bans").delete().eq("user_id", userId);
  if (error) throw error;
}

/* ---------------- Shop profile ---------------- */

export interface ShopProfileRow {
  user_id: string;
  shop_name: string;
  avatar_url: string | null;
  bio: string;
  phone: string;
  whatsapp: string | null;
  institute_id: string;
  department: string;
  semester: number | null;
  is_verified: boolean;
  total_sold: number;
  show_phone: boolean;
  created_at: string;
}

export async function getMyShopProfile(): Promise<import("@/lib/shop").ShopProfile | null> {
  const { data, error } = await db.from("shop_profiles").select("*").maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as ShopProfileRow;
  return {
    userId: r.user_id,
    shopName: r.shop_name,
    ...(r.avatar_url ? { avatarUrl: r.avatar_url } : {}),
    bio: r.bio,
    phone: r.phone,
    ...(r.whatsapp ? { whatsapp: r.whatsapp } : {}),
    instituteId: r.institute_id,
    department: r.department,
    ...(r.semester != null ? { semester: r.semester } : {}),
    isVerified: r.is_verified,
    totalSold: r.total_sold,
    showPhone: r.show_phone,
    createdAt: r.created_at,
  };
}

export async function saveShopProfile(input: {
  shopName: string;
  bio: string;
  phone: string;
  whatsapp?: string;
  department: string;
  semester?: number;
  avatarUrl?: string;
  showPhone?: boolean;
  instituteId: string;
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sign in first");
  const { error } = await db.from("shop_profiles").upsert({
    user_id: userId,
    shop_name: input.shopName.trim(),
    bio: input.bio.trim(),
    phone: input.phone.trim(),
    ...(input.whatsapp ? { whatsapp: input.whatsapp.trim() } : {}),
    ...(input.avatarUrl ? { avatar_url: input.avatarUrl } : {}),
    institute_id: input.instituteId,
    department: input.department.trim(),
    ...(input.semester != null ? { semester: input.semester } : {}),
    ...(input.showPhone != null ? { show_phone: input.showPhone } : {}),
  });
  if (error) throw error;
}

export async function getShopPublicProfile(userId: string) {
  try {
    const { data, error } = await db.rpc("shop_public_profile", { _seller: userId });
    if (error) throw error;
    return (data ?? [])[0] ?? null;
  } catch {
    return null;
  }
}

export async function getSellerContact(
  userId: string,
): Promise<{ phone: string; whatsapp?: string } | null> {
  try {
    const { data, error } = await db.rpc("shop_seller_contact", { _seller: userId });
    if (error) throw error;
    const row = (data ?? [])[0] as { phone: string; whatsapp: string | null } | undefined;
    if (!row) return null;
    return { phone: row.phone, ...(row.whatsapp ? { whatsapp: row.whatsapp } : {}) };
  } catch {
    return null;
  }
}

export async function uploadShopAvatar(userId: string, file: File): Promise<string> {
  const { blob, type } = await compressForUpload(file);
  if (!blob || blob.size === 0) throw new Error("Empty image / ছবি খালি");
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/avatar-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: type, upsert: false });
  if (error) throw error;
  return path;
}

/* ---------------- Images ---------------- */

/** Deprecated name kept for callers; all screens use the shared helper. */
export const imageUrl = shopImageUrl;

/** Kept for existing callers; delegates to the validated shared compressor. */
export async function compressImage(file: File): Promise<Blob> {
  const { blob } = await compressForUpload(file);
  return blob;
}

export async function uploadShopImages(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  try {
    for (const file of files.slice(0, MAX_IMAGES)) {
      const { blob, type } = await compressForUpload(file);
      if (!blob || blob.size === 0) throw new Error("Empty image / ছবি খালি");
      const extension = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: type, upsert: false });
      if (error) throw error;
      paths.push(path);
    }
    if (paths.length !== Math.min(files.length, MAX_IMAGES))
      throw new Error("Some images failed to upload / কিছু ছবি আপলোড হয়নি");
    return paths;
  } catch (e) {
    if (paths.length) await deleteShopImages(paths);
    throw e;
  }
}

export async function deleteShopImages(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await supabase.storage.from(BUCKET).remove(paths);
}
