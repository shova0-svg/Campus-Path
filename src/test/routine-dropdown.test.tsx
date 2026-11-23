import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoutineView } from "@/components/sohoj/RoutineView";
import { NO_ROUTINE_MESSAGE } from "@/lib/routine-view";

describe("routine dropdown selection", () => {
  it("semester 1, shift 2 renders E", () => {
    render(
      <RoutineView initialSemester={1} initialShift={2} profileSemester={1} profileShift={1} />,
    );
    expect(screen.getByText("1st Semester (2nd Shift / ২য়)")).toBeTruthy();
    expect(screen.getAllByText("Engineering Drawing").length).toBeGreaterThan(0);
  });

  it("semester 4, shift 2 renders G", () => {
    render(
      <RoutineView initialSemester={4} initialShift={2} profileSemester={1} profileShift={1} />,
    );
    expect(screen.getByText("4th Semester (2nd Shift / ২য়)")).toBeTruthy();
    expect(screen.getAllByText("Java Programming").length).toBeGreaterThan(0);
    expect(screen.getByText(/My routine/)).toBeTruthy();
  });

  it("semester 6, shift 2 renders H", () => {
    render(
      <RoutineView initialSemester={6} initialShift={2} profileSemester={1} profileShift={1} />,
    );
    expect(screen.getByText("6th Semester (2nd Shift / ২য়)")).toBeTruthy();
    expect(screen.getAllByText("Sensor & IoT System").length).toBeGreaterThan(0);
  });

  it("semester 2 in any shift shows the friendly message", () => {
    render(
      <RoutineView initialSemester={2} initialShift={2} profileSemester={1} profileShift={1} />,
    );
    expect(screen.getByText(NO_ROUTINE_MESSAGE)).toBeTruthy();
  });

  it("shows no back button when viewing the student's own semester and shift", () => {
    render(
      <RoutineView initialSemester={1} initialShift={2} profileSemester={1} profileShift={2} />,
    );
    expect(screen.queryByText(/My routine/)).toBeNull();
  });
});
