export type Category = "classroom" | "lab" | "office" | "facility";
export type Side = "left" | "right";
export type StartPointId = "main-gate" | "shaheed-minar" | "academic-ground" | "academic-entrance";

export interface StartPoint {
  id: StartPointId;
  name: string;
  nameBn: string;
}

export const MAIN_GATE: StartPoint = { id: "main-gate", name: "Main Gate", nameBn: "প্রধান ফটক" };

export const START_POINTS: StartPoint[] = [
  MAIN_GATE,
  { id: "shaheed-minar", name: "Shaheed Minar", nameBn: "শহীদ মিনার" },
  { id: "academic-ground", name: "Academic Building Ground Floor", nameBn: "একাডেমিক ভবন নিচতলা" },
];

/** Detected by the QR checkpoint scanner; not in the manual dropdown list by default. */
export const QR_START_POINT: StartPoint = {
  id: "academic-entrance",
  name: "Academic Building Entrance",
  nameBn: "একাডেমিক ভবনের প্রবেশমুখ",
};

export const ALL_START_POINTS: StartPoint[] = [...START_POINTS, QR_START_POINT];

export interface Building {
  id: string;
  name: string;
  /** How it looks, used as a visual landmark in directions. */
  look: string;
  isAcademic: boolean;
  /** Walking distance in meters from each start point to this building's entrance. */
  distance: Record<StartPointId, number>;
}

export interface CampusLocation {
  id: string;
  name: string;
  nameBn?: string;
  category: Category;
  buildingId: string;
  floor: number;
  /** Direction to turn after reaching the floor. */
  turn: Side;
  /** Landmark where the user turns. */
  landmark: string;
  /** Which side of the corridor the door is on. */
  side: Side;
  /** Door number counted from the landmark (1 = first door). */
  door: number;
  /** Room code breakdown: 1305 → building 1, floor 3, room 05. */
  buildingNo?: number;
  roomNo?: number;
  department?: string;
  keywords?: string[];
  custom?: boolean;
  /** Admin-set walking steps; overrides the automatic estimate. */
  walkingSteps?: number;
  /** Admin-written step-by-step landmark directions; replace the generated steps. */
  directions?: string[];
}

/* ---------------- Campus map ---------------- */

export type MapFeatureKind = "gate" | "road" | "building" | "pond" | "ground" | "landmark";

export const MAP_FEATURE_META: Record<
  MapFeatureKind,
  { label: string; labelBn: string; dot: string }
> = {
  gate: { label: "Gate", labelBn: "ফটক", dot: "bg-landmark" },
  road: { label: "Road / path", labelBn: "রাস্তা", dot: "bg-muted-foreground" },
  building: { label: "Building", labelBn: "ভবন", dot: "bg-primary" },
  pond: { label: "Pond", labelBn: "পুকুর", dot: "bg-chart-5" },
  ground: { label: "Ground / field", labelBn: "মাঠ", dot: "bg-emerald" },
  landmark: { label: "Landmark", labelBn: "ল্যান্ডমার্ক", dot: "bg-landmark-soft" },
};

export interface MapFeature {
  id: string;
  name: string;
  nameBn: string;
  kind: MapFeatureKind;
  /** Position on the plan and on the live-map label overlay, in percent (0-100). */
  x: number;
  y: number;
  /** Width/height of area features, in percent. */
  size?: [number, number];
  /** Show a label chip on top of the live Google Map. */
  livePin?: boolean;
  detail?: string;
}

export interface MapRoad {
  id: string;
  name: string;
  nameBn: string;
  /** Path vertices in percent (0-100). */
  points: [number, number][];
}

export interface CampusMapData {
  lat: number;
  lng: number;
  /** Exact Google Maps place link supplied by the campus. */
  link: string;
  /** Key-free embed URL built from the place coordinates. */
  embedUrl: string;
  features: MapFeature[];
  roads: MapRoad[];
}

export type InstituteType = "government" | "private";

export type Division =
  "Dhaka" | "Chattogram" | "Rajshahi" | "Khulna" | "Rangpur" | "Barishal" | "Sylhet" | "Mymensingh";

export const DIVISION_ORDER: Division[] = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Rangpur",
  "Barishal",
  "Sylhet",
  "Mymensingh",
];

export interface Institute {
  id: string;
  name: string;
  nameBn: string;
  city: string;
  division: Division;
  type: InstituteType;
  buildings: Building[];
  locations: CampusLocation[];
  /** Only campuses with a verified map get one (currently Rajshahi Polytechnic). */
  map?: CampusMapData;
}

export const CATEGORY_META: Record<Category, { label: string; labelBn: string }> = {
  classroom: { label: "Classrooms", labelBn: "ক্লাসরুম" },
  lab: { label: "Labs", labelBn: "ল্যাব" },
  office: { label: "Offices", labelBn: "অফিস" },
  facility: { label: "Facilities", labelBn: "সুবিধা" },
};

/**
 * Rajshahi Government Polytechnic Institute — the only campus with a map.
 * Coordinates and the place link come from the institute's Google Maps listing.
 * Feature positions are approximate relative locations used for the annotated
 * plan and the label overlay on the live map.
 */
export const RPI_MAP: CampusMapData = {
  lat: 24.3791113,
  lng: 88.606811,
  link: "https://www.google.com/maps/place/Rajshahi+Polytechnic+Institute/@24.3790792,88.6069135,124m/data=!3m1!1e3!4m14!1m7!3m6!1s0x39fbee4db10be455:0xc6ee56098bd61ee9!2sRajshahi+Polytechnic+Institute!8m2!3d24.3791113!4d88.606811!16s%2Fg%2F11f3jykj1s!3m5!1s0x39fbee4db10be455:0xc6ee56098bd61ee9!8m2!3d24.3791113!4d88.606811!16s%2Fg%2F11f3jykj1s!5m1!1e4?entry=ttu&g_ep=EgoyMDI2MTExNy4wIKXMDSoASAFQAw%3D%3D",
  embedUrl: "https://www.google.com/maps?q=24.3791113,88.606811&z=18&output=embed",
  roads: [
    {
      id: "main-road",
      name: "Main campus road",
      nameBn: "প্রধান ক্যাম্পাস রাস্তা",
      points: [
        [50, 97],
        [50, 80],
        [47, 64],
        [47, 34],
      ],
    },
    {
      id: "admin-path",
      name: "Path to Administrative Building",
      nameBn: "প্রশাসনিক ভবনের পথ",
      points: [
        [50, 72],
        [70, 57],
      ],
    },
    {
      id: "library-path",
      name: "Path to Library",
      nameBn: "লাইব্রেরির পথ",
      points: [
        [70, 57],
        [78, 34],
      ],
    },
    {
      id: "pond-path",
      name: "Canteen and pond path",
      nameBn: "ক্যান্টিন ও পুকুরের পথ",
      points: [
        [50, 80],
        [67, 75],
        [85, 79],
      ],
    },
    {
      id: "ground-path",
      name: "Playground path",
      nameBn: "খেলার মাঠের পথ",
      points: [
        [47, 66],
        [22, 68],
        [17, 40],
      ],
    },
  ],
  features: [
    {
      id: "main-gate",
      name: "Main Gate",
      nameBn: "প্রধান ফটক",
      kind: "gate",
      x: 50,
      y: 92,
      size: [10, 5],
      livePin: true,
      detail: "Main entrance of the institute, at the south end of the campus road.",
    },
    {
      id: "shaheed-minar",
      name: "Shaheed Minar",
      nameBn: "শহীদ মিনার",
      kind: "landmark",
      x: 44,
      y: 76,
      livePin: false,
      detail: "Central landmark just inside the gate — a good starting point for directions.",
    },
    {
      id: "academic",
      name: "Academic Building",
      nameBn: "একাডেমিক ভবন",
      kind: "building",
      x: 35,
      y: 50,
      size: [22, 15],
      livePin: true,
      detail: "The red building — classrooms, Computer/Civil labs and the software lab.",
    },
    {
      id: "admin",
      name: "Administrative Building",
      nameBn: "প্রশাসনিক ভবন",
      kind: "building",
      x: 70,
      y: 54,
      size: [16, 12],
      livePin: true,
      detail:
        "White building with the flag pole — Principal's office and the registrar/stipend section.",
    },
    {
      id: "library",
      name: "Library Block",
      nameBn: "লাইব্রেরি ভবন",
      kind: "building",
      x: 78,
      y: 30,
      size: [15, 10],
      livePin: true,
      detail: "Yellow block behind the field — home of the Central Library.",
    },
    {
      id: "canteen",
      name: "Canteen",
      nameBn: "ক্যান্টিন",
      kind: "building",
      x: 66,
      y: 74,
      size: [12, 9],
      livePin: false,
      detail: "Tin-roofed student canteen beside the pond.",
    },
    {
      id: "pond",
      name: "Campus Pond",
      nameBn: "ক্যাম্পাস পুকুর",
      kind: "pond",
      x: 86,
      y: 79,
      size: [13, 9],
      livePin: true,
      detail: "Large pond on the east side of the campus, next to the canteen.",
    },
    {
      id: "ground",
      name: "Playground",
      nameBn: "খেলার মাঠ",
      kind: "ground",
      x: 20,
      y: 69,
      size: [17, 13],
      livePin: true,
      detail: "Open ground and sports field west of the Academic Building.",
    },
    {
      id: "workshop",
      name: "Workshop Block",
      nameBn: "ওয়ার্কশপ ভবন",
      kind: "building",
      x: 16,
      y: 36,
      size: [13, 10],
      livePin: false,
      detail: "Mechanical and civil technology workshops.",
    },
  ],
};

const rajshahiBuildings: Building[] = [
  {
    id: "academic",
    name: "Academic Building",
    look: "Red Academic Building",
    isAcademic: true,
    distance: {
      "main-gate": 80,
      "shaheed-minar": 35,
      "academic-ground": 0,
      "academic-entrance": 0,
    },
  },
  {
    id: "admin",
    name: "Administrative Building",
    look: "White Admin Building with the flag pole",
    isAcademic: false,
    distance: {
      "main-gate": 45,
      "shaheed-minar": 30,
      "academic-ground": 60,
      "academic-entrance": 55,
    },
  },
  {
    id: "library",
    name: "Library Block",
    look: "Yellow Library Block behind the field",
    isAcademic: false,
    distance: {
      "main-gate": 130,
      "shaheed-minar": 90,
      "academic-ground": 55,
      "academic-entrance": 50,
    },
  },
  {
    id: "canteen",
    name: "Canteen Area",
    look: "tin-roofed Canteen beside the pond",
    isAcademic: false,
    distance: {
      "main-gate": 110,
      "shaheed-minar": 75,
      "academic-ground": 40,
      "academic-entrance": 35,
    },
  },
  ...(
    [
      ["electrical", "Electrical Department Building", 95],
      ["non-departmental", "Non-Departmental Building", 75],
      ["electronics", "Electronics Department Building", 100],
      ["computer", "Computer Department Building", 85],
      ["civil", "Civil Department Building", 90],
      ["mechanical", "Mechanical Department Building", 120],
      ["power", "Power Department Building", 125],
      ["electro-medical", "Electro-Medical Department Building", 115],
      ["mechatronics", "Mechatronics Department Building", 130],
    ] as [string, string, number][]
  ).map(([id, name, gate]): Building => ({
    id,
    name,
    look: `${name.replace(" Department Building", "")} department block`,
    isAcademic: true,
    distance: {
      "main-gate": gate,
      "shaheed-minar": Math.round(gate * 0.6),
      "academic-ground": Math.round(gate * 0.45),
      "academic-entrance": Math.round(gate * 0.4),
    },
  })),
];

const genericBuildings = (gate: number): Building[] => [
  {
    id: "academic",
    name: "Academic Building",
    look: "main Academic Building",
    isAcademic: true,
    distance: {
      "main-gate": gate,
      "shaheed-minar": 40,
      "academic-ground": 0,
      "academic-entrance": 0,
    },
  },
  {
    id: "admin",
    name: "Administrative Building",
    look: "Admin Building",
    isAcademic: false,
    distance: {
      "main-gate": Math.round(gate * 0.6),
      "shaheed-minar": 35,
      "academic-ground": 50,
      "academic-entrance": 45,
    },
  },
];

interface InstituteSeed {
  name: string;
  nameBn: string;
  city: string;
  division: Division;
  type: InstituteType;
}

/** Government polytechnic & monotechnic institutes (the three detailed ones above are already included). */
const GOVERNMENT_SEEDS: InstituteSeed[] = [
  // Dhaka Division
  {
    name: "Dhaka Mohila Polytechnic Institute",
    nameBn: "ঢাকা মহিলা পলিটেকনিক ইনস্টিটিউট",
    city: "Dhaka",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Bangladesh Institute of Glass and Ceramics",
    nameBn: "বাংলাদেশ ইনস্টিটিউট অফ গ্লাস অ্যান্ড সেরামিক্স",
    city: "Dhaka",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Graphic Arts Institute",
    nameBn: "গ্রাফিক আর্টস ইনস্টিটিউট",
    city: "Dhaka",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Faridpur Polytechnic Institute",
    nameBn: "ফরিদপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Faridpur",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Gopalganj Polytechnic Institute",
    nameBn: "গোপালগঞ্জ পলিটেকনিক ইনস্টিটিউট",
    city: "Gopalganj",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Kishoreganj Polytechnic Institute",
    nameBn: "কিশোরগঞ্জ পলিটেকনিক ইনস্টিটিউট",
    city: "Kishoreganj",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Munshiganj Polytechnic Institute",
    nameBn: "মুন্সিগঞ্জ পলিটেকনিক ইনস্টিটিউট",
    city: "Munshiganj",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Narsingdi Polytechnic Institute",
    nameBn: "নরসিংদী পলিটেকনিক ইনস্টিটিউট",
    city: "Narsingdi",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Shariatpur Polytechnic Institute",
    nameBn: "শরিয়তপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Shariatpur",
    division: "Dhaka",
    type: "government",
  },
  {
    name: "Tangail Polytechnic Institute",
    nameBn: "টাঙ্গাইল পলিটেকনিক ইনস্টিটিউট",
    city: "Tangail",
    division: "Dhaka",
    type: "government",
  },
  // Chattogram Division
  {
    name: "Chattogram Polytechnic Institute",
    nameBn: "চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট",
    city: "Chattogram",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Chattogram Mohila Polytechnic Institute",
    nameBn: "চট্টগ্রাম মহিলা পলিটেকনিক ইনস্টিটিউট",
    city: "Chattogram",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Brahmanbaria Polytechnic Institute",
    nameBn: "ব্রাহ্মণবাড়িয়া পলিটেকনিক ইনস্টিটিউট",
    city: "Brahmanbaria",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Chandpur Polytechnic Institute",
    nameBn: "চান্দপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Chandpur",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Cumilla Polytechnic Institute",
    nameBn: "কুমিল্লা পলিটেকনিক ইনস্টিটিউট",
    city: "Cumilla",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Bangladesh Survey Institute",
    nameBn: "বাংলাদেশ সার্ভে ইনস্টিটিউট",
    city: "Cumilla",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Cox's Bazar Polytechnic Institute",
    nameBn: "কক্সবাজার পলিটেকনিক ইনস্টিটিউট",
    city: "Cox's Bazar",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Feni Polytechnic Institute",
    nameBn: "ফেনী পলিটেকনিক ইনস্টিটিউট",
    city: "Feni",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Feni Computer Institute",
    nameBn: "ফেনী কম্পিউটার ইনস্টিটিউট",
    city: "Feni",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Lakshmipur Polytechnic Institute",
    nameBn: "লক্ষ্মীপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Lakshmipur",
    division: "Chattogram",
    type: "government",
  },
  {
    name: "Bangladesh Sweden Polytechnic Institute",
    nameBn: "বাংলাদেশ সুইডেন পলিটেকনিক ইনস্টিটিউট",
    city: "Rangamati (Kaptai)",
    division: "Chattogram",
    type: "government",
  },
  // Rajshahi Division
  {
    name: "Rajshahi Mohila Polytechnic Institute",
    nameBn: "রাজশাহী মহিলা পলিটেকনিক ইনস্টিটিউট",
    city: "Rajshahi",
    division: "Rajshahi",
    type: "government",
  },
  {
    name: "Rajshahi Survey Institute",
    nameBn: "রাজশাহী সার্ভে ইনস্টিটিউট",
    city: "Rajshahi",
    division: "Rajshahi",
    type: "government",
  },
  {
    name: "Chapainawabganj Polytechnic Institute",
    nameBn: "চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট",
    city: "Chapainawabganj",
    division: "Rajshahi",
    type: "government",
  },
  {
    name: "Naogaon Polytechnic Institute",
    nameBn: "নওগাঁ পলিটেকনিক ইনস্টিটিউট",
    city: "Naogaon",
    division: "Rajshahi",
    type: "government",
  },
  {
    name: "Pabna Polytechnic Institute",
    nameBn: "পাবনা পলিটেকনিক ইনস্টিটিউট",
    city: "Pabna",
    division: "Rajshahi",
    type: "government",
  },
  {
    name: "Sirajganj Polytechnic Institute",
    nameBn: "সিরাজগঞ্জ পলিটেকনিক ইনস্টিটিউট",
    city: "Sirajganj",
    division: "Rajshahi",
    type: "government",
  },
  // Khulna Division
  {
    name: "Khulna Polytechnic Institute",
    nameBn: "খুলনা পলিটেকনিক ইনস্টিটিউট",
    city: "Khulna",
    division: "Khulna",
    type: "government",
  },
  {
    name: "Khulna Mohila Polytechnic Institute",
    nameBn: "খুলনা মহিলা পলিটেকনিক ইনস্টিটিউট",
    city: "Khulna",
    division: "Khulna",
    type: "government",
  },
  {
    name: "Jashore Polytechnic Institute",
    nameBn: "যশোর পলিটেকনিক ইনস্টিটিউট",
    city: "Jashore",
    division: "Khulna",
    type: "government",
  },
  {
    name: "Jashore Govt. Survey Institute",
    nameBn: "যশোর সরকারি সার্ভে ইনস্টিটিউট",
    city: "Jashore",
    division: "Khulna",
    type: "government",
  },
  {
    name: "Jhenaidah Polytechnic Institute",
    nameBn: "ঝিনাইদহ পলিটেকনিক ইনস্টিটিউট",
    city: "Jhenaidah",
    division: "Khulna",
    type: "government",
  },
  {
    name: "Kushtia Polytechnic Institute",
    nameBn: "কুষ্টিয়া পলিটেকনিক ইনস্টিটিউট",
    city: "Kushtia",
    division: "Khulna",
    type: "government",
  },
  {
    name: "Magura Polytechnic Institute",
    nameBn: "মাগুরা পলিটেকনিক ইনস্টিটিউট",
    city: "Magura",
    division: "Khulna",
    type: "government",
  },
  {
    name: "Satkhira Polytechnic Institute",
    nameBn: "সাতক্ষীরা পলিটেকনিক ইনস্টিটিউট",
    city: "Satkhira",
    division: "Khulna",
    type: "government",
  },
  // Rangpur Division
  {
    name: "Rangpur Polytechnic Institute",
    nameBn: "রংপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Rangpur",
    division: "Rangpur",
    type: "government",
  },
  {
    name: "Rangpur Govt. Mohila Polytechnic Institute",
    nameBn: "রংপুর সরকারি মহিলা পলিটেকনিক ইনস্টিটিউট",
    city: "Rangpur",
    division: "Rangpur",
    type: "government",
  },
  {
    name: "Dinajpur Polytechnic Institute",
    nameBn: "দিনাজপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Dinajpur",
    division: "Rangpur",
    type: "government",
  },
  {
    name: "Kurigram Polytechnic Institute",
    nameBn: "কুরিগ্রাম পলিটেকনিক ইনস্টিটিউট",
    city: "Kurigram",
    division: "Rangpur",
    type: "government",
  },
  {
    name: "Thakurgaon Polytechnic Institute",
    nameBn: "ঠাকুরগাঁও পলিটেকনিক ইনস্টিটিউট",
    city: "Thakurgaon",
    division: "Rangpur",
    type: "government",
  },
  // Barishal Division
  {
    name: "Barishal Polytechnic Institute",
    nameBn: "বরিশাল পলিটেকনিক ইনস্টিটিউট",
    city: "Barishal",
    division: "Barishal",
    type: "government",
  },
  {
    name: "Barguna Polytechnic Institute",
    nameBn: "বরগুনা পলিটেকনিক ইনস্টিটিউট",
    city: "Barguna",
    division: "Barishal",
    type: "government",
  },
  {
    name: "Bhola Polytechnic Institute",
    nameBn: "ভোলা পলিটেকনিক ইনস্টিটিউট",
    city: "Bhola",
    division: "Barishal",
    type: "government",
  },
  {
    name: "Patuakhali Polytechnic Institute",
    nameBn: "পটুয়াখালী পলিটেকনিক ইনস্টিটিউট",
    city: "Patuakhali",
    division: "Barishal",
    type: "government",
  },
  // Sylhet Division
  {
    name: "Sylhet Polytechnic Institute",
    nameBn: "সিলেট পলিটেকনিক ইনস্টিটিউট",
    city: "Sylhet",
    division: "Sylhet",
    type: "government",
  },
  {
    name: "Habiganj Polytechnic Institute",
    nameBn: "হবিগঞ্জ পলিটেকনিক ইনস্টিটিউট",
    city: "Habiganj",
    division: "Sylhet",
    type: "government",
  },
  {
    name: "Moulvibazar Polytechnic Institute",
    nameBn: "মৌলভীবাজার পলিটেকনিক ইনস্টিটিউট",
    city: "Moulvibazar",
    division: "Sylhet",
    type: "government",
  },
  // Mymensingh Division
  {
    name: "Mymensingh Polytechnic Institute",
    nameBn: "ময়মনসিংহ পলিটেকনিক ইনস্টিটিউট",
    city: "Mymensingh",
    division: "Mymensingh",
    type: "government",
  },
  {
    name: "Sherpur Polytechnic Institute",
    nameBn: "শেরপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Sherpur",
    division: "Mymensingh",
    type: "government",
  },
];

/** Notable private polytechnic institutes. */
const PRIVATE_SEEDS: InstituteSeed[] = [
  {
    name: "Daffodil Polytechnic Institute (DPI)",
    nameBn: "ড্যাফোডিল পলিটেকনিক ইনস্টিটিউট",
    city: "Dhaka",
    division: "Dhaka",
    type: "private",
  },
  {
    name: "National Polytechnic Institute (NPI)",
    nameBn: "ন্যাশনাল পলিটেকনিক ইনস্টিটিউট",
    city: "Dhaka & Manikganj",
    division: "Dhaka",
    type: "private",
  },
  {
    name: "Shyamoli Ideal Polytechnic Institute",
    nameBn: "শ্যামলী আইডিয়াল পলিটেকনিক ইনস্টিটিউট",
    city: "Dhaka, Chattogram, Rangpur, Lakshmipur",
    division: "Dhaka",
    type: "private",
  },
  {
    name: "MAWTS Institute of Technology",
    nameBn: "মাওটস ইনস্টিটিউট অফ টেকনোলজি",
    city: "Dhaka",
    division: "Dhaka",
    type: "private",
  },
  {
    name: "SAIC Institute of Management & Technology (SIMT)",
    nameBn: "সাইক ইনস্টিটিউট অফ ম্যানেজমেন্ট অ্যান্ড টেকনোলজি",
    city: "Dhaka",
    division: "Dhaka",
    type: "private",
  },
  {
    name: "Mirpur Polytechnic Institute",
    nameBn: "মিরপুর পলিটেকনিক ইনস্টিটিউট",
    city: "Dhaka",
    division: "Dhaka",
    type: "private",
  },
  {
    name: "BCMC College of Engineering & Technology",
    nameBn: "বিসিএমসি কলেজ অফ ইঞ্জিনিয়ারিং অ্যান্ড টেকনোলজি",
    city: "Jashore",
    division: "Khulna",
    type: "private",
  },
  {
    name: "Mangrove Institute of Science and Technology",
    nameBn: "ম্যাঙ্গ্রোভ ইনস্টিটিউট অফ সায়েন্স অ্যান্ড টেকনোলজি",
    city: "Khulna",
    division: "Khulna",
    type: "private",
  },
  {
    name: "Infra Polytechnic Institute",
    nameBn: "ইনফ্রা পলিটেকনিক ইনস্টিটিউট",
    city: "Barishal",
    division: "Barishal",
    type: "private",
  },
  {
    name: "CCN Polytechnic Institute",
    nameBn: "সিসিএন পলিটেকনিক ইনস্টিটিউট",
    city: "Cumilla",
    division: "Chattogram",
    type: "private",
  },
  {
    name: "Haji Abul Hossain Institute of Technology (HABHIT)",
    nameBn: "হাজী আবুল হোসেন ইনস্টিটিউট অফ টেকনোলজি",
    city: "Tangail",
    division: "Dhaka",
    type: "private",
  },
  {
    name: "Islamic Bank Institute of Technology (IBIT)",
    nameBn: "ইসলামিক ব্যাংক ইনস্টিটিউট অফ টেকনোলজি",
    city: "Dhaka, Chattogram, Bogura, Sylhet",
    division: "Dhaka",
    type: "private",
  },
];

function slugId(seed: InstituteSeed): string {
  const slug = seed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return seed.type === "private" ? `p-${slug}` : slug;
}

const CATALOG_INSTITUTES: Institute[] = [...GOVERNMENT_SEEDS, ...PRIVATE_SEEDS].map((seed) => ({
  id: slugId(seed),
  name: seed.name,
  nameBn: seed.nameBn,
  city: seed.city,
  division: seed.division,
  type: seed.type,
  buildings: genericBuildings(100),
  locations: [],
}));

export interface InstituteGroup {
  id: string;
  label: string;
  items: Institute[];
}

/** Dropdown groups: government institutes by division, then all private ones. */
export function groupInstitutes(list: Institute[]): InstituteGroup[] {
  const groups: InstituteGroup[] = DIVISION_ORDER.map((division) => ({
    id: `gov-${division.toLowerCase()}`,
    label: `${division} Division`,
    items: list.filter((i) => i.type === "government" && i.division === division),
  })).filter((g) => g.items.length > 0);
  const privates = list.filter((i) => i.type === "private");
  if (privates.length > 0)
    groups.push({ id: "private", label: "Private institutes", items: privates });
  return groups;
}

export const INSTITUTES: [Institute, ...Institute[]] = [
  {
    id: "rpi",
    name: "Rajshahi Polytechnic Institute",
    nameBn: "রাজশাহী পলিটেকনিক ইনস্টিটিউট",
    city: "Rajshahi",
    division: "Rajshahi",
    type: "government",
    buildings: rajshahiBuildings,
    map: RPI_MAP,
    locations: [
      {
        id: "rpi-205",
        name: "Room 205 (Computer Tech)",
        nameBn: "রুম ২০৫",
        category: "classroom",
        buildingId: "academic",
        floor: 2,
        turn: "left",
        landmark: "Red Notice Board",
        side: "right",
        door: 2,
        department: "Computer Technology",
        keywords: ["205", "cmt", "computer"],
      },
      {
        id: "rpi-302",
        name: "Room 302 (Civil Tech)",
        nameBn: "রুম ৩০২",
        category: "classroom",
        buildingId: "academic",
        floor: 3,
        turn: "right",
        landmark: "Water Filter Corner",
        side: "left",
        door: 2,
        department: "Civil Technology",
        keywords: ["302", "civil"],
      },
      {
        id: "rpi-softlab",
        name: "Software Lab 1",
        nameBn: "সফটওয়্যার ল্যাব ১",
        category: "lab",
        buildingId: "academic",
        floor: 1,
        turn: "right",
        landmark: "Glass Door with Department Signboard",
        side: "right",
        door: 3,
        department: "Computer Technology",
        keywords: ["computer lab", "software", "lab 1"],
      },
      {
        id: "rpi-physics",
        name: "Physics & Electronics Lab",
        nameBn: "পদার্থ ও ইলেকট্রনিক্স ল্যাব",
        category: "lab",
        buildingId: "academic",
        floor: 0,
        turn: "left",
        landmark: "Blue Fire Extinguisher Box",
        side: "left",
        door: 3,
        department: "Electronics Technology",
        keywords: ["physics", "electronics", "lab"],
      },
      {
        id: "rpi-principal",
        name: "Principal's Office (অধ্যক্ষের কার্যালয়)",
        nameBn: "অধ্যক্ষের কার্যালয়",
        category: "office",
        buildingId: "admin",
        floor: 1,
        turn: "right",
        landmark: "Wooden Reception Desk",
        side: "left",
        door: 1,
        keywords: ["principal", "অধ্যক্ষ", "head"],
      },
      {
        id: "rpi-stipend",
        name: "Stipend & Registrar Section (উপবৃত্তি শাখা)",
        nameBn: "উপবৃত্তি ও রেজিস্ট্রার শাখা",
        category: "office",
        buildingId: "admin",
        floor: 0,
        turn: "left",
        landmark: "Green Info Board",
        side: "right",
        door: 2,
        keywords: ["stipend", "registrar", "উপবৃত্তি", "রেজিস্ট্রার"],
      },
      {
        id: "rpi-library",
        name: "Central Library",
        nameBn: "কেন্দ্রীয় গ্রন্থাগার",
        category: "facility",
        buildingId: "library",
        floor: 0,
        turn: "right",
        landmark: "Shoe Rack at the Entrance",
        side: "left",
        door: 1,
        keywords: ["library", "book", "লাইব্রেরি"],
      },
      {
        id: "rpi-canteen",
        name: "Student Canteen",
        nameBn: "ছাত্র ক্যান্টিন",
        category: "facility",
        buildingId: "canteen",
        floor: 0,
        turn: "left",
        landmark: "Tea Stall Counter",
        side: "right",
        door: 1,
        keywords: ["canteen", "food", "tea", "ক্যান্টিন"],
      },
    ],
  },
  {
    id: "dpi",
    name: "Dhaka Polytechnic Institute",
    nameBn: "ঢাকা পলিটেকনিক ইনস্টিটিউট",
    city: "Dhaka",
    division: "Dhaka",
    type: "government",
    buildings: genericBuildings(110),
    locations: [
      {
        id: "dpi-401",
        name: "Room 401 (Electrical Tech)",
        category: "classroom",
        buildingId: "academic",
        floor: 4,
        turn: "left",
        landmark: "Department Notice Board",
        side: "right",
        door: 1,
        department: "Electrical Technology",
        keywords: ["401", "electrical"],
      },
      {
        id: "dpi-cadlab",
        name: "AutoCAD Lab",
        category: "lab",
        buildingId: "academic",
        floor: 2,
        turn: "right",
        landmark: "Glass Partition",
        side: "left",
        door: 2,
        keywords: ["cad", "computer lab", "drawing"],
      },
      {
        id: "dpi-principal",
        name: "Principal's Office (অধ্যক্ষের কার্যালয়)",
        category: "office",
        buildingId: "admin",
        floor: 1,
        turn: "left",
        landmark: "Reception Desk",
        side: "right",
        door: 1,
        keywords: ["principal", "অধ্যক্ষ"],
      },
      {
        id: "dpi-washroom",
        name: "Washroom (Ground Floor)",
        category: "facility",
        buildingId: "academic",
        floor: 0,
        turn: "right",
        landmark: "Main Staircase",
        side: "right",
        door: 4,
        keywords: ["toilet", "washroom", "ওয়াশরুম"],
      },
    ],
  },
  {
    id: "bpi",
    name: "Bogura Polytechnic Institute",
    nameBn: "বগুড়া পলিটেকনিক ইনস্টিটিউট",
    city: "Bogura",
    division: "Rajshahi",
    type: "government",
    buildings: genericBuildings(90),
    locations: [
      {
        id: "bpi-105",
        name: "Room 105 (Mechanical Tech)",
        category: "classroom",
        buildingId: "academic",
        floor: 1,
        turn: "right",
        landmark: "Yellow Pillar",
        side: "left",
        door: 2,
        department: "Mechanical Technology",
        keywords: ["105", "mechanical"],
      },
      {
        id: "bpi-chem",
        name: "Chemistry Lab",
        category: "lab",
        buildingId: "academic",
        floor: 0,
        turn: "left",
        landmark: "First Aid Box",
        side: "right",
        door: 3,
        keywords: ["chemistry", "lab"],
      },
      {
        id: "bpi-stipend",
        name: "Stipend Section (উপবৃত্তি শাখা)",
        category: "office",
        buildingId: "admin",
        floor: 0,
        turn: "right",
        landmark: "Accounts Counter",
        side: "left",
        door: 2,
        keywords: ["stipend", "উপবৃত্তি"],
      },
    ],
  },
  ...CATALOG_INSTITUTES,
];

/* ---------------- Search ---------------- */

export type CategoryFilter = Category | "all";

export function searchLocations(
  locations: CampusLocation[],
  buildings: Building[],
  query: string,
  filter: CategoryFilter,
): CampusLocation[] {
  const q = query.trim().toLowerCase();
  return locations.filter((loc) => {
    if (filter !== "all" && loc.category !== filter) return false;
    if (!q) return true;
    const building = buildings.find((b) => b.id === loc.buildingId);
    const haystack = [
      loc.name,
      loc.nameBn,
      loc.department,
      building?.name,
      CATEGORY_META[loc.category].label,
      ...(loc.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/* ---------------- Route generation ---------------- */

export interface RouteStep {
  kind: "walk" | "enter" | "stairs" | "turn" | "arrive";
  titleBn: string;
  title: string;
  detail: string;
}

export interface NavRoute {
  breadcrumb: string[];
  steps: RouteStep[];
  walkingSteps: number;
  minutes: number;
}

export function floorLabel(floor: number): string {
  if (floor === 0) return "Ground Floor";
  return `${ordinal(floor)} Floor`;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function shortName(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, "").trim();
}

/** Estimated walking steps (≈1.35 steps per meter, stairs count ~18 steps per floor). */
export function estimateSteps(meters: number, floor: number, door: number): number {
  const corridor = 6 + door * 7;
  const raw = (meters + corridor) * 1.35 + floor * 18;
  return Math.max(10, Math.round(raw / 5) * 5);
}

export function estimateMinutes(steps: number): number {
  return Math.max(1, Math.ceil(steps / 90));
}

export function buildRoute(
  start: StartPoint,
  loc: CampusLocation,
  buildings: Building[],
): NavRoute {
  const building: Building = buildings.find((b) => b.id === loc.buildingId) ??
    buildings[0] ?? {
      id: "unknown",
      name: "Campus Building",
      look: "building",
      isAcademic: false,
      distance: {
        "main-gate": 60,
        "shaheed-minar": 40,
        "academic-ground": 40,
        "academic-entrance": 40,
      },
    };
  const meters = building.distance[start.id] ?? 60;
  const insideAlready = meters === 0;
  const steps: RouteStep[] = [];

  if (!insideAlready) {
    let detail: string;
    if (start.id === "main-gate") {
      detail = `Enter through the Main Gate and walk straight ${meters} meters${
        building.isAcademic ? " past the Shaheed Minar" : ""
      } toward the ${building.look}.`;
    } else if (start.id === "shaheed-minar") {
      detail = `Stand facing away from the Shaheed Minar and walk ${meters} meters toward the ${building.look}.`;
    } else {
      detail = `Exit the Academic Building and walk ${meters} meters to the ${building.look}.`;
    }
    steps.push({ kind: "walk", titleBn: "হাঁটুন", title: "Walk", detail });
  }

  if (insideAlready) {
    steps.push({
      kind: "enter",
      titleBn: start.id === "academic-entrance" ? "প্রবেশ করুন" : "শুরু করুন",
      title: start.id === "academic-entrance" ? "Enter" : "Start",
      detail:
        start.id === "academic-entrance"
          ? `You're at the QR checkpoint. Step inside the ${building.look} lobby.`
          : "You're in the Ground Floor lobby. Walk to the main staircase beside the reception.",
    });
  } else {
    steps.push({
      kind: "enter",
      titleBn: "প্রবেশ করুন",
      title: "Enter",
      detail: `Enter the ${building.look} through the main door.`,
    });
  }

  if (loc.floor > 0) {
    steps.push({
      kind: "stairs",
      titleBn: "সিঁড়ি দিয়ে উঠুন",
      title: "Take the stairs",
      detail: `Take the main stairs up to the ${floorLabel(loc.floor)}.`,
    });
  } else {
    steps.push({
      kind: "stairs",
      titleBn: "নিচতলায় থাকুন",
      title: "Stay on this floor",
      detail: "Stay on the Ground Floor and follow the main corridor.",
    });
  }

  steps.push({
    kind: "arrive",
    titleBn: "গন্তব্যে পৌঁছান",
    title: "Arrive",
    detail: `Turn ${loc.turn} at the ${loc.landmark} — ${shortName(loc.name)} is the ${ordinal(
      loc.door,
    )} door on your ${loc.side}.`,
  });

  const customLines = (loc.directions ?? []).map((d) => d.trim()).filter(Boolean);
  if (customLines.length > 0) {
    steps.length = 0;
    customLines.forEach((detail, i) => {
      const last = i === customLines.length - 1;
      steps.push({
        kind: last ? "arrive" : i === 0 ? "walk" : "turn",
        title: last ? "Arrive" : i === 0 ? "Walk" : "Continue",
        titleBn: last ? "গন্তব্যে পৌঁছান" : i === 0 ? "হাঁটুন" : "এগিয়ে যান",
        detail,
      });
    });
  }

  const walkingSteps =
    loc.walkingSteps && loc.walkingSteps > 0
      ? Math.round(loc.walkingSteps)
      : estimateSteps(meters, loc.floor, loc.door);

  const breadcrumb = [start.name];
  if (!(insideAlready && start.id === "academic-ground")) breadcrumb.push(building.name);
  breadcrumb.push(floorLabel(loc.floor));
  breadcrumb.push(shortName(loc.name));

  return { breadcrumb, steps, walkingSteps, minutes: estimateMinutes(walkingSteps) };
}
