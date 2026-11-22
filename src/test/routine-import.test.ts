import { describe, expect, it } from "vitest";
import {
  buildImportedRoutine,
  missingRoomsFromRoutine,
  parseCsv,
  suggestTeacher,
  validateImportedRoutine,
} from "@/lib/routine-import";
import { extractJson, validateOcrPayload } from "../../supabase/functions/parse-routine/validate";
import type { Teacher } from "@/lib/teachers";

const teacher: Teacher = {
  serial: "১",
  name: "MD. SORIAT ULLAH",
  designation: "Instructor",
  faculty: "কম্পিউটার সাইন্স এন্ড টেকনোলজি",
  department: "Computer Science & Technology",
  office: "",
  email: "",
  batch: "",
  phoneOffice: "",
  phoneHome: "",
  room: "1305",
  mobile: "",
  photo: "",
  facultyKey: "computer",
};

const META = {
  department: "Computer Science & Technology",
  semester: 3,
  group: "A",
  shift: "Morning",
  title: "Test",
};

describe("CSV routine import", () => {
  it("parses quoted fields and produces rows", () => {
    const rows = parseCsv(
      "day,period,start_time,end_time,subject_code,subject_name,teacher,teacher_acronym,room\n" +
        'Sunday,1,8:00,8:45,28533,"IT, Support Services",MD. SORIAT ULLAH,MSU,1305\n',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.subject_name).toBe("IT, Support Services");
    expect(rows[0]?.room).toBe("1305");
  });

  it("builds a routine with periods and merges contiguous classes", () => {
    const rows = parseCsv(
      "day,period,start_time,end_time,subject_code,subject_name,teacher,teacher_acronym,room\n" +
        "Sunday,1,8:00,8:45,28533,IT Support Services,MD. SORIAT ULLAH,MSU,1305\n" +
        "Sunday,2,8:45,9:30,28533,IT Support Services,MD. SORIAT ULLAH,MSU,1305\n" +
        "Monday,1,8:00,8:45,25922,Physics-II,KABIR AHMED,KA,2106\n",
    );
    const routine = buildImportedRoutine("rpi", META, rows);
    expect(routine.periods).toHaveLength(2);
    expect(routine.entries).toHaveLength(2);
    expect(routine.entries[0]).toMatchObject({
      day: "Sunday",
      period: 1,
      endPeriod: 2,
      room: "1305",
    });
    expect(routine.version).toBe(1);
  });
});

describe("import validation warnings", () => {
  it("warns about unknown rooms, teacher typos and empty cells", () => {
    const routine = buildImportedRoutine(
      "rpi",
      META,
      parseCsv(
        "day,period,start_time,end_time,subject_code,subject_name,teacher,teacher_acronym,room\n" +
          "Sunday,1,8:00,8:45,28533,IT Support Services,SORIAT U,MSU,9999\n" +
          "Sunday,2,8:45,9:30,,,,\n",
      ),
    );
    const warnings = validateImportedRoutine(routine, [teacher], ["1305"]);
    expect(warnings.some((w) => w.message.includes("Unknown room 9999"))).toBe(true);
    expect(warnings.some((w) => w.message.includes("closest: MD. SORIAT ULLAH"))).toBe(true);
    expect(warnings.some((w) => w.message === "Empty class cell")).toBe(true);
  });

  it("detects overlapping periods and invalid times", () => {
    const routine = buildImportedRoutine(
      "rpi",
      META,
      parseCsv(
        "day,period,start_time,end_time,subject_code,subject_name,teacher,teacher_acronym,room\n" +
          "Sunday,1,8:00,8:45,28533,IT Support Services,MD. SORIAT ULLAH,MSU,1305\n" +
          "Sunday,1,8:00,8:45,25922,Physics-II,KABIR AHMED,KA,2106\n" +
          "Monday,1,bad,time,25931,Math,RAZZAK,AR,2201\n",
      ),
    );
    const warnings = validateImportedRoutine(routine, [teacher], ["1305", "2106"]);
    expect(warnings.some((w) => w.message.includes("Overlapping periods"))).toBe(true);
    expect(warnings.some((w) => w.message === "Invalid time range")).toBe(true);
  });

  it("suggests the closest teacher and finds rooms to auto-create", () => {
    expect(suggestTeacher("MD SORIAT ULLAH", [teacher])?.name).toBe("MD. SORIAT ULLAH");
    const routine = buildImportedRoutine(
      "rpi",
      META,
      parseCsv(
        "day,period,start_time,end_time,subject_code,subject_name,teacher,teacher_acronym,room\n" +
          "Sunday,1,8:00,8:45,28533,IT Support Services,MD. SORIAT ULLAH,MSU,1305\n" +
          "Sunday,2,8:45,9:30,25922,Physics-II,KABIR AHMED,KA,2106\n",
      ),
    );
    expect(missingRoomsFromRoutine(routine, ["1305"])).toEqual(["2106"]);
  });
});

describe("Edge Function OCR JSON validation", () => {
  it("accepts a valid payload", () => {
    const result = validateOcrPayload({
      entries: [{ day: "Sun", period: 1, endPeriod: 2, code: "28533", room: "1305" }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.entries[0]?.day).toBe("Sunday");
  });

  it("rejects bad day, period and oversized payloads", () => {
    expect(validateOcrPayload({ entries: [{ day: "Funday", period: 1 }] }).ok).toBe(false);
    expect(validateOcrPayload({ entries: [{ day: "Sunday", period: 99 }] }).ok).toBe(false);
    expect(
      validateOcrPayload({
        entries: Array.from({ length: 201 }, () => ({ day: "Sunday", period: 1 })),
      }).ok,
    ).toBe(false);
  });

  it("extracts strict JSON from a fenced model response", () => {
    const parsed = extractJson('```json\n{"entries":[{"day":"Sunday","period":1}]}\n```');
    expect(validateOcrPayload(parsed).ok).toBe(true);
  });
});
