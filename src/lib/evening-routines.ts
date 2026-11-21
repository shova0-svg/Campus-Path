import type { ClassRoutine, Period, RoutineEntry } from "@/lib/routine";

type Subject = { code: string; subject: string; teacher: string; acronym: string };
type Cell = [code: string, period: number, endPeriod: number, room: string];
type DayCells = [string, Cell[]][];

const PERIODS: Period[] = [
  { id: 1, label: "1", time: "1:30-2:15" },
  { id: 2, label: "2", time: "2:15-3:00" },
  { id: 3, label: "3", time: "3:00-3:45" },
  { id: 4, label: "4", time: "3:45-4:30" },
  { id: 5, label: "5", time: "4:30-5:15" },
  { id: 6, label: "6", time: "5:15-6:00" },
  { id: 7, label: "7", time: "6:00-6:45" },
];

function build(
  id: string,
  title: string,
  semester: number,
  classLoad: number,
  subjects: Subject[],
  days: DayCells,
): ClassRoutine {
  const now = "2026-11-21T00:00:00.000Z";
  const entries: RoutineEntry[] = days.flatMap(([day, cells]) =>
    cells.map(([code, period, endPeriod, room], i) => {
      const s = subjects.find((x) => x.code === code);
      return {
        id: `${id}-${day}-${period}-${i}`,
        day: day as RoutineEntry["day"],
        period,
        endPeriod,
        code,
        subject: s?.subject ?? code,
        teacher: s?.teacher ?? "—",
        acronym: s?.acronym ?? code,
        room,
      };
    }),
  );
  return {
    id,
    instituteId: "rpi",
    semester,
    shift: "Evening",
    department: "Computer Science & Technology",
    title,
    classStart: "27-09-2026",
    classLoad,
    periods: PERIODS,
    entries,
    source: "seeded",
    verified: true,
    createdAt: now,
    updatedAt: now,
  };
}

const S1: Subject[] = [
  { code: "21011", subject: "Engineering Drawing", teacher: "Md. Zahangir Alam", acronym: "ZA" },
  { code: "25711", subject: "Bangla-I", teacher: "Md. Monjur Rahman Rabbi", acronym: "MRR" },
  { code: "25712", subject: "English-I", teacher: "Mahmudunnabi Milon", acronym: "MM" },
  { code: "25911", subject: "Mathematics-I", teacher: "Md. Shakil Uddin", acronym: "SU" },
  { code: "25912", subject: "Physics-I", teacher: "Md. Al-Mamun", acronym: "AM" },
  {
    code: "28511",
    subject: "Computer Office Application",
    teacher: "Md. Shahinul Islam",
    acronym: "SI",
  },
  { code: "26711", subject: "Basic Electricity", teacher: "Amit Kumar Pramanik", acronym: "AKP" },
];

const S3: Subject[] = [
  { code: "25811", subject: "Social Science", teacher: "Md. Shakil Uddin", acronym: "SU" },
  { code: "25922", subject: "Physics-II", teacher: "Abdullah Al Mahmud", acronym: "AAM" },
  { code: "25931", subject: "Mathematics-III", teacher: "Abdullah Al Tarek", acronym: "AAT" },
  {
    code: "28531",
    subject: "Application Development Using Python",
    teacher: "Md. Shahinul Islam",
    acronym: "SI",
  },
  {
    code: "28532",
    subject: "Computer Graphics Design-II",
    teacher: "Md. Shahinul Islam",
    acronym: "SI",
  },
  { code: "28533", subject: "IT Support Services", teacher: "Mohammad Ali", acronym: "MA" },
  { code: "26831", subject: "Digital Electronics-I", teacher: "Md. Shaho Zaman", acronym: "SZ" },
];

const S4: Subject[] = [
  { code: "25831", subject: "Business Communication", teacher: "Md. Abu Bakkar", acronym: "AB" },
  { code: "28541", subject: "Java Programming", teacher: "Md. Shahinul Islam", acronym: "SI" },
  { code: "28542", subject: "Data Structure & Algorithm", teacher: "Mohammad Ali", acronym: "MA" },
  {
    code: "28543",
    subject: "Computer Peripherals & Interfacing",
    teacher: "Kousik Kumar Halder",
    acronym: "KKH",
  },
  {
    code: "28544",
    subject: "Web Design & Development-I",
    teacher: "Md. Abu Bakkar",
    acronym: "AB",
  },
  { code: "26841", subject: "Digital Electronics-II", teacher: "Asaduzzaman Rabi", acronym: "AZR" },
  { code: "29041", subject: "Environmental Studies", teacher: "Nilima Sultana", acronym: "NS" },
];

const S6: Subject[] = [
  { code: "28551", subject: "Principles of Marketing", teacher: "Urmi Aktar", acronym: "UA" },
  {
    code: "28552",
    subject: "Industrial Management",
    teacher: "Md. Abdul Malek Pramanik",
    acronym: "AMP",
  },
  {
    code: "28561",
    subject: "Database Management System",
    teacher: "Md. Abu Bakkar",
    acronym: "AB",
  },
  { code: "28562", subject: "Computer Networking", teacher: "Kousik Kumar Halder", acronym: "KKH" },
  { code: "28563", subject: "Sensor & IoT System", teacher: "Md. Shakil Uddin", acronym: "SU" },
  {
    code: "28564",
    subject: "Microcontroller Based System Design & Development",
    teacher: "Nasrin Akter",
    acronym: "NA",
  },
  {
    code: "28565",
    subject: "Surveillance Security System",
    teacher: "Kousik Kumar Halder",
    acronym: "KKH",
  },
  { code: "28566", subject: "Web Development Project", teacher: "Md. Abu Bakkar", acronym: "AB" },
];

export function eveningRoutines(): ClassRoutine[] {
  return [
    build("rpi-cst-eve-1", "CST 1st Semester · 2nd Shift", 1, 34, S1, [
      [
        "Sunday",
        [
          ["21011", 2, 3, "2305"],
          ["25911", 4, 4, "2206"],
          ["25711", 5, 5, "2303"],
          ["25912", 6, 6, "2303"],
        ],
      ],
      [
        "Monday",
        [
          ["25911", 1, 1, "3209"],
          ["26711", 2, 4, "5210"],
          ["25912", 5, 7, "2106"],
        ],
      ],
      [
        "Tuesday",
        [
          ["26711", 1, 1, "2303"],
          ["25712", 2, 2, "2303"],
          ["25711", 3, 3, "2303"],
          ["21011", 4, 6, "2305"],
          ["25912", 7, 7, "2305"],
        ],
      ],
      [
        "Wednesday",
        [
          ["28511", 2, 3, "1302"],
          ["25712", 4, 4, "3402"],
          ["26711", 5, 5, "3402"],
          ["25911", 6, 7, "3402"],
        ],
      ],
      [
        "Thursday",
        [
          ["25911", 1, 2, "2306"],
          ["25912", 3, 3, "2306"],
          ["28511", 4, 6, "1302"],
          ["26711", 7, 7, "2303"],
        ],
      ],
    ]),
    build("rpi-cst-eve-3", "CST 3rd Semester · 2nd Shift", 3, 35, S3, [
      [
        "Sunday",
        [
          ["25811", 1, 1, "2306"],
          ["28533", 2, 2, "2306"],
          ["28531", 3, 3, "2306"],
          ["25922", 5, 5, "2106"],
          ["25931", 7, 7, "2306"],
        ],
      ],
      [
        "Monday",
        [
          ["28531", 1, 3, "1308"],
          ["25922", 4, 4, "2303"],
          ["28533", 5, 5, "2303"],
          ["25931", 6, 7, "2303"],
        ],
      ],
      [
        "Tuesday",
        [
          ["26831", 1, 1, "2306"],
          ["28531", 2, 2, "2306"],
          ["25931", 3, 4, "2306"],
          ["28533", 5, 7, "1305"],
        ],
      ],
      [
        "Wednesday",
        [
          ["26831", 1, 3, "5206"],
          ["28532", 4, 6, "1308"],
          ["25922", 7, 7, "1308"],
        ],
      ],
      [
        "Thursday",
        [
          ["28533", 1, 3, "1305"],
          ["25931", 4, 4, "2306"],
          ["25922", 5, 5, "2306"],
          ["25811", 6, 6, "2306"],
          ["26831", 7, 7, "2306"],
        ],
      ],
    ]),
    build("rpi-cst-eve-4", "CST 4th Semester · 2nd Shift", 4, 35, S4, [
      [
        "Sunday",
        [
          ["26841", 1, 1, "2303"],
          ["29041", 2, 2, "2303"],
          ["28542", 3, 3, "2303"],
          ["25831", 4, 4, "2303"],
          ["28541", 6, 6, "1308"],
        ],
      ],
      [
        "Monday",
        [
          ["28542", 2, 3, "1302"],
          ["28543", 4, 4, "2306"],
          ["29041", 5, 7, "2206"],
        ],
      ],
      [
        "Tuesday",
        [
          ["26841", 2, 3, "5202"],
          ["28543", 4, 4, "1302"],
          ["28544", 5, 7, "1302"],
        ],
      ],
      [
        "Wednesday",
        [
          ["28544", 1, 1, "2306"],
          ["28542", 2, 2, "2306"],
          ["25831", 3, 3, "2306"],
          ["28543", 4, 6, "1305"],
          ["28541", 7, 7, "2306"],
        ],
      ],
      [
        "Thursday",
        [
          ["28544", 1, 3, "1302"],
          ["29041", 4, 4, "1305"],
          ["26841", 5, 5, "2305"],
          ["28543", 6, 6, "2305"],
          ["28541", 7, 7, "2305"],
        ],
      ],
    ]),
    build("rpi-cst-eve-6", "CST 6th Semester · 2nd Shift", 6, 34, S6, [
      [
        "Sunday",
        [
          ["28561", 2, 3, "1305"],
          ["28552", 4, 4, "1305"],
          ["28563", 6, 6, "1302"],
        ],
      ],
      [
        "Monday",
        [
          ["28562", 2, 3, "1305"],
          ["28563", 4, 4, "1305"],
          ["28564", 6, 6, "1305"],
        ],
      ],
      [
        "Tuesday",
        [
          ["28562", 2, 3, "1302"],
          ["28561", 4, 4, "1302"],
          ["28563", 5, 5, "2306"],
          ["28564", 6, 6, "2306"],
        ],
      ],
      [
        "Wednesday",
        [
          ["28564", 1, 1, "2303"],
          ["28551", 2, 2, "2303"],
          ["28562", 3, 3, "2303"],
          ["28552", 4, 4, "2303"],
          ["28566", 6, 7, "1305"],
        ],
      ],
      [
        "Thursday",
        [
          ["28562", 1, 1, "1308"],
          ["28551", 2, 2, "2303"],
          ["28565", 3, 3, "2303"],
          ["28561", 4, 4, "2303"],
          ["28564", 6, 6, "1305"],
        ],
      ],
    ]),
  ];
}
