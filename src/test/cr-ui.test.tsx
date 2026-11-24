import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidCrEmail } from "@/lib/class-updates";

const myCrAssignments = vi.fn();
const mockUser = vi.fn();

vi.mock("@/lib/repo/crs", () => ({ myCrAssignments: () => myCrAssignments() }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: mockUser(), loading: false }) }));

import { useCrRole } from "@/hooks/use-cr-role";

const assignment = {
  id: "cr-1",
  email: "cr@example.com",
  instituteId: "rpi",
  department: "Computer Science & Technology",
  semester: 3,
  shift: 1,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("CR form email validation", () => {
  it("accepts trimmed lowercase-style emails and rejects junk", () => {
    expect(isValidCrEmail(" CR@Example.com ")).toBe(true);
    expect(isValidCrEmail("not-an-email")).toBe(false);
    expect(isValidCrEmail("a@b")).toBe(false);
  });
});

describe("useCrRole", () => {
  beforeEach(() => {
    myCrAssignments.mockReset();
    mockUser.mockReset();
  });

  it("isCr true for a signed-in CR", async () => {
    mockUser.mockReturnValue({ id: "u1", email: "cr@example.com" });
    myCrAssignments.mockResolvedValue([assignment]);
    const { result } = renderHook(() => useCrRole());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isCr).toBe(true);
    expect(result.current.assignments).toHaveLength(1);
  });

  it("isCr false for a signed-in non-CR", async () => {
    mockUser.mockReturnValue({ id: "u2", email: "student@example.com" });
    myCrAssignments.mockResolvedValue([]);
    const { result } = renderHook(() => useCrRole());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isCr).toBe(false);
  });

  it("never queries when signed out", async () => {
    mockUser.mockReturnValue(null);
    const { result } = renderHook(() => useCrRole());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isCr).toBe(false);
    expect(myCrAssignments).not.toHaveBeenCalled();
  });
});
