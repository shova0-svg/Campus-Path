import { db } from "./client";

export async function listWishlistIds(): Promise<string[]> {
  try {
    const { data, error } = await db.from("shop_wishlist").select("product_id");
    if (error) throw error;
    return (data ?? []).map((r) => String((r as { product_id: string }).product_id));
  } catch {
    return [];
  }
}

export async function toggleWishlist(productId: string, active: boolean): Promise<boolean> {
  if (active) {
    const { error } = await db.from("shop_wishlist").delete().eq("product_id", productId);
    if (error) throw error;
    return false;
  }
  const { error } = await db.from("shop_wishlist").insert({ product_id: productId });
  if (error) throw error;
  return true;
}
