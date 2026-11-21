import raw from "@/data/rpi-teachers.json";

export interface Teacher {
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

export const TEACHERS: Teacher[] = raw as Teacher[];

export const TEACHER_SOURCE = "https://rajshahi.polytech.gov.bd/views/teacher-list-faculty";

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
  return DEPARTMENT_ORDER.map((key) => {
    const teachers = list.filter((t) => t.facultyKey === key);
    return { key, label: teachers[0]?.faculty ?? key, teachers };
  }).filter((g) => g.teachers.length > 0);
}

export function searchTeachers(list: Teacher[], q: string): Teacher[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((t) =>
    [t.name, t.designation, t.faculty, t.department, t.email, t.room]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}
