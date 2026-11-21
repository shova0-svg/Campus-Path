import { useState } from "react";

/**
 * Illustration of the supplied 3D campus render, drawn as interactive SVG so it
 * works offline without the source image. Positions and labels follow the photo.
 */
type Spot = {
  id: string;
  label: string;
  labelBn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  buildingId?: string;
  badge?: string;
  badgeX?: number;
  badgeY?: number;
  vertical?: boolean;
  detail: string;
};

const SPOTS: Spot[] = [
  {
    id: "gate",
    label: "Main Gate",
    labelBn: "প্রধান ফটক",
    x: 288,
    y: 122,
    w: 80,
    h: 60,
    badge: "Main Gate",
    badgeX: 328,
    badgeY: 104,
    detail: "Main entrance of the institute, just off the Main Road.",
  },
  {
    id: "b1",
    label: "Building Number-01 · Office Room",
    labelBn: "১ নং ভবন · অফিস রুম",
    x: 385,
    y: 150,
    w: 400,
    h: 190,
    buildingId: "admin",
    badge: "Building Number-01\n3 story building",
    badgeX: 585,
    badgeY: 128,
    detail: "3-storey building with the Office Room, Principal and admin sections.",
  },
  {
    id: "teachers",
    label: "Teachers Club",
    labelBn: "শিক্ষক ক্লাব",
    x: 75,
    y: 160,
    w: 185,
    h: 130,
    badge: "Teachers Club",
    badgeX: 168,
    badgeY: 190,
    detail: "Teachers' club room at the north-west corner.",
  },
  {
    id: "scout",
    label: "Scout Building",
    labelBn: "স্কাউট ভবন",
    x: 780,
    y: 168,
    w: 220,
    h: 120,
    badge: "Scout Building",
    badgeX: 886,
    badgeY: 210,
    detail: "Scout building next to the Office Room.",
  },
  {
    id: "balcony1",
    label: "Balcony",
    labelBn: "ব্যালকনি",
    x: 300,
    y: 300,
    w: 300,
    h: 50,
    badge: "Balcony",
    badgeX: 585,
    badgeY: 258,
    detail: "Balcony in front of the Office Room.",
  },
  {
    id: "balcony2",
    label: "Balcony",
    labelBn: "ব্যালকনি",
    x: 780,
    y: 300,
    w: 220,
    h: 50,
    badge: "Balcony",
    badgeX: 880,
    badgeY: 258,
    detail: "Balcony in front of the Scout Building.",
  },
  {
    id: "b2",
    label: "Building Number-02 · Class Room",
    labelBn: "২ নং ভবন · ক্লাসরুম",
    x: 70,
    y: 330,
    w: 190,
    h: 400,
    buildingId: "civil",
    badge: "Building Number-02\n3 story building",
    badgeX: 42,
    badgeY: 470,
    vertical: true,
    detail: "3-storey building with class rooms and balcony.",
  },
  {
    id: "b3",
    label: "Building Number-03 · Class Room",
    labelBn: "৩ নং ভবন · ক্লাসরুম",
    x: 1030,
    y: 380,
    w: 170,
    h: 430,
    buildingId: "electrical",
    badge: "Building Number-03\n3 story building",
    badgeX: 1208,
    badgeY: 520,
    vertical: true,
    detail: "3-storey building with class rooms and balcony.",
  },
  {
    id: "pond",
    label: "Campus Pond",
    labelBn: "ক্যাম্পাস পুকুর",
    x: 370,
    y: 380,
    w: 560,
    h: 400,
    badge: "Pond bank",
    badgeX: 650,
    badgeY: 366,
    detail: "Large central pond with paved banks on all four sides.",
  },
  {
    id: "b6",
    label: "Building Number-06 · Lab Room",
    labelBn: "৬ নং ভবন · ল্যাব রুম",
    x: 95,
    y: 790,
    w: 185,
    h: 320,
    buildingId: "mechanical",
    badge: "Building Number-06\n1 story building",
    badgeX: 40,
    badgeY: 950,
    vertical: true,
    detail: "Single-storey laboratory block (south-west).",
  },
  {
    id: "badminton",
    label: "Badminton Court",
    labelBn: "ব্যাডমিন্টন কোর্ট",
    x: 320,
    y: 860,
    w: 150,
    h: 235,
    badge: "Badminton\ncourt",
    badgeX: 395,
    badgeY: 975,
    detail: "Outdoor badminton court between the lab blocks.",
  },
  {
    id: "b5",
    label: "Building Number-05 · Lab Room",
    labelBn: "৫ নং ভবন · ল্যাব রুম",
    x: 525,
    y: 790,
    w: 185,
    h: 320,
    buildingId: "computer",
    badge: "Building Number-05\n1 story building",
    badgeX: 712,
    badgeY: 950,
    vertical: true,
    detail: "Single-storey laboratory block (south-center).",
  },
  {
    id: "b4",
    label: "Building Number-04 · Lab Room",
    labelBn: "৪ নং ভবন · ল্যাব রুম",
    x: 810,
    y: 790,
    w: 185,
    h: 320,
    buildingId: "electronics",
    badge: "Building Number-04\n1 story building",
    badgeX: 1000,
    badgeY: 950,
    vertical: true,
    detail: "Single-storey laboratory block (south-east).",
  },
];

function Badge({
  text,
  x,
  y,
  vertical,
}: {
  text: string;
  x: number;
  y: number;
  vertical?: boolean;
}) {
  const lines = text.split("\n");
  const w = vertical ? 44 : Math.max(140, Math.max(...lines.map((l) => l.length)) * 13 + 28);
  const h = vertical ? Math.max(150, lines.length * 42 + 20) : lines.length * 30 + 16;
  return (
    <g
      transform={
        vertical ? `translate(${x} ${y}) rotate(-90)` : `translate(${x - w / 2} ${y - h / 2})`
      }
    >
      <rect width={w} height={h} rx={h / 2} fill="#12325e" stroke="#2a5c99" strokeWidth="2" />
      {lines.map((line, i) => (
        <text
          key={i}
          x={w / 2}
          y={h / 2 - (lines.length - 1) * 14 + i * 28 + 6}
          textAnchor="middle"
          fill="#fff"
          fontSize={vertical ? 17 : Math.min(22, 260 / Math.max(12, line.length))}
          fontWeight="700"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-[#d9e7cf]">
      <svg
        viewBox="0 0 1244 1276"
        className="block h-auto w-full"
        role="img"
        aria-label="3D model of Rajshahi Govt. Polytechnic Institute campus"
      >
        <defs>
          <linearGradient id="roof" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#4e9b93" />
            <stop offset="1" stopColor="#2f7c78" />
          </linearGradient>
          <pattern id="roofTiles" width="14" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 0 H14 M0 5 H14" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" />
            <path
              d="M7 0 V5 M0 5 V10 M14 5 V10"
              stroke="#0b3b3a"
              strokeOpacity="0.16"
              strokeWidth="1"
            />
          </pattern>
          <linearGradient id="pond" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3fa8d1" />
            <stop offset="1" stopColor="#0e6b9c" />
          </linearGradient>
          <pattern id="ripples" width="42" height="22" patternUnits="userSpaceOnUse">
            <path
              d="M0 11 Q 10 2 21 11 T 42 11"
              fill="none"
              stroke="#9fe0f2"
              strokeOpacity="0.45"
              strokeWidth="2"
            />
          </pattern>
          <radialGradient id="tree">
            <stop offset="0" stopColor="#4da36a" />
            <stop offset="1" stopColor="#1f6b40" />
          </radialGradient>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="14"
              stdDeviation="10"
              floodColor="#173a2c"
              floodOpacity="0.3"
            />
          </filter>
        </defs>

        {/* Ground */}
        <rect width="1244" height="1276" fill="#cfe0bd" />
        <rect
          x="18"
          y="24"
          width="1208"
          height="1230"
          rx="18"
          fill="#e8e4d2"
          stroke="#b7b09a"
          strokeWidth="8"
        />
        <rect x="30" y="118" width="1184" height="1140" fill="#e4dfcb" />

        {/* Trees around the boundary */}
        {Array.from({ length: 34 }).map((_, i) => {
          const t = i / 34;
          const x = 46 + t * 1150 + (i % 3) * 6;
          const top = i < 13;
          const bottom = i >= 21;
          const y = top ? 78 + (i % 3) * 12 : bottom ? 1210 - (i % 3) * 10 : i % 2 ? 132 : 1216;
          return (
            <g key={`tree-${i}`}>
              <ellipse cx={x + 4} cy={y + 10} rx="26" ry="11" fill="#4c6a43" opacity="0.25" />
              <circle cx={x} cy={y} r={20 + (i % 3) * 3} fill="url(#tree)" />
              <circle cx={x - 6} cy={y - 7} r="9" fill="#6cc084" opacity="0.5" />
            </g>
          );
        })}

        {/* Main road */}
        <rect x="0" y="58" width="1244" height="74" fill="#525962" />
        <line
          x1="0"
          y1="95"
          x2="1244"
          y2="95"
          stroke="#fff"
          strokeWidth="5"
          strokeDasharray="42 34"
        />
        <Badge text="Ground Floor" x={622} y={34} />
        <Badge text="Main Road" x={622} y={96} />

        {/* Paved foreground */}
        <rect x="40" y="310" width="1160" height="920" fill="#ded9c6" />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={`pave-${i}`}
            d={`M ${40 + i * 290} 320 V 1220`}
            stroke="#d0c9b2"
            strokeWidth="3"
          />
        ))}

        {/* Buildings: cream walls + teal roofs */}
        {SPOTS.filter((s) => s.id.startsWith("b") && s.id !== "badminton").map((s) => (
          <g key={`bld-${s.id}`} filter="url(#shadow)">
            <rect
              x={s.x}
              y={s.y + 18}
              width={s.w}
              height={s.h}
              rx="8"
              fill="#efe3c9"
              stroke="#c9b994"
              strokeWidth="3"
            />
            <rect
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx="8"
              fill="url(#roof)"
              stroke="#235b58"
              strokeWidth="4"
            />
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="8" fill="url(#roofTiles)" />
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={s.x + 12}
                y={s.y + 24 + i * ((s.h - 40) / 3)}
                width={Math.max(30, s.w - 24)}
                height="6"
                fill="#f3ead5"
                opacity="0.75"
              />
            ))}
          </g>
        ))}

        {/* Teachers club + scout are smaller single blocks already in SPOTS with b prefix? they are not, add separately */}
        <g filter="url(#shadow)">
          <rect
            x="75"
            y="160"
            width="185"
            height="130"
            rx="7"
            fill="#efe3c9"
            stroke="#c9b994"
            strokeWidth="3"
          />
          <rect
            x="75"
            y="150"
            width="185"
            height="130"
            rx="7"
            fill="url(#roof)"
            stroke="#235b58"
            strokeWidth="4"
          />
          <rect x="75" y="150" width="185" height="130" rx="7" fill="url(#roofTiles)" />
          <rect
            x="780"
            y="168"
            width="220"
            height="120"
            rx="7"
            fill="#efe3c9"
            stroke="#c9b994"
            strokeWidth="3"
          />
          <rect
            x="780"
            y="158"
            width="220"
            height="120"
            rx="7"
            fill="url(#roof)"
            stroke="#235b58"
            strokeWidth="4"
          />
          <rect x="780" y="158" width="220" height="120" rx="7" fill="url(#roofTiles)" />
        </g>

        {/* Balconies */}
        <rect
          x="300"
          y="300"
          width="300"
          height="46"
          fill="#f2ead6"
          stroke="#cbbd9d"
          strokeWidth="3"
        />
        <rect
          x="780"
          y="300"
          width="220"
          height="46"
          fill="#f2ead6"
          stroke="#cbbd9d"
          strokeWidth="3"
        />
        <rect
          x="150"
          y="330"
          width="50"
          height="400"
          fill="#f2ead6"
          stroke="#cbbd9d"
          strokeWidth="3"
        />
        <rect
          x="990"
          y="380"
          width="40"
          height="430"
          fill="#f2ead6"
          stroke="#cbbd9d"
          strokeWidth="3"
        />

        {/* Pond with banks */}
        <rect
          x="350"
          y="360"
          width="600"
          height="440"
          rx="12"
          fill="#d7cdb2"
          stroke="#a99e80"
          strokeWidth="6"
        />
        <rect
          x="366"
          y="376"
          width="568"
          height="408"
          rx="8"
          fill="url(#pond)"
          stroke="#0b5d8a"
          strokeWidth="5"
        />
        <rect x="366" y="376" width="568" height="408" rx="8" fill="url(#ripples)" />
        <text x="650" y="356" textAnchor="middle" fill="#0b3f63" fontSize="22" fontWeight="700">
          Pond bank
        </text>
        <text x="650" y="806" textAnchor="middle" fill="#0b3f63" fontSize="22" fontWeight="700">
          Pond bank
        </text>
        <text
          x="342"
          y="580"
          textAnchor="middle"
          fill="#0b3f63"
          fontSize="22"
          fontWeight="700"
          transform="rotate(-90 342 580)"
        >
          Pond bank
        </text>
        <text
          x="958"
          y="580"
          textAnchor="middle"
          fill="#0b3f63"
          fontSize="22"
          fontWeight="700"
          transform="rotate(90 958 580)"
        >
          Pond bank
        </text>

        {/* Badminton court */}
        <rect
          x="320"
          y="860"
          width="150"
          height="235"
          rx="4"
          fill="#2c9c63"
          stroke="#1b6f45"
          strokeWidth="4"
        />
        <g stroke="#eafff0" strokeWidth="3" fill="none">
          <rect x="330" y="870" width="130" height="215" />
          <line x1="395" y1="870" x2="395" y2="1085" />
          <line x1="330" y1="978" x2="460" y2="978" />
        </g>

        {/* Main gate */}
        <rect x="300" y="128" width="10" height="58" fill="#7d8590" />
        <rect x="350" y="128" width="10" height="58" fill="#7d8590" />
        <path d="M300 140 Q 330 108 360 140" fill="none" stroke="#7d8590" strokeWidth="6" />

        {/* Dark blue labels from the photo */}
        {SPOTS.filter((s) => s.badge).map((s) => (
          <Badge
            key={`badge-${s.id}`}
            text={s.badge!}
            x={s.badgeX ?? s.x + s.w / 2}
            y={s.badgeY ?? s.y}
            {...(s.vertical ? { vertical: true } : {})}
          />
        ))}
        {["Lab Room"].map((l) => (
          <g key={l}>
            {[
              [188, 880],
              [188, 980],
              [188, 1080],
              [617, 880],
              [617, 980],
              [617, 1080],
              [903, 880],
              [903, 980],
              [903, 1080],
            ].map(([x, y], i) => (
              <Badge key={i} text={l} x={x ?? 0} y={y ?? 0} />
            ))}
          </g>
        ))}
        <Badge text="Class Room" x={168} y={520} vertical />
        <Badge text="Class Room" x={1112} y={590} vertical />
        <Badge text="Balcony" x={168} y={470} vertical />
        <Badge text="Balcony" x={1008} y={580} vertical />

        {/* Click hotspots */}
        {SPOTS.map((spot) => {
          const active = selected?.id === spot.id || hover === spot.id;
          return (
            <g
              key={`hot-${spot.id}`}
              onClick={() => onSelect(spot)}
              onMouseEnter={() => setHover(spot.id)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
              role="button"
              aria-label={`${spot.label} — ${spot.detail}`}
            >
              <rect
                x={spot.x}
                y={spot.y}
                width={spot.w}
                height={spot.h}
                rx="8"
                fill={active ? "#10b981" : "transparent"}
                fillOpacity={active ? 0.18 : 0}
                stroke={active ? "#10b981" : "transparent"}
                strokeWidth={active ? 5 : 0}
              />
            </g>
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
              className="mt-2 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
            >
              See rooms →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
