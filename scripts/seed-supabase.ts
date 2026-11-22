/**
 * One-time (idempotent) seed of campus data into Supabase.
 * Run: npx tsx scripts/seed-supabase.ts
 * Reads code seeds + rpi-teachers.json and upserts on stable ids.
 */
import { createClient } from "@supabase/supabase-js";
import { INSTITUTES } from "../src/lib/campus-data";
import { DEFAULT_ROUTINES } from "../src/lib/routine";
import { TEACHERS } from "../src/lib/teachers";

const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
const key =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  process.env["SUPABASE_PUBLISHABLE_KEY"] ||
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

if (!url || !key) {
  console.error("Missing SUPABASE_URL or key (service role recommended). See AGENTS.md.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function groupFromTitle(title: string): string {
  const m = title.match(/group\s+([a-z0-9]+)/i);
  return m ? m[1]!.toUpperCase() : "";
}

async function main() {
  // institutes
  const institutes = INSTITUTES.map((i) => ({
    id: i.id,
    name: i.name,
    division: i.division ?? "",
    is_government: i.type === "government",
  }));
  const { error: e1 } = await db.from("institutes").upsert(institutes);
  if (e1) throw e1;
  console.log(`institutes: ${institutes.length}`);

  // buildings
  const buildings = INSTITUTES.flatMap((i) =>
    i.buildings.map((b) => ({
      id: `${i.id}-${b.id}`,
      institute_id: i.id,
      name: b.name,
      look: b.look ?? "",
      style: "",
      is_academic: b.isAcademic,
      distances: b.distance ?? {},
      is_custom: false,
    })),
  );
  const { error: e2 } = await db.from("buildings").upsert(buildings);
  if (e2) throw e2;
  console.log(`buildings: ${buildings.length}`);

  // rooms
  const rooms = INSTITUTES.flatMap((i) =>
    i.locations.map((r) => ({
      id: `${i.id}-${r.id}`,
      institute_id: i.id,
      building_id: `${i.id}-${r.buildingId}`,
      room_no: r.roomNo != null ? String(r.roomNo) : "",
      name: r.name,
      type: r.category,
      floor: r.floor,
      data: r as unknown as Record<string, unknown>,
    })),
  );
  // Only insert rooms whose building FK exists in the seeded buildings set.
  const buildingIds = new Set(buildings.map((b) => b.id));
  const validRooms = rooms.filter((r) => buildingIds.has(r.building_id));
  const { error: e3 } = await db.from("rooms").upsert(validRooms);
  if (e3) throw e3;
  console.log(`rooms: ${validRooms.length}`);

  // routines
  const routines = DEFAULT_ROUTINES.map((r) => {
    const { instituteId, ...data } = r;
    return {
      id: r.id,
      institute_id: instituteId,
      department: r.department,
      semester: r.semester,
      group: groupFromTitle(r.title),
      shift: r.shift,
      data: data as unknown as Record<string, unknown>,
      version: 1,
    };
  });
  const { error: e4 } = await db.from("routines").upsert(routines);
  if (e4) throw e4;
  console.log(`routines: ${routines.length}`);

  // teachers
  const teachers = TEACHERS.map((t) => ({
    id: `${t.instituteId ?? "rpi"}-${slug(t.facultyKey)}-${slug(t.name)}`,
    institute_id: t.instituteId ?? "rpi",
    department: t.department || t.faculty,
    name: t.name,
    designation: t.designation,
    phone: t.mobile,
    email: t.email,
    photo_url: t.photo,
    room_no: t.room,
    data: t as unknown as Record<string, unknown>,
  }));
  const { error: e5 } = await db.from("teachers").upsert(teachers);
  if (e5) throw e5;
  console.log(`teachers: ${teachers.length}`);

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
