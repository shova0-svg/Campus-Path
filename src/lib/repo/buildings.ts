import type { Building } from "@/lib/campus-data";
import { db } from "./client";

type Row = {
  id: string;
  institute_id: string;
  name: string;
  look: string | null;
  style: string | null;
  is_academic: boolean;
  distances: Record<string, number> | null;
  is_custom: boolean;
};

export type StoredBuilding = Building & { instituteId: string; isCustom: boolean };

export function fromRow(row: Row): StoredBuilding {
  return {
    id: row.id,
    instituteId: row.institute_id,
    name: row.name,
    look: row.look ?? "",
    isAcademic: row.is_academic,
    distance: (row.distances ?? {}) as Building["distance"],
    isCustom: row.is_custom,
  };
}

export async function listBuildings(): Promise<StoredBuilding[]> {
  const { data, error } = await db.from("buildings").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function upsertBuildingRow(building: StoredBuilding): Promise<StoredBuilding> {
  const { data, error } = await db
    .from("buildings")
    .upsert({
      id: building.id,
      institute_id: building.instituteId,
      name: building.name,
      look: building.look,
      style: "",
      is_academic: building.isAcademic,
      distances: building.distance,
      is_custom: building.isCustom,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function removeBuildingRow(id: string): Promise<void> {
  const { error } = await db.from("buildings").delete().eq("id", id);
  if (error) throw error;
}
