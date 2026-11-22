import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn((..._a: unknown[]) => {});
const upsertMock = vi.fn((..._a: unknown[]) => {});
const deleteMock = vi.fn((..._a: unknown[]) => {});
const singleMock = vi.fn((..._a: unknown[]) => ({}));
const selectMock = vi.fn((..._a: unknown[]) => ({}));
const rpcMock = vi.fn(async (..._a: unknown[]) => ({ error: null }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      fromMock(table);
      return {
        select: (...s: unknown[]) => {
          selectMock(...s);
          return {
            eq: () => ({ maybeSingle: async () => ({ data: null }) }),
            then: (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null }),
          };
        },
        upsert: (...u: unknown[]) => {
          upsertMock(...u);
          return { select: () => ({ single: singleMock }) };
        },
        delete: () => ({
          eq: (...d: unknown[]) => {
            deleteMock(...d);
            return { then: (r: (v: unknown) => unknown) => r({ error: null }) };
          },
        }),
      };
    },
    rpc: (name: string, params: unknown) => rpcMock(name, params),
  },
}));

import { listTeachers, upsertTeacherRow } from "@/lib/repo/teachers";
import { addAdminByEmail, removeAdminRow } from "@/lib/repo/admins";
import { saveStudentProfile } from "@/lib/repo/student";

describe("Supabase repo layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps a teacher row into the app model", async () => {
    singleMock.mockResolvedValueOnce({
      data: {
        id: "t1",
        institute_id: "rpi",
        department: "সিভিল",
        name: "Teacher One",
        designation: "Instructor",
        phone: "01700000000",
        email: "t@example.com",
        photo_url: "https://example.com/p.jpg",
        room_no: "1301",
        data: { facultyKey: "civil", serial: "১" },
      },
      error: null,
    });

    const teacher = await upsertTeacherRow({
      serial: "১",
      name: "Teacher One",
      designation: "Instructor",
      faculty: "সিভিল",
      department: "সিভিল",
      office: "",
      email: "t@example.com",
      batch: "",
      phoneOffice: "",
      phoneHome: "",
      room: "1301",
      mobile: "01700000000",
      photo: "https://example.com/p.jpg",
      facultyKey: "civil",
    });

    expect(fromMock).toHaveBeenCalledWith("teachers");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ institute_id: "rpi", name: "Teacher One" }),
    );
    expect(teacher.instituteId).toBe("rpi");
    expect(teacher.mobile).toBe("01700000000");
    expect(teacher.facultyKey).toBe("civil");
  });

  it("lists teachers from the teachers table", async () => {
    await listTeachers();
    expect(fromMock).toHaveBeenCalledWith("teachers");
    expect(selectMock).toHaveBeenCalledWith("*");
  });

  it("adds and removes admins through the RPC / table", async () => {
    await addAdminByEmail("admin@example.com", "rpi");
    expect(rpcMock).toHaveBeenCalledWith("add_institute_admin_by_email", {
      p_email: "admin@example.com",
      p_institute_id: "rpi",
    });
    await removeAdminRow("user-1");
    expect(fromMock).toHaveBeenCalledWith("institute_admins");
    expect(deleteMock).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("saves a student profile keyed by auth user id", async () => {
    await saveStudentProfile(
      "user-1",
      {
        email: "s@example.com",
        name: "",
        instituteId: "rpi",
        department: "Civil Technology",
        semester: 3,
        group: "A",
        shift: "Morning",
      },
      true,
    );
    expect(fromMock).toHaveBeenCalledWith("student_profiles");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", reminder_enabled: true }),
    );
  });
});
