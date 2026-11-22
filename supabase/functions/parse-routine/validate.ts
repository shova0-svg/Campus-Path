/** Pure validation for the OCR model's JSON response. No Deno/Supabase imports. */

export interface OcrEntry {
  day: string;
  period: number;
  endPeriod?: number;
  code?: string;
  subject?: string;
  teacher?: string;
  acronym?: string;
  room?: string;
}

export interface OcrPayload {
  entries: OcrEntry[];
  periods?: { id: number; label: string; time: string }[];
  classStart?: string;
  classLoad?: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function validateOcrPayload(
  input: unknown,
): { ok: true; data: OcrPayload } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null)
    return { ok: false, error: "JSON object expected" };
  const raw = input as Record<string, unknown>;
  if (!Array.isArray(raw["entries"])) return { ok: false, error: "entries must be an array" };
  if (raw["entries"].length === 0) return { ok: false, error: "No classes found in image" };
  if (raw["entries"].length > 200) return { ok: false, error: "Too many classes (max 200)" };

  const entries: OcrEntry[] = [];
  for (const item of raw["entries"]) {
    if (typeof item !== "object" || item === null) return { ok: false, error: "Invalid entry" };
    const e = item as Record<string, unknown>;
    const day = typeof e["day"] === "string" ? e["day"].trim() : "";
    const normalizedDay = DAYS.find((d) =>
      d.toLowerCase().startsWith(day.toLowerCase().slice(0, 3)),
    );
    if (!normalizedDay) return { ok: false, error: `Invalid day: ${day}` };
    const period = Number(e["period"]);
    if (!Number.isInteger(period) || period < 1 || period > 12)
      return { ok: false, error: `Invalid period: ${String(e["period"])}` };
    const endPeriod = e["endPeriod"] == null ? period : Number(e["endPeriod"]);
    if (!Number.isInteger(endPeriod) || endPeriod < period)
      return { ok: false, error: `Invalid endPeriod for period ${period}` };
    entries.push({
      day: normalizedDay,
      period,
      endPeriod,
      code: typeof e["code"] === "string" ? e["code"].trim() : "",
      subject: typeof e["subject"] === "string" ? e["subject"].trim() : "",
      teacher: typeof e["teacher"] === "string" ? e["teacher"].trim() : "",
      acronym: typeof e["acronym"] === "string" ? e["acronym"].trim() : "",
      room: typeof e["room"] === "string" ? e["room"].trim() : "",
    });
  }

  let periods: OcrPayload["periods"];
  if (raw["periods"] !== undefined) {
    if (!Array.isArray(raw["periods"])) return { ok: false, error: "periods must be an array" };
    periods = [];
    for (const p of raw["periods"]) {
      const item = p as Record<string, unknown>;
      const id = Number(item["id"]);
      if (!Number.isInteger(id) || typeof item["time"] !== "string")
        return { ok: false, error: "Invalid period row" };
      periods.push({ id, label: String(item["label"] ?? id), time: item["time"] });
    }
  }

  return {
    ok: true,
    data: {
      entries,
      ...(periods ? { periods } : {}),
      ...(typeof raw["classStart"] === "string" ? { classStart: raw["classStart"] } : {}),
      ...(typeof raw["classLoad"] === "number" ? { classLoad: raw["classLoad"] } : {}),
    },
  };
}

/** Extract strict JSON from a model response that may wrap it in code fences. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text)?.trim() ?? "";
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in response");
  return JSON.parse(candidate.slice(start, end + 1));
}
