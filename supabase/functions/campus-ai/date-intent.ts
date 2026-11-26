import type { When } from "../_shared/dhaka-time.ts";

/** Server-side date intent from the user's own words — the model never computes dates. */
export function inferWhenFromText(text: string): When | undefined {
  const t = text.toLowerCase();
  if (/পরশু|porshu|day after tomorrow/.test(t)) return { kind: "relative", offset: 2 };
  if (/গতকাল|gotokal|yesterday/.test(t)) return { kind: "relative", offset: -1 };
  if (/কালকে|কাল|kalke|kalker|kal|tomorrow/.test(t)) return { kind: "relative", offset: 1 };
  if (/আজ|today|ajker|ajer/.test(t)) return { kind: "relative", offset: 0 };
  const weekdays = [
    ["রবিবার", "sunday", "robibar"],
    ["সোমবার", "monday", "sombar"],
    ["মঙ্গলবার", "tuesday", "mongolbar"],
    ["বুধবার", "wednesday", "budhbar"],
    ["বৃহস্পতিবার", "thursday", "brihospotibar"],
    ["শুক্রবার", "friday", "shukrobar"],
    ["শনিবার", "saturday", "shonibar"],
  ];
  for (const [i, words] of weekdays.entries())
    if (words.some((word) => t.includes(word)))
      return { kind: "weekday", weekday: i, which: "this" };
  return undefined;
}
