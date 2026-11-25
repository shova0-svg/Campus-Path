import { describe, expect, it } from "vitest";
import {
  isClassWeekday,
  nextClassDayAfter,
  nowDhaka,
  resolveWhen,
} from "../../supabase/functions/_shared/dhaka-time";

const at = (iso: string) => new Date(iso);

describe("Dhaka date resolution", () => {
  const cases = [
    {
      name: "Wed 25 Nov 23:50 Dhaka",
      now: at("2026-11-25T17:50:00Z"),
      iso: "2026-11-25",
      wd: "Wednesday",
      next: "2026-11-26",
    },
    {
      name: "Thu 26 Nov 00:10 Dhaka",
      now: at("2026-11-25T18:10:00Z"),
      iso: "2026-11-26",
      wd: "Thursday",
      next: "2026-11-29",
    },
    {
      name: "Thu 26 Nov 14:00 Dhaka",
      now: at("2026-11-26T08:00:00Z"),
      iso: "2026-11-26",
      wd: "Thursday",
      next: "2026-11-29",
    },
    {
      name: "Fri 27 Nov 10:00 Dhaka",
      now: at("2026-11-27T04:00:00Z"),
      iso: "2026-11-27",
      wd: "Friday",
      next: "2026-11-29",
    },
    {
      name: "Sat 28 Nov 20:00 Dhaka",
      now: at("2026-11-28T14:00:00Z"),
      iso: "2026-11-28",
      wd: "Saturday",
      next: "2026-11-29",
    },
  ];
  for (const c of cases) {
    it(c.name, () => {
      const n = nowDhaka(c.now);
      expect(n.iso).toBe(c.iso);
      expect(resolveWhen(undefined, c.now).weekdayEn).toBe(c.wd);
      expect(resolveWhen(undefined, c.now).nextClassDay.iso).toBe(c.next);
    });
  }

  it("tomorrow on Thursday is Friday (no class), next class Sunday", () => {
    const now = at("2026-11-26T08:00:00Z");
    const t = resolveWhen({ kind: "relative", offset: 1 }, now);
    expect(t.iso).toBe("2026-11-27");
    expect(t.weekdayEn).toBe("Friday");
    expect(t.isClassDay).toBe(false);
    expect(t.nextClassDay.iso).toBe("2026-11-29");
  });

  it("day after tomorrow on Thursday is Saturday (no class)", () => {
    const t = resolveWhen({ kind: "relative", offset: 2 }, at("2026-11-26T08:00:00Z"));
    expect(t.iso).toBe("2026-11-28");
    expect(t.isClassDay).toBe(false);
  });

  it("weekday names: Sunday on Thursday = 29 Nov; Thursday = today", () => {
    const now = at("2026-11-26T08:00:00Z");
    expect(resolveWhen({ kind: "weekday", weekday: 0, which: "this" }, now).iso).toBe("2026-11-29");
    expect(resolveWhen({ kind: "weekday", weekday: 4, which: "this" }, now).relative).toBe("today");
  });

  it("month and year boundaries", () => {
    expect(nowDhaka(at("2026-11-30T17:50:00Z")).iso).toBe("2026-11-30");
    expect(resolveWhen({ kind: "relative", offset: 1 }, at("2026-11-30T17:50:00Z")).iso).toBe(
      "2026-12-01",
    );
    expect(resolveWhen({ kind: "relative", offset: 1 }, at("2026-12-31T17:50:00Z")).iso).toBe(
      "2027-01-01",
    );
  });

  it("UTC 05:59 / 06:01 boundary stays same Dhaka date", () => {
    expect(nowDhaka(at("2026-11-26T05:59:00Z")).iso).toBe("2026-11-26");
    expect(nowDhaka(at("2026-11-26T06:01:00Z")).iso).toBe("2026-11-26");
    expect(nowDhaka(at("2026-11-26T05:59:00Z")).time).toBe("11:59");
  });

  it("Bangla labels and weekday names", () => {
    const t = resolveWhen({ kind: "relative", offset: 0 }, at("2026-11-26T08:00:00Z"));
    expect(t.labelEn).toBe("Thursday, 26 Nov 2026");
    expect(t.labelBn).toBe("বৃহস্পতিবার, ২৬ নভেম্বর ২০২৬");
    expect(t.weekdayBn).toBe("বৃহস্পতিবার");
  });

  it("class week skips Friday and Saturday", () => {
    expect(isClassWeekday(4)).toBe(true);
    expect(isClassWeekday(5)).toBe(false);
    expect(isClassWeekday(6)).toBe(false);
    expect(nextClassDayAfter("2026-11-27")).toBe("2026-11-29");
    expect(nextClassDayAfter("2026-11-28")).toBe("2026-11-29");
  });
});
