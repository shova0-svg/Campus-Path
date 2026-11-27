import { describe, expect, it } from "vitest";
import {
  groupTeachers,
  mergeWithSeedTeachers,
  teacherForSave,
  upsertTeacher,
  deleteTeacher,
  type Teacher,
} from "@/lib/teachers";
import { fromRow } from "@/lib/repo/teachers";

const teacher = (over: Partial<Teacher> = {}): Teacher => ({
  serial: "",
  office: "",
  batch: "",
  phoneOffice: "",
  phoneHome: "",
  name: "New Teacher",
  designation: "Lecturer",
  faculty: "CST",
  facultyKey: "cst",
  department: "CST",
  mobile: "01700000000",
  email: "",
  room: "",
  photo: "",
  ...over,
});

describe("admin teacher save", () => {
  it("assigns a DB id and the selected institute without mutating the input", () => {
    const input = teacher();
    const saved = teacherForSave(input, "dpi");
    expect(saved.instituteId).toBe("dpi");
    expect(saved.id).toMatch(/^dpi-cst-New Teacher-/);
    expect(input.id).toBeUndefined();
  });

  it("keeps an existing id and gives new teachers unique ids", () => {
    expect(teacherForSave(teacher({ id: "fixed" }), "rpi").id).toBe("fixed");
    expect(teacherForSave(teacher(), "rpi").id).not.toBe(teacherForSave(teacher(), "rpi").id);
  });

  it("updates only the selected institute's store", () => {
    const store = { rpi: [teacher({ id: "rpi-1", instituteId: "rpi" })] };
    const next = upsertTeacher(store, "dpi", teacherForSave(teacher(), "dpi"));
    expect(next["rpi"]).toHaveLength(1);
    expect(next["dpi"]?.[0]?.instituteId).toBe("dpi");
    expect(deleteTeacher(next, "dpi", next["dpi"]?.[0]?.id ?? "")["dpi"]).toHaveLength(0);
    expect(next["rpi"]?.[0]?.instituteId).toBe("rpi");
  });
});

describe("teacher directory resilience", () => {
  it("groups a row with no facultyKey instead of crashing", () => {
    const broken = { ...teacher({ department: "" }), facultyKey: undefined } as unknown as Teacher;
    const groups = groupTeachers([broken]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("other");
  });

  it("keeps seeded teachers when the remote table is empty", () => {
    expect(mergeWithSeedTeachers([]).length).toBeGreaterThan(100);
    const added = teacher({ name: "Admin Added", instituteId: "dpi", department: "CST" });
    const merged = mergeWithSeedTeachers([added]);
    expect(merged.some((t) => t.name === "Admin Added")).toBe(true);
    expect(merged.length).toBeGreaterThan(100);
  });

  it("fills required fields for DB rows whose data is empty", () => {
    const row = fromRow({
      id: "x",
      institute_id: "rpi",
      department: "civil",
      name: "Test",
      designation: "",
      phone: "",
      email: "",
      photo_url: "",
      room_no: "",
      data: null,
    });
    expect(row.facultyKey).toBe("civil");
    expect(row.photo).toBe("");
    expect(row.serial).toBe("");
  });
});
