import type { StartPointId } from "./campus-data";

/** Real location of Rajshahi Polytechnic Institute (from the Google Maps link the admin shared). */
export const RPI_COORDS = { lat: 24.3791113, lng: 88.606811 } as const;
export const RPI_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Rajshahi+Polytechnic+Institute/@24.3790792,88.6069135,124m/data=!3m1!1e3";
/** Keyless Google Maps satellite embed centred on the campus. */
export const RPI_SATELLITE_EMBED = `https://maps.google.com/maps?q=${RPI_COORDS.lat},${RPI_COORDS.lng}&t=k&z=18&output=embed`;

/** Institutes that have a drawn campus map. */
export const CAMPUS_MAP_INSTITUTES = ["rpi"] as const;
export function hasCampusMap(instituteId: string): boolean {
  return (CAMPUS_MAP_INSTITUTES as readonly string[]).includes(instituteId);
}

export interface MapPoint {
  x: number;
  y: number;
}

/** Walkway junctions on the drawn Rajshahi campus map (viewBox 360 × 300). */
export const MAP_NODES = {
  gate: { x: 180, y: 290 },
  cross: { x: 180, y: 230 },
  minarRoad: { x: 180, y: 178 },
  minar: { x: 214, y: 178 },
  top: { x: 180, y: 104 },
  academic: { x: 180, y: 90 },
  libraryRoad: { x: 76, y: 104 },
  library: { x: 76, y: 90 },
  admin: { x: 118, y: 230 },
  canteenRoad: { x: 300, y: 230 },
  canteen: { x: 300, y: 244 },
} satisfies Record<string, MapPoint>;

export type MapNodeId = keyof typeof MAP_NODES;

const EDGES: [MapNodeId, MapNodeId][] = [
  ["gate", "cross"],
  ["cross", "minarRoad"],
  ["minarRoad", "minar"],
  ["minarRoad", "top"],
  ["top", "academic"],
  ["top", "libraryRoad"],
  ["libraryRoad", "library"],
  ["cross", "admin"],
  ["cross", "canteenRoad"],
  ["canteenRoad", "canteen"],
];

export const START_NODE: Record<StartPointId, MapNodeId> = {
  "main-gate": "gate",
  "shaheed-minar": "minar",
  "academic-ground": "academic",
  "academic-entrance": "academic",
};

export const BUILDING_NODE: Record<string, MapNodeId> = {
  academic: "academic",
  admin: "admin",
  library: "library",
  canteen: "canteen",
};

export const MAP_EDGES = EDGES;

/** Walkway path (list of junctions) from a start point to a building's entrance. */
export function campusPath(startId: StartPointId, buildingId: string): MapNodeId[] {
  const from = START_NODE[startId];
  const to = BUILDING_NODE[buildingId];
  if (!to) return [];
  if (from === to) return [from];
  const prev = new Map<MapNodeId, MapNodeId | null>([[from, null]]);
  const queue: MapNodeId[] = [from];
  while (queue.length) {
    const cur = queue.shift() as MapNodeId;
    if (cur === to) break;
    for (const [a, b] of EDGES) {
      const next = a === cur ? b : b === cur ? a : null;
      if (next && !prev.has(next)) {
        prev.set(next, cur);
        queue.push(next);
      }
    }
  }
  if (!prev.has(to)) return [];
  const path: MapNodeId[] = [];
  for (let n: MapNodeId | null = to; n; n = prev.get(n) ?? null) path.unshift(n);
  return path;
}

export function pathD(nodes: MapNodeId[]): string {
  return nodes.map((n, i) => `${i === 0 ? "M" : "L"} ${MAP_NODES[n].x} ${MAP_NODES[n].y}`).join(" ");
}
