import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoutineView } from "@/components/sohoj/RoutineView";
import { NO_ROUTINE_MESSAGE } from "@/lib/routine-view";

describe("routine dropdown selection", () => {
  it("semester 4 renders routine D", () => {
    render(<RoutineView initialSemester={4} profileSemester={1} />);
    expect(screen.getByText("4th Semester (1st Shift)")).toBeTruthy();
    expect(screen.getAllByText("Java Programming").length).toBeGreaterThan(0);
    expect(screen.getByText(/Back to my routine/)).toBeTruthy();
  });

  it("semester 6 renders routine C", () => {
    render(<RoutineView initialSemester={6} profileSemester={1} />);
    expect(screen.getByText("6th Semester (1st Shift)")).toBeTruthy();
    expect(screen.getAllByText("Sensor & IoT System").length).toBeGreaterThan(0);
  });

  it("semester 2 shows the friendly message", () => {
    render(<RoutineView initialSemester={2} profileSemester={1} />);
    expect(screen.getByText(NO_ROUTINE_MESSAGE)).toBeTruthy();
  });

  it("shows no back button when viewing the student's own semester", () => {
    render(<RoutineView initialSemester={1} profileSemester={1} />);
    expect(screen.queryByText(/Back to my routine/)).toBeNull();
    expect(screen.getByText("1st Semester (1st Shift)")).toBeTruthy();
  });
});
