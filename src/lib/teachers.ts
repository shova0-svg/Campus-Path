import raw from "@/data/rpi-teachers.json";

export interface Teacher {
  /** Stable id; admin-created teachers get one. Seeded ones derive from name + department. */
  id?: string;
  /** Institute id the teacher belongs to (admin-created entries). */
  instituteId?: string;
  serial: string;
  name: string;
  designation: string;
  faculty: string;
  department: string;
  office: string;
  email: string;
  batch: string;
  phoneOffice: string;
  phoneHome: string;
  room: string;
  mobile: string;
  photo: string;
  facultyKey: string;
}

export const TEACHERS: Teacher[] = (raw as Teacher[]).map((t) => ({
  ...t,
  instituteId: "rpi",
}));

export const TEACHER_SOURCE = "https://rajshahi.polytech.gov.bd/views/teacher-list-faculty";

/* ---------------- Admin-managed teacher store (per institute) ---------------- */

export type TeacherStore = Record<string, Teacher[]>;

export const TEACHERS_STORE_KEY = "sohoj-rasta-teachers-v1";

export function defaultTeacherStore(): TeacherStore {
  return { rpi: [...TEACHERS] };
}

export function parseTeacherStore(saved: string | null): TeacherStore {
  const store = defaultTeacherStore();
  if (!saved) return store;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return store;
    for (const [id, list] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(list)) store[id] = list as Teacher[];
    }
  } catch {
    /* ignore broken storage */
  }
  return store;
}

export function teacherId(t: Teacher): string {
  return t.id ?? `${t.instituteId ?? "rpi"}-${t.facultyKey}-${t.name}`;
}

export function upsertTeacher(
  store: TeacherStore,
  instituteId: string,
  teacher: Teacher,
): TeacherStore {
  const next: TeacherStore = { ...store };
  const list = [...(next[instituteId] ?? [])];
  const withInstitute = { ...teacher, instituteId };
  const id = teacherId(withInstitute);
  const idx = list.findIndex((t) => teacherId(t) === id);
  if (idx < 0) list.unshift({ ...withInstitute, id });
  else list[idx] = { ...withInstitute, id };
  return { ...next, [instituteId]: list };
}

export function deleteTeacher(store: TeacherStore, instituteId: string, id: string): TeacherStore {
  return {
    ...store,
    [instituteId]: (store[instituteId] ?? []).filter((t) => teacherId(t) !== id),
  };
}

export function allTeachers(store: TeacherStore): Teacher[] {
  return Object.values(store).flat();
}

export const DEPARTMENT_ORDER = [
  "civil",
  "computer",
  "mechanical",
  "electrical",
  "power",
  "electronics",
  "electro-medical",
  "mechatronics",
  "non-tech",
] as const;

export const DEPARTMENT_OPTIONS: { key: string; label: string }[] = [
  { key: "civil", label: "সিভিল" },
  { key: "computer", label: "কম্পিউটার সাইন্স এন্ড টেকনোলজি" },
  { key: "mechanical", label: "মেকানিক্যাল" },
  { key: "electrical", label: "ইলেকট্রিক্যাল" },
  { key: "power", label: "পাওয়ার" },
  { key: "electronics", label: "ইলেকট্রোনিক্স" },
  { key: "electro-medical", label: "ইলেকট্রোমেডিকেল" },
  { key: "mechatronics", label: "মেকাট্রনিক্স" },
  { key: "non-tech", label: "নন-টেক" },
];

export function departmentKey(label: string): string {
  return (
    DEPARTMENT_OPTIONS.find((o) => o.label === label)?.key ??
    label.trim().toLowerCase().replace(/\s+/g, "-")
  );
}

const BENGALI_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

/** Converts Bengali digits to ASCII for tel:/mailto: links. */
export function phoneHref(value: string): string {
  const digits = value.replace(/[০-৯]/g, (d) => BENGALI_DIGITS[d] ?? d).replace(/\D/g, "");
  return `tel:${digits}`;
}

export function groupTeachers(
  list: Teacher[],
): { key: string; label: string; teachers: Teacher[] }[] {
  const known = DEPARTMENT_ORDER.map((key) => {
    const teachers = list.filter((t) => t.facultyKey === key);
    return { key: key as string, label: teachers[0]?.faculty ?? key, teachers };
  }).filter((g) => g.teachers.length > 0);
  const knownKeys = new Set(DEPARTMENT_ORDER as readonly string[]);
  const extraKeys = [...new Set(list.map((t) => t.facultyKey).filter((k) => !knownKeys.has(k)))];
  return [
    ...known,
    ...extraKeys.map((key) => ({
      key,
      label: list.find((t) => t.facultyKey === key)?.faculty ?? key,
      teachers: list.filter((t) => t.facultyKey === key),
    })),
  ];
}

export function searchTeachers(list: Teacher[], q: string): Teacher[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((t) =>
    [t.name, t.designation, t.faculty, t.department, t.email, t.room, t.instituteId]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}
