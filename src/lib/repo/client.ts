import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generated types only know the `profiles` table; the Phase 1 tables are not in
 * routeTree/types yet. Use an untyped client in the repo layer only.
 */
export const db = supabase as unknown as SupabaseClient;
