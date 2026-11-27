import { describe, expect, it } from "vitest";
import { teacherForSave, upsertTeacher, deleteTeacher, type Teacher } from "@/lib/teachers";

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
