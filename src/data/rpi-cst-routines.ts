// SINGLE SOURCE OF TRUTH — Rajshahi Government Polytechnic Institute, CST.
// Copied verbatim from the supplied routine notice. Do not rename or "improve" values.

export type Period = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Day = "Sun" | "Mon" | "Tue" | "Wed" | "Thu";

export type Subject = {
  code: string;
  name: string;
  teacher: string;
  acronym: string;
  T: number | null;
  P: number | null;
  C: number;
  theoryContinuous: number | null;
  theoryFinal: number | null;
  practicalContinuous: number | null;
  practicalFinal: number | null;
  total: number;
};

/** endPeriod is inclusive; a merged block is ONE class. Free periods are not blocks. */
export type Block = {
  day: Day;
  startPeriod: Period;
  endPeriod: Period;
  subjectCode: string;
  room: string;
};

export type Routine = {
  institute: "rpi";
  department: "CST";
  semester: 1 | 3;
  shift: 1;
  title: string;
  classStart: string; /* ISO */
  classLoad: number;
  subjects: Subject[];
  blocks: Block[];
};

export const PERIOD_TIMES: Record<Period, string> = {
  1: "08:00-08:45",
  2: "08:45-09:30",
  3: "09:30-10:15",
  4: "10:15-11:00",
  5: "11:00-11:45",
  6: "11:45-12:30",
  7: "12:30-13:15",
};

export const PERIODS: Period[] = [1, 2, 3, 4, 5, 6, 7];
export const DAYS: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu"];

const TITLE =
  "Rajshahi Government Polytechnic Institute, Department of Computer Science & Technology, Student's Class Routine-2026";

export const ROUTINE_1: Routine = {
  institute: "rpi",
  department: "CST",
  semester: 1,
  shift: 1,
  title: TITLE,
  classStart: "2026-10-11",
  classLoad: 33,
  subjects: [
    {
      code: "21011",
      name: "Engineering Drawing",
      teacher: "MD. ABDULLAH-AL MAMUN",
      acronym: "AAM",
      T: null,
      P: 6,
      C: 2,
      theoryContinuous: null,
      theoryFinal: null,
      practicalContinuous: 50,
      practicalFinal: 50,
      total: 100,
    },
    {
      code: "25711",
      name: "Bangla-I",
      teacher: "MST. RABEYA SIDDIQUA",
      acronym: "RS",
      T: 2,
      P: null,
      C: 2,
      theoryContinuous: 40,
      theoryFinal: 60,
      practicalContinuous: null,
      practicalFinal: null,
      total: 100,
    },
    {
      code: "25712",
      name: "English-I",
      teacher: "MD. SHIMUL HOSSAIN",
      acronym: "SH",
      T: 2,
      P: null,
      C: 2,
      theoryContinuous: 40,
      theoryFinal: 60,
      practicalContinuous: null,
      practicalFinal: null,
      total: 100,
    },
    {
      code: "25911",
      name: "Mathematics-I",
      teacher: "MD. ABDUR RAZZAK",
      acronym: "AR",
      T: 3,
      P: 3,
      C: 4,
      theoryContinuous: 60,
      theoryFinal: 90,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 200,
    },
    {
      code: "25912",
      name: "Physics-I",
      teacher: "SYED MAHMUDUN NABI KHONDKER",
      acronym: "MNK",
      T: 3,
      P: 3,
      C: 4,
      theoryContinuous: 60,
      theoryFinal: 90,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 200,
    },
    {
      code: "28511",
      name: "Computer Office Application",
      teacher: "MD. FARUQ HOSSAIN",
      acronym: "MFH",
      T: null,
      P: 6,
      C: 2,
      theoryContinuous: null,
      theoryFinal: null,
      practicalContinuous: 50,
      practicalFinal: 50,
      total: 100,
    },
    {
      code: "26711",
      name: "Basic Electricity",
      teacher: "MD. MOHOSIN",
      acronym: "MM",
      T: 3,
      P: 3,
      C: 4,
      theoryContinuous: 60,
      theoryFinal: 90,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 200,
    },
  ],
  blocks: [
    { day: "Sun", startPeriod: 1, endPeriod: 2, subjectCode: "25912", room: "2106" },
    { day: "Sun", startPeriod: 3, endPeriod: 4, subjectCode: "25911", room: "2302" },
    { day: "Sun", startPeriod: 5, endPeriod: 7, subjectCode: "26711", room: "5208" },
    { day: "Mon", startPeriod: 1, endPeriod: 2, subjectCode: "25911", room: "2302" },
    { day: "Mon", startPeriod: 3, endPeriod: 3, subjectCode: "25711", room: "2302" },
    { day: "Mon", startPeriod: 4, endPeriod: 6, subjectCode: "28511", room: "2301" },
    { day: "Mon", startPeriod: 7, endPeriod: 7, subjectCode: "26711", room: "3109" },
    { day: "Tue", startPeriod: 2, endPeriod: 2, subjectCode: "25912", room: "2306" },
    { day: "Tue", startPeriod: 3, endPeriod: 3, subjectCode: "26711", room: "2306" },
    { day: "Tue", startPeriod: 4, endPeriod: 4, subjectCode: "25712", room: "2306" },
    { day: "Tue", startPeriod: 5, endPeriod: 7, subjectCode: "21011", room: "2302" },
    { day: "Wed", startPeriod: 1, endPeriod: 3, subjectCode: "28511", room: "1308" },
    { day: "Wed", startPeriod: 4, endPeriod: 4, subjectCode: "25711", room: "2303" },
    { day: "Wed", startPeriod: 5, endPeriod: 5, subjectCode: "25912", room: "2303" },
    { day: "Wed", startPeriod: 6, endPeriod: 6, subjectCode: "26711", room: "2303" },
    { day: "Thu", startPeriod: 1, endPeriod: 1, subjectCode: "25712", room: "2303" },
    { day: "Thu", startPeriod: 2, endPeriod: 3, subjectCode: "25911", room: "2303" },
    { day: "Thu", startPeriod: 4, endPeriod: 4, subjectCode: "25912", room: "2305" },
    { day: "Thu", startPeriod: 5, endPeriod: 7, subjectCode: "21011", room: "2305" },
  ],
};

export const ROUTINE_3: Routine = {
  institute: "rpi",
  department: "CST",
  semester: 3,
  shift: 1,
  title: TITLE,
  classStart: "2026-09-27",
  classLoad: 34,
  subjects: [
    {
      code: "25811",
      name: "Social Science",
      teacher: "SAMROZ NAHAR",
      acronym: "SN",
      T: 2,
      P: null,
      C: 2,
      theoryContinuous: 40,
      theoryFinal: 60,
      practicalContinuous: null,
      practicalFinal: null,
      total: 100,
    },
    {
      code: "25922",
      name: "Physics-II",
      teacher: "MST. NAZMUN NAHER",
      acronym: "NN",
      T: 3,
      P: 3,
      C: 4,
      theoryContinuous: 60,
      theoryFinal: 90,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 200,
    },
    {
      code: "25931",
      name: "Mathematics-III",
      teacher: "ANJUMAN ARA",
      acronym: "AA",
      T: 3,
      P: 3,
      C: 4,
      theoryContinuous: 60,
      theoryFinal: 90,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 200,
    },
    {
      code: "28531",
      name: "Application Development Using Python",
      teacher: "MD. SORIAT ULLAH",
      acronym: "MSU",
      T: 2,
      P: 3,
      C: 3,
      theoryContinuous: 40,
      theoryFinal: 60,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 150,
    },
    {
      code: "28532",
      name: "Computer Graphics Design-II",
      teacher: "MD. AZIZUL AMAN AL AMIN",
      acronym: "A4",
      T: null,
      P: 3,
      C: 1,
      theoryContinuous: null,
      theoryFinal: null,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 50,
    },
    {
      code: "28533",
      name: "IT Support Services",
      teacher: "MD. ABDULLAH-AL MAMUN",
      acronym: "AAM",
      T: 2,
      P: 6,
      C: 4,
      theoryContinuous: 40,
      theoryFinal: 60,
      practicalContinuous: 50,
      practicalFinal: 50,
      total: 200,
    },
    {
      code: "26831",
      name: "Digital Electronics-I",
      teacher: "MD. NURUN NOBE",
      acronym: "MNN",
      T: 2,
      P: 3,
      C: 3,
      theoryContinuous: 40,
      theoryFinal: 60,
      practicalContinuous: 25,
      practicalFinal: 25,
      total: 150,
    },
  ],
  blocks: [
    { day: "Sun", startPeriod: 2, endPeriod: 2, subjectCode: "28531", room: "2302" },
    { day: "Sun", startPeriod: 3, endPeriod: 4, subjectCode: "25922", room: "2106" },
    { day: "Sun", startPeriod: 5, endPeriod: 5, subjectCode: "28533", room: "2306" },
    { day: "Sun", startPeriod: 6, endPeriod: 7, subjectCode: "25931", room: "2306" },
    { day: "Mon", startPeriod: 1, endPeriod: 3, subjectCode: "28533", room: "1305" },
    { day: "Mon", startPeriod: 4, endPeriod: 4, subjectCode: "25811", room: "1305" },
    { day: "Mon", startPeriod: 5, endPeriod: 7, subjectCode: "28531", room: "1308" },
    { day: "Tue", startPeriod: 1, endPeriod: 2, subjectCode: "25931", room: "2302" },
    { day: "Tue", startPeriod: 3, endPeriod: 3, subjectCode: "26831", room: "2302" },
    { day: "Tue", startPeriod: 4, endPeriod: 4, subjectCode: "25922", room: "2302" },
    { day: "Tue", startPeriod: 5, endPeriod: 7, subjectCode: "28532", room: "1305" },
    { day: "Wed", startPeriod: 1, endPeriod: 3, subjectCode: "26831", room: "5201" },
    { day: "Wed", startPeriod: 4, endPeriod: 4, subjectCode: "25922", room: "1305" },
    { day: "Wed", startPeriod: 5, endPeriod: 7, subjectCode: "28533", room: "1305" },
    { day: "Thu", startPeriod: 1, endPeriod: 2, subjectCode: "25931", room: "2306" },
    { day: "Thu", startPeriod: 3, endPeriod: 3, subjectCode: "25922", room: "2306" },
    { day: "Thu", startPeriod: 4, endPeriod: 4, subjectCode: "28533", room: "2306" },
    { day: "Thu", startPeriod: 5, endPeriod: 5, subjectCode: "28531", room: "2306" },
    { day: "Thu", startPeriod: 6, endPeriod: 6, subjectCode: "25922", room: "2306" },
    { day: "Thu", startPeriod: 7, endPeriod: 7, subjectCode: "26831", room: "2306" },
  ],
};

/** Exactly two routines. Nothing else is seeded anywhere in this app. */
export const ROUTINES: Routine[] = [ROUTINE_1, ROUTINE_3];
