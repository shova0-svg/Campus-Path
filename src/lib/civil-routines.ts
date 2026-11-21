import type { ClassRoutine, Period, RoutineEntry } from "@/lib/routine";

type Subject = { code: string; subject: string; teacher: string; acronym: string };
type Cell = [code: string, period: number, endPeriod: number, room: string];
type DayCells = [string, Cell[]][];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;

function build(
  id: string,
  title: string,
  semester: number,
  classLoad: number,
  periods: Period[],
  subjects: Subject[],
  days: DayCells,
): ClassRoutine {
  const now = "2026-11-21T00:00:00.000Z";
  const entries: RoutineEntry[] = days.flatMap(([day, cells], di) =>
    cells.map(([code, period, endPeriod, room], i) => {
      const s = subjects.find((x) => x.code === code);
      return {
        id: `${id}-${DAYS[di] ?? di}-${period}-${i}`,
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
    shift: "Morning",
    department: "Civil Technology",
    title,
    classStart: "27-09-2026",
    classLoad,
    periods,
    entries,
    source: "seeded",
    verified: true,
    createdAt: now,
    updatedAt: now,
  };
}

const S3 = (rk?: Subject): Subject[] => [
  {
    code: "25831",
    subject: "Business Communication",
    teacher: "SYEDA SADIKA AKHTER JAHAN",
    acronym: "SAJ",
  },
  { code: "25922", subject: "Physics-II", teacher: "KABIR AHMED", acronym: "KA" },
  { code: "25931", subject: "Mathematics-III", teacher: "MST. AZMIRIN KHATUN", acronym: "AK" },
  { code: "26431", subject: "Structural Mechanics", teacher: "MD. MOSTOFA KAMAL", acronym: "MK" },
  { code: "26432", subject: "Surveying-I", teacher: "MD. SAKIL PARVEZ", acronym: "SP" },
  { code: "26433", subject: "Construction Process-I", teacher: "NUR RAFIA KHANAM", acronym: "NR" },
  rk ?? {
    code: "28511",
    subject: "Computer Office Application",
    teacher: "MD. SORIAT ULLAH",
    acronym: "MSU",
  },
];

const S4: Subject[] = [
  { code: "25841", subject: "Accounting", teacher: "MD. JAHANGIR ALAM", acronym: "JA" },
  {
    code: "26441",
    subject: "Construction Process-II",
    teacher: "MD. SHAHID HOSSAIN",
    acronym: "SH",
  },
  { code: "26442", subject: "Estimating & Costing-I", teacher: "MD. SAKIL PARVEZ", acronym: "SU" },
  { code: "26443", subject: "Civil CAD-I", teacher: "ABDUL AZIZ", acronym: "AA" },
  { code: "26444", subject: "Surveying-II", teacher: "MD. NURUL AMIN", acronym: "NA" },
  {
    code: "26445",
    subject: "Geotechnical Engineering",
    teacher: "MD. RASHEL AFRIDE",
    acronym: "RA",
  },
  { code: "26446", subject: "Hydrology", teacher: "KM MONIRUZZAMAN", acronym: "KMM" },
  { code: "26521", subject: "Wood Workshop Practice", teacher: "MD. SAKIL PARVEZ", acronym: "SU" },
];

const S6A: Subject[] = [
  {
    code: "26461",
    subject: "Water Resources Engineering",
    teacher: "MD. NURUL AMIN",
    acronym: "NA",
  },
  { code: "26462", subject: "Advance Surveying", teacher: "MD. SAKIL PARVEZ", acronym: "SP" },
  {
    code: "26463",
    subject: "Transportation Engineering-I",
    teacher: "MD. RASHEL AFRIDE",
    acronym: "RA",
  },
  {
    code: "26464",
    subject: "Design of Structure-I",
    teacher: "ASM HUMAYUN KABIR HURAIRABIN LATIF",
    acronym: "HK",
  },
  { code: "28863", subject: "Steel Structures", teacher: "ABDUL AZIZ", acronym: "AA" },
  { code: "28861", subject: "Advanced Construction", teacher: "MD. SAKIL PARVEZ", acronym: "SP" },
  { code: "29041", subject: "Environmental Studies", teacher: "KM MONIRUZZAMAN", acronym: "KMM" },
];

const S6B: Subject[] = [
  {
    code: "26461",
    subject: "Water Resources Engineering",
    teacher: "MD. NURUL AMIN",
    acronym: "NA",
  },
  { code: "26462", subject: "Advance Surveying", teacher: "MD. SAKIL PARVEZ", acronym: "SP" },
  {
    code: "26463",
    subject: "Transportation Engineering-I",
    teacher: "MD. RASHEL AFRIDE",
    acronym: "RA",
  },
  {
    code: "26464",
    subject: "Design of Structure-I",
    teacher: "ASM HUMAYUN KABIR HURAIRABIN LATIF",
    acronym: "HK",
  },
  { code: "28863", subject: "Steel Structures", teacher: "ABDUL AZIZ", acronym: "AA" },
  { code: "28861", subject: "Advanced Construction", teacher: "MD. SHAHID HOSSAIN", acronym: "SH" },
  { code: "29041", subject: "Environmental Studies", teacher: "KM MONIRUZZAMAN", acronym: "MK" },
];

const S1A: Subject[] = [
  { code: "21011", subject: "Engineering Drawing", teacher: "ABDUL AZIZ", acronym: "AA" },
  { code: "25711", subject: "Bangla-I", teacher: "MST. RABEYA SIDDIQUA", acronym: "RS" },
  { code: "25712", subject: "English-I", teacher: "MD. NURULLAH", acronym: "MN" },
  { code: "25811", subject: "Social Science", teacher: "SAMROZ NAHAR", acronym: "SN" },
  { code: "25911", subject: "Mathematics-I", teacher: "MD. ABDUR RAZZAK", acronym: "AR" },
  { code: "25913", subject: "Chemistry", teacher: "MD. MAHBUBUR RAHMAN", acronym: "MR" },
  {
    code: "26411",
    subject: "Civil Engineering Materials",
    teacher: "MD. SHAHID HOSSAIN",
    acronym: "SH",
  },
  { code: "26711", subject: "Basic Electricity", teacher: "MD. MAHADY HASAN", acronym: "MH" },
];

const S1B: Subject[] = [
  { code: "21011", subject: "Engineering Drawing", teacher: "MD. SAHAB UDDIN", acronym: "SU" },
  { code: "25711", subject: "Bangla-I", teacher: "MST. RABEYA SIDDIQUA", acronym: "RS" },
  { code: "25712", subject: "English-I", teacher: "MD. NURULLAH", acronym: "MN" },
  { code: "25811", subject: "Social Science", teacher: "SAMROZ NAHAR", acronym: "SN" },
  { code: "25911", subject: "Mathematics-I", teacher: "MD. ABDUR RAZZAK", acronym: "AR" },
  { code: "25913", subject: "Chemistry", teacher: "SM. KAMRUZZAMAN", acronym: "SMK" },
  {
    code: "26411",
    subject: "Civil Engineering Materials",
    teacher: "MD. SHAHID HOSSAIN",
    acronym: "SH",
  },
  { code: "26711", subject: "Basic Electricity", teacher: "MD. MOHOSIN", acronym: "MM" },
];

export function civilRoutines(periods: Period[]): ClassRoutine[] {
  return [
    build("rpi-civil-1-a", "Civil 1st Semester · Morning · Group A", 1, 35, periods, S1A, [
      [
        "Sunday",
        [
          ["25911", 2, 2, "2206"],
          ["25913", 3, 3, "2206"],
          ["26711", 4, 4, "2205"],
          ["21011", 6, 7, "2205"],
        ],
      ],
      [
        "Monday",
        [
          ["26411", 1, 1, "5102"],
          ["25712", 2, 3, "5102"],
          ["25911", 4, 5, "5102"],
          ["25913", 6, 7, "2102"],
        ],
      ],
      [
        "Tuesday",
        [
          ["25913", 1, 2, "3209"],
          ["25911", 3, 4, "3209"],
          ["26711", 5, 5, "3209"],
          ["26411", 6, 7, "4103"],
        ],
      ],
      [
        "Wednesday",
        [
          ["21011", 2, 2, "2205"],
          ["26711", 4, 4, "5105"],
          ["25913", 5, 5, "5105"],
          ["25711", 6, 6, "5105"],
          ["25811", 7, 7, "5105"],
        ],
      ],
      [
        "Thursday",
        [
          ["25712", 1, 1, "5211"],
          ["26411", 2, 3, "5211"],
          ["25711", 4, 4, "5211"],
          ["25811", 5, 5, "5211"],
          ["26711", 6, 7, "5208"],
        ],
      ],
    ]),
    build("rpi-civil-1-b", "Civil 1st Semester · Morning · Group B", 1, 35, periods, S1B, [
      [
        "Sunday",
        [
          ["26411", 2, 3, "4103"],
          ["26711", 4, 4, "4101"],
          ["25913", 5, 5, "4106"],
          ["25911", 7, 7, "4106"],
        ],
      ],
      [
        "Monday",
        [
          ["21011", 2, 2, "2305"],
          ["26711", 4, 4, "2305"],
          ["25712", 5, 5, "3404"],
          ["25811", 6, 6, "3404"],
          ["25913", 7, 7, "3404"],
        ],
      ],
      [
        "Tuesday",
        [
          ["25913", 1, 1, "3404"],
          ["26411", 2, 2, "3404"],
          ["25811", 3, 3, "3404"],
          ["25711", 4, 4, "3404"],
          ["26711", 6, 7, "5208"],
        ],
      ],
      [
        "Wednesday",
        [
          ["25911", 2, 2, "2305"],
          ["25712", 3, 3, "2305"],
          ["26711", 4, 4, "2305"],
          ["21011", 6, 7, "2305"],
        ],
      ],
      [
        "Thursday",
        [
          ["26411", 1, 2, "2302"],
          ["25913", 3, 3, "2102"],
          ["25711", 5, 5, "5102"],
          ["25911", 6, 7, "5102"],
        ],
      ],
    ]),
    build("rpi-civil-3-a", "Civil 3rd Semester · Morning · Group A", 3, 34, periods, S3(), [
      [
        "Sunday",
        [
          ["26432", 2, 3, "4105"],
          ["26433", 4, 4, "1308"],
          ["28511", 5, 6, "1308"],
        ],
      ],
      [
        "Monday",
        [
          ["26431", 1, 1, "5104"],
          ["26433", 2, 4, "4103"],
          ["25922", 5, 5, "3109"],
          ["25831", 6, 6, "3109"],
        ],
      ],
      [
        "Tuesday",
        [
          ["25931", 2, 3, "3402"],
          ["26432", 4, 4, "3402"],
          ["25922", 5, 7, "2106"],
        ],
      ],
      [
        "Wednesday",
        [
          ["28511", 2, 3, "2301"],
          ["25931", 4, 5, "2206"],
          ["25922", 6, 7, "2106"],
        ],
      ],
      [
        "Thursday",
        [
          ["25931", 1, 2, "3109"],
          ["25922", 3, 3, "3109"],
          ["26433", 4, 4, "3109"],
          ["26431", 5, 5, "3109"],
          ["25831", 6, 6, "3109"],
          ["26432", 7, 7, "3109"],
        ],
      ],
    ]),
    build(
      "rpi-civil-3-b",
      "Civil 3rd Semester · Morning · Group B",
      3,
      34,
      periods,
      S3({
        code: "28511",
        subject: "Computer Office Application",
        teacher: "MST. RIYA KHATUN",
        acronym: "RK",
      }),
      [
        [
          "Sunday",
          [
            ["25931", 2, 3, "3209"],
            ["25831", 4, 4, "3209"],
            ["26431", 5, 5, "3209"],
            ["26433", 6, 6, "3209"],
            ["25922", 7, 7, "2106"],
          ],
        ],
        [
          "Monday",
          [
            ["28511", 2, 3, "1308"],
            ["25931", 4, 5, "2203"],
            ["25922", 6, 6, "2203"],
            ["26432", 7, 7, "2203"],
          ],
        ],
        [
          "Tuesday",
          [
            ["25922", 1, 1, "3207"],
            ["26433", 2, 2, "3207"],
            ["25931", 3, 4, "3207"],
            ["26432", 5, 7, "4105"],
          ],
        ],
        [
          "Wednesday",
          [
            ["26432", 1, 1, "5104"],
            ["26433", 2, 4, "4103"],
            ["26431", 5, 5, "3109"],
            ["25831", 6, 6, "3109"],
          ],
        ],
        [
          "Thursday",
          [
            ["26431", 2, 3, "3402"],
            ["25922", 4, 4, "3402"],
            ["28511", 5, 7, "2301"],
          ],
        ],
      ],
    ),
    build("rpi-civil-4-a", "Civil 4th Semester · Morning · Group A", 4, 35, periods, S4, [
      [
        "Sunday",
        [
          ["26443", 1, 1, "4106"],
          ["26445", 2, 2, "4106"],
          ["26446", 3, 3, "4106"],
          ["26444", 4, 4, "4106"],
          ["26521", 6, 7, "5102"],
        ],
      ],
      [
        "Monday",
        [
          ["26443", 2, 3, "4101"],
          ["26521", 4, 5, "4101"],
          ["26441", 6, 6, "4103"],
        ],
      ],
      [
        "Tuesday",
        [
          ["26444", 2, 3, "4105"],
          ["26442", 4, 4, "4105"],
          ["26445", 5, 5, "3104"],
          ["25841", 6, 6, "3104"],
          ["26446", 7, 7, "3104"],
        ],
      ],
      [
        "Wednesday",
        [
          ["25841", 1, 1, "4105"],
          ["26444", 2, 2, "4105"],
          ["26442", 3, 3, "4105"],
          ["26441", 4, 4, "4105"],
          ["26445", 5, 7, "4103"],
        ],
      ],
      [
        "Thursday",
        [
          ["26442", 2, 2, "4103"],
          ["26441", 4, 4, "4104"],
          ["26446", 6, 6, "4106"],
        ],
      ],
    ]),
    build("rpi-civil-4-b", "Civil 4th Semester · Morning · Group B", 4, 35, periods, S4, [
      [
        "Sunday",
        [
          ["26521", 1, 1, "3109"],
          ["26446", 2, 2, "3109"],
          ["26442", 3, 3, "3109"],
          ["26445", 5, 5, "4103"],
          ["26444", 7, 7, "3104"],
        ],
      ],
      [
        "Monday",
        [
          ["26444", 2, 2, "4105"],
          ["26441", 4, 4, "4105"],
          ["26521", 6, 7, "5102"],
        ],
      ],
      [
        "Tuesday",
        [
          ["26442", 2, 4, "3108"],
          ["26443", 6, 6, "4101"],
        ],
      ],
      [
        "Wednesday",
        [
          ["26446", 2, 2, "4106"],
          ["26442", 4, 4, "4106"],
          ["26443", 5, 5, "4106"],
          ["26441", 6, 6, "4106"],
          ["25841", 7, 7, "4106"],
        ],
      ],
      [
        "Thursday",
        [
          ["26444", 1, 2, "5102"],
          ["26446", 3, 3, "5102"],
          ["26445", 4, 4, "5102"],
          ["26441", 6, 6, "4103"],
        ],
      ],
    ]),
    build("rpi-civil-6-a", "Civil 6th Semester · Morning · Group A", 6, 35, periods, S6A, [
      [
        "Sunday",
        [
          ["26464", 2, 3, "4102"],
          ["28863", 4, 4, "4105"],
          ["29041", 5, 5, "4105"],
          ["26461", 6, 6, "4105"],
          ["26462", 7, 7, "4105"],
        ],
      ],
      [
        "Monday",
        [
          ["28861", 2, 2, "4102"],
          ["26463", 4, 4, "3405"],
          ["29041", 6, 7, "3405"],
        ],
      ],
      [
        "Tuesday",
        [
          ["26463", 2, 2, "4103"],
          ["28861", 4, 4, "5102"],
          ["26461", 5, 5, "5102"],
          ["29041", 6, 6, "5102"],
          ["28863", 7, 7, "5102"],
        ],
      ],
      [
        "Wednesday",
        [
          ["26464", 1, 1, "5102"],
          ["28861", 2, 2, "5102"],
          ["26463", 3, 3, "5102"],
          ["26462", 4, 4, "5102"],
          ["26461", 6, 7, "5102"],
        ],
      ],
      [
        "Thursday",
        [
          ["26464", 2, 2, "4102"],
          ["28863", 4, 4, "4102"],
        ],
      ],
    ]),
    build("rpi-civil-6-b", "Civil 6th Semester · Morning · Group B", 6, 35, periods, S6B, [
      [
        "Sunday",
        [
          ["26461", 2, 2, "5102"],
          ["26464", 4, 4, "5102"],
          ["29041", 5, 5, "5104"],
          ["26462", 6, 6, "5104"],
          ["28861", 7, 7, "5104"],
        ],
      ],
      [
        "Monday",
        [
          ["26463", 1, 1, "4106"],
          ["28861", 2, 2, "4106"],
          ["26464", 3, 3, "4106"],
          ["26461", 4, 5, "4106"],
          ["29041", 6, 6, "3405"],
        ],
      ],
      [
        "Tuesday",
        [
          ["28863", 2, 3, "4102"],
          ["26463", 4, 4, "4106"],
          ["26464", 6, 7, "4102"],
        ],
      ],
      [
        "Wednesday",
        [
          ["28861", 2, 2, "4102"],
          ["28863", 4, 4, "4102"],
          ["26462", 6, 6, "4105"],
        ],
      ],
      [
        "Thursday",
        [
          ["26444", 2, 2, "5102"],
          ["26446", 3, 3, "5102"],
          ["26445", 4, 4, "5102"],
          ["26462", 6, 6, "4105"],
          ["26461", 7, 7, "4105"],
        ],
      ],
    ]),
  ];
}
