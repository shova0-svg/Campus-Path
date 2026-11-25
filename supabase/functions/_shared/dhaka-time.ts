/** Pure Dhaka (UTC+6, no DST) date logic. `now` is always injectable. */

export type When =
  | { kind: "relative"; offset: number }
  | { kind: "weekday"; weekday: number; which?: "this" | "next" }
  | { kind: "date"; iso: string };

export type Resolved = {
  iso: string;
  weekday: number;
  weekdayEn: string;
  weekdayBn: string;
  labelEn: string;
  labelBn: string;
  relative: "today" | "tomorrow" | "yesterday" | "day_after_tomorrow" | "other";
  isClassDay: boolean;
  nextClassDay: { iso: string; labelEn: string; labelBn: string };
};

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Class week is Sunday–Thursday; Friday and Saturday have no classes. */
export function isClassWeekday(weekday: number): boolean {
  return weekday >= 0 && weekday <= 4;
}

export function bnNumber(n: number): string {
  return String(n)
    .split("")
    .map((d) => BN_DIGITS[Number(d)] ?? d)
    .join("");
}

export function nowDhaka(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    year,
    month,
    day,
    weekday: weekday < 0 ? 0 : weekday,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) /
      86400000,
  );
}

export function nextClassDayAfter(iso: string): string {
  let candidate = addDays(iso, 1);
  for (let i = 0; i < 7; i++) {
    const weekday = new Date(`${candidate}T00:00:00Z`).getUTCDay();
    if (isClassWeekday(weekday)) return candidate;
    candidate = addDays(candidate, 1);
  }
  return candidate;
}

function labels(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const weekday = d.getUTCDay();
  const month = d.getUTCMonth();
  return {
    weekday,
    weekdayEn: WEEKDAYS_EN[weekday]!,
    weekdayBn: WEEKDAYS_BN[weekday]!,
    labelEn: `${WEEKDAYS_EN[weekday]}, ${d.getUTCDate()} ${MONTHS_EN[month]} ${d.getUTCFullYear()}`,
    labelBn: `${WEEKDAYS_BN[weekday]} internally`,
  };
}

/** Resolve a structured phrase against the server clock, never a client/model clock. */
export function resolveWhen(when: When | undefined | null, now: Date = new Date()): Resolved {
  const today = nowDhaka(now);
  let iso = today.iso;
  if (when?.kind === "relative") {
    iso = addDays(today.iso, Math.trunc(when.offset) || 0);
  } else if (when?.kind === "weekday") {
    const target = ((Math.trunc(when.weekday) % 7) + 7) % 7;
    let delta = (target - today.weekday + 7) % 7;
    if (delta === 0)
      delta = 0; // a weekday name equal to today means today
    else if (when.which === "next") delta += 0; // next upcoming occurrence
    iso = addDays(today.iso, delta);
  } else if (when?.kind === "date" && /^\d{4}-\d{2}-\d{2}$/.test(when.iso)) {
    iso = when.iso;
  }

  const meta = labels(iso);
  const d = new Date(`${iso}T00:00:00Z`);
  const bnLabel = `${meta.weekdayBn}, ${bnNumber(d.getUTCDate())} ${MONTHS_BN[d.getUTCMonth()]} ${bnNumber(d.getUTCFullYear())}`;
  const delta = diffDays(today.iso, iso);
  const relative: Resolved["relative"] =
    delta === 0
      ? "today"
      : delta === 1
        ? "tomorrow"
        : delta === -1
          ? "yesterday"
          : delta === 2
            ? "day_after_tomorrow"
            : "other";
  const nextIso = nextClassDayAfter(iso);
  const nextMeta = labels(nextIso);
  const nextD = new Date(`${nextIso}T00:00:00Z`);
  return {
    iso,
    weekday: meta.weekday,
    weekdayEn: meta.weekdayEn,
    weekdayBn: meta.weekdayBn,
    labelEn: `${meta.labelEn}`,
    labelBn: bnLabel,
    relative,
    isClassDay: isClassWeekday(meta.weekday),
    nextClassDay: {
      iso: nextIso,
      labelEn: nextMeta.labelEn,
      labelBn: `${nextMeta.weekdayBn}, ${bnNumber(nextD.getUTCDate())} ${MONTHS_BN[nextD.getUTCMonth()]} ${bnNumber(nextD.getUTCFullYear())}`,
    },
  };
}
