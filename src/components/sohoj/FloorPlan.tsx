import { floorLabel, shortName, type CampusLocation } from "@/lib/campus-data";

const ROOM_W = 58;
const GAP = 4;
const ROW_X = 82;
const TOP_Y = 18;
const ROOM_H = 70;
const CORR_Y = 96;
const CORR_H = 40;
const BOT_Y = CORR_Y + CORR_H + 4;

function splitLabel(label: string): string[] {
  if (label.length <= 11) return [label];
  const words = label.split(" ");
  const lines: string[] = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + " " + w).trim().length > 11 && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + " " + w).trim();
  }
  return lines.slice(0, 3);
}

export function FloorPlan({ location }: { location: CampusLocation }) {
  const targetIndex = Math.min(Math.max(location.door - 1, 0), 3);
  const targetTop = location.side === "left";
  const base = location.floor === 0 ? 100 : location.floor * 100;
  const corridorMid = CORR_Y + CORR_H / 2;
  const landmarkX = 74;

  const targetNum = Number(location.name.match(/\d{3}/)?.[0] ?? NaN);
  const numbers: number[] = [];
  for (let n = base + 1; numbers.length < 8; n++) if (n !== targetNum) numbers.push(n);
  const rooms = [0, 1, 2, 3].flatMap((i) => [
    { i, top: true, n: numbers[i * 2] },
    { i, top: false, n: numbers[i * 2 + 1] },
  ]);

  const targetX = ROW_X + targetIndex * (ROOM_W + GAP);
  const targetCenter = targetX + ROOM_W / 2;
  const doorY = targetTop ? CORR_Y : CORR_Y + CORR_H;
  const routePath = `M 40 ${corridorMid} L ${targetCenter} ${corridorMid} L ${targetCenter} ${doorY}`;

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <figcaption className="mb-2 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
        <span>2D Floor Plan · {floorLabel(location.floor)}</span>
        <span className="font-bangla">ফ্লোর নকশা</span>
      </figcaption>
      <svg
        viewBox="0 0 340 236"
        className="h-auto w-full"
        role="img"
        aria-label={`Floor plan highlighting ${location.name}`}
      >
        {/* Building outline */}
        <rect x="6" y="8" width="328" height="220" rx="14" className="fill-background stroke-border" strokeWidth="1.5" />

        {/* Corridor */}
        <rect x="10" y={CORR_Y} width="320" height={CORR_H} rx="6" className="fill-muted" />
        <text x="300" y={corridorMid + 3} textAnchor="end" className="fill-muted-foreground" fontSize="8" letterSpacing="2">
          CORRIDOR
        </text>

        {/* Stairs */}
        <g>
          <rect x="12" y="18" width="56" height={ROOM_H} rx="6" className="fill-primary-soft stroke-primary/30" />
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <line key={s} x1="20" x2="60" y1={28 + s * 9} y2={28 + s * 9} className="stroke-primary/40" strokeWidth="1.5" />
          ))}
          <text x="40" y={ROOM_H + 12} textAnchor="middle" className="fill-primary" fontSize="8" fontWeight="700">
            STAIRS
          </text>
        </g>

        {/* Rooms */}
        {rooms.map(({ i, top, n }) => {
          const x = ROW_X + i * (ROOM_W + GAP);
          const y = top ? TOP_Y : BOT_Y;
          const isTarget = i === targetIndex && top === targetTop;
          if (isTarget) return null;
          return (
            <g key={`${i}-${top}`}>
              <rect x={x} y={y} width={ROOM_W} height={ROOM_H} rx="6" className="fill-card stroke-border" strokeWidth="1.2" />
              <rect x={x + ROOM_W / 2 - 8} y={top ? y + ROOM_H - 2 : y - 1} width="16" height="3" rx="1" className="fill-border" />
              <text x={x + ROOM_W / 2} y={y + ROOM_H / 2 + 3} textAnchor="middle" className="fill-muted-foreground" fontSize="9">
                {n}
              </text>
            </g>
          );
        })}

        {/* Landmark (e.g. notice board) */}
        <g>
          <rect
            x={landmarkX - 5}
            y={location.turn === "left" ? CORR_Y + 2 : CORR_Y + CORR_H - 8}
            width="10"
            height="6"
            rx="1.5"
            className="fill-landmark"
          />
        </g>

        {/* Route */}
        <path d={routePath} className="fill-none stroke-primary/20" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={routePath}
          className="fill-none stroke-primary"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "dash 1.2s linear infinite" }}
        />

        {/* Start dot */}
        <circle cx="40" cy={corridorMid} r="9" className="fill-primary/15" />
        <circle cx="40" cy={corridorMid} r="5" className="fill-primary stroke-card" strokeWidth="2" />

        {/* Target room */}
        <g>
          <rect
            x={targetX}
            y={targetTop ? TOP_Y : BOT_Y}
            width={ROOM_W}
            height={ROOM_H}
            rx="6"
            className="svg-pulse fill-none stroke-emerald"
            strokeWidth="3"
          />
          <rect
            x={targetX}
            y={targetTop ? TOP_Y : BOT_Y}
            width={ROOM_W}
            height={ROOM_H}
            rx="6"
            className="fill-emerald-soft stroke-emerald"
            strokeWidth="2"
          />
          {splitLabel(shortName(location.name)).map((line, idx, arr) => (
            <text
              key={idx}
              x={targetCenter}
              y={(targetTop ? TOP_Y : BOT_Y) + ROOM_H / 2 + 3 + (idx - (arr.length - 1) / 2) * 10}
              textAnchor="middle"
              className="fill-emerald"
              fontSize="8.5"
              fontWeight="700"
            >
              {line}
            </text>
          ))}
          <circle cx={targetCenter} cy={doorY} r="4" className="fill-emerald stroke-card" strokeWidth="2" />
        </g>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" /> You (stairs)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-landmark" /> {location.landmark}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-emerald" /> Destination
        </span>
      </div>
    </figure>
  );
}
