import { useState } from "react";
import { DoorOpen } from "lucide-react";

/** Clickable zones over the supplied 3D campus render (1226 × 1283 px). */
type Spot = {
  id: string;
  label: string;
  labelBn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  buildingId?: string;
  detail: string;
};

const W = 1226;
const H = 1283;

/** Percentages taken from the image itself. */
const SPOTS: Spot[] = [
  {
    id: "gate",
    label: "Main Gate",
    labelBn: "প্রধান ফটক",
    x: 23,
    y: 8,
    w: 9,
    h: 6,
    detail: "Main entrance of the institute, just off the Main Road.",
  },
  {
    id: "b1",
    label: "Building Number-01 · Office Room",
    labelBn: "১ নং ভবন · অফিস রুম",
    x: 31,
    y: 11,
    w: 34,
    h: 17,
    buildingId: "admin",
    detail: "3-storey building with the Office Room, Principal and admin sections.",
  },
  {
    id: "teachers",
    label: "Teachers Club",
    labelBn: "শিক্ষক ক্লাব",
    x: 6,
    y: 12,
    w: 16,
    h: 11,
    detail: "Teachers' club room at the north-west corner.",
  },
  {
    id: "scout",
    label: "Scout Building",
    labelBn: "স্কাউট ভবন",
    x: 63,
    y: 13,
    w: 18,
    h: 10,
    detail: "Scout building next to the Office Room.",
  },
  {
    id: "balcony1",
    label: "Balcony",
    labelBn: "ব্যালকনি",
    x: 24,
    y: 24,
    w: 26,
    h: 4,
    detail: "Balcony in front of the Office Room.",
  },
  {
    id: "balcony2",
    label: "Balcony",
    labelBn: "ব্যালকনি",
    x: 63,
    y: 24,
    w: 18,
    h: 4,
    detail: "Balcony in front of the Scout Building.",
  },
  {
    id: "b2",
    label: "Building Number-02 · Class Room",
    labelBn: "২ নং ভবন · ক্লাসরুম",
    x: 6,
    y: 26,
    w: 16,
    h: 32,
    buildingId: "civil",
    detail: "3-storey building with class rooms and balcony.",
  },
  {
    id: "b3",
    label: "Building Number-03 · Class Room",
    labelBn: "৩ নং ভবন · ক্লাসরুম",
    x: 83,
    y: 30,
    w: 14,
    h: 33,
    buildingId: "electrical",
    detail: "3-storey building with class rooms and balcony.",
  },
  {
    id: "pond",
    label: "Campus Pond",
    labelBn: "ক্যাম্পাস পুকুর",
    x: 30,
    y: 30,
    w: 45,
    h: 31,
    detail: "Large central pond with paved banks on all four sides.",
  },
  {
    id: "b6",
    label: "Building Number-06 · Lab Room",
    labelBn: "৬ নং ভবন · ল্যাব রুম",
    x: 8,
    y: 62,
    w: 15,
    h: 25,
    buildingId: "mechanical",
    detail: "Single-storey laboratory block (south-west).",
  },
  {
    id: "badminton",
    label: "Badminton Court",
    labelBn: "ব্যাডমিন্টন কোর্ট",
    x: 26,
    y: 67,
    w: 12,
    h: 19,
    detail: "Outdoor badminton court between the lab blocks.",
  },
  {
    id: "b5",
    label: "Building Number-05 · Lab Room",
    labelBn: "৫ নং ভবন · ল্যাব রুম",
    x: 42,
    y: 62,
    w: 15,
    h: 25,
    buildingId: "computer",
    detail: "Single-storey laboratory block (south-center).",
  },
  {
    id: "b4",
    label: "Building Number-04 · Lab Room",
    labelBn: "৪ নং ভবন · ল্যাব রুম",
    x: 65,
    y: 62,
    w: 15,
    h: 25,
    buildingId: "electronics",
    detail: "Single-storey laboratory block (south-east).",
  },
];

export function CampusPhoto({
  selected,
  onSelect,
  onOpenRooms,
}: {
  selected: Spot | null;
  onSelect: (spot: Spot) => void;
  onOpenRooms: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <img
        src="/rpi-campus-3d.jpg"
        alt="3D model of Rajshahi Govt. Polytechnic Institute campus"
        className="block h-auto w-full"
      />

      {/* Transparent click zones on top of the image */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full"
        aria-label="Campus map hotspots"
      >
        {SPOTS.map((spot) => {
          const x = (spot.x / 100) * W;
          const y = (spot.y / 100) * H;
          const w = (spot.w / 100) * W;
          const h = (spot.h / 100) * H;
          const active = selected?.id === spot.id || hover === spot.id;
          return (
            <rect
              key={spot.id}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="10"
              fill={active ? "#10b981" : "transparent"}
              fillOpacity={active ? 0.2 : 0}
              stroke={active ? "#10b981" : "transparent"}
              strokeWidth={active ? 4 : 0}
              className="cursor-pointer"
              role="button"
              aria-label={`${spot.label} — ${spot.detail}`}
              onClick={() => onSelect(spot)}
              onMouseEnter={() => setHover(spot.id)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>

      {selected && (
        <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-card/95 p-3 shadow-[var(--shadow-card)] backdrop-blur">
          <p className="text-sm font-semibold">{selected.label}</p>
          <p className="font-bangla text-xs text-muted-foreground">{selected.labelBn}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{selected.detail}</p>
          {selected.buildingId && (
            <button
              type="button"
              onClick={() => onOpenRooms(selected.buildingId!)}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
            >
              <DoorOpen className="size-3.5" /> See rooms
            </button>
          )}
        </div>
      )}
    </div>
  );
}
