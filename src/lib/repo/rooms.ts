import type { CampusLocation } from "@/lib/campus-data";
import { db } from "./client";

type Row = {
  id: string;
  institute_id: string;
  building_id: string;
  room_no: string;
  name: string;
  type: string;
  floor: number;
  data: Record<string, unknown> | null;
};

export type StoredRoom = CampusLocation & { instituteId: string };

export function fromRow(row: Row): StoredRoom {
  const data = row.data ?? {};
  return {
    ...(data as unknown as CampusLocation),
    id: row.id,
    instituteId: row.institute_id,
    name: row.name,
    buildingId: row.building_id,
    floor: row.floor,
    category: (["classroom", "lab", "office", "facility"].includes(row.type)
      ? row.type
      : "classroom") as CampusLocation["category"],
    ...(row.room_no ? { roomNo: Number(row.room_no) } : {}),
  };
}

export async function listRooms(): Promise<StoredRoom[]> {
  const { data, error } = await db.from("rooms").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function upsertRoomRow(room: StoredRoom): Promise<StoredRoom> {
  const { id: _id, instituteId, category, roomNo: _roomNo, ...rest } = room;
  const { data, error } = await db
    .from("rooms")
    .upsert({
      id: room.id,
      institute_id: instituteId,
      building_id: room.buildingId,
      room_no: room.roomNo != null ? String(room.roomNo) : "",
      name: room.name,
      type: category,
      floor: room.floor,
      data: rest,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function removeRoomRow(id: string): Promise<void> {
  const { error } = await db.from("rooms").delete().eq("id", id);
  if (error) throw error;
}
