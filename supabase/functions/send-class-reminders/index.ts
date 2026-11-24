import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";
import {
  dueReminders,
  findRoutine,
  normalizeNoticeName,
  type DueReminder,
  type ReminderProfile,
  type ReminderRoutine,
} from "./reminders.ts";

interface ReminderJob {
  userId: string;
  instituteId: string;
  reminders: DueReminder[];
}

const shiftNumber = (value: string | number): number => {
  const s = String(value ?? "").toLowerCase();
  return s === "2" || s === "2nd" || s === "second" || s === "evening" ? 2 : 1;
};

Deno.serve(async (req) => {
  try {
    // Cron calls authenticate with a dedicated shared secret (never exposed to clients).
    const secret = Deno.env.get("CRON_SECRET");
    const auth = req.headers.get("authorization") ?? "";
    if (!secret || auth !== `Bearer ${secret}`)
      return new Response("Unauthorized", { status: 401 });

    const url = Deno.env.get("SUPABASE_URL")!;
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@campus-path.app";
    if (!publicKey || !privateKey)
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 503 });
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const requestUrl = new URL(req.url);
    const override = requestUrl.searchParams.get("now");
    const now = override && !Number.isNaN(Date.parse(override)) ? new Date(override) : new Date();
    const dryRun = requestUrl.searchParams.get("dryRun") === "1";

    const dbKey = Deno.env.get("CRON_DB_KEY") ?? secret;
    const db = createClient(url, dbKey, { auth: { persistSession: false } });
    const { data: studentRows } = await db
      .from("student_profiles")
      .select("*")
      .eq("reminder_enabled", true);
    const teacherResult = await db
      .from("teacher_profiles")
      .select("*")
      .eq("reminder_enabled", true);
    const teacherRows = teacherResult.error ? [] : teacherResult.data;
    const { data: routinesRaw } = await db
      .from("routines")
      .select("institute_id, semester, shift, department, data");
    const { data: subs } = await db.from("push_subscriptions").select("*");
    const { data: buildingsRaw } = await db.from("buildings").select("id, distance");

    const buildings = (buildingsRaw ?? []) as { id: string; distance: Record<string, number> }[];
    const walkMinutes = (room: string): number => {
      const code = room.trim();
      let id = "academic";
      if (code.startsWith("4")) id = "civil";
      else if (code.startsWith("5")) id = "electrical";
      else if (code.startsWith("13")) id = "computer";
      else if (/^(21|22|23)/.test(code)) id = "non-departmental";
      const meters = buildings.find((b) => b.id === `rpi-${id}`)?.distance?.["main-gate"] ?? 80;
      return Math.max(2, Math.round(meters / 12));
    };

    const routines = (routinesRaw ?? []).map((r: Record<string, unknown>) => ({
      instituteId: r.institute_id,
      ...((r.data ?? {}) as Record<string, unknown>),
    })) as (ReminderRoutine & { instituteId: string })[];

    const jobs: ReminderJob[] = [];

    // Students: their own semester + shift routine.
    for (const p of studentRows ?? []) {
      const row = p as Record<string, unknown>;
      const profile: ReminderProfile = {
        semester: Number(row.semester),
        group: String(row.group ?? ""),
        shift: String(row.shift ?? "1"),
        department: String(row.department ?? ""),
      };
      const routine = findRoutine(
        profile,
        routines.filter((r) => r.instituteId === row.institute_id) as ReminderRoutine[],
      );
      if (!routine) continue;
      const reminders = dueReminders(profile, routine, now, walkMinutes);
      if (reminders.length > 0)
        jobs.push({
          userId: String(row.user_id),
          instituteId: String(row.institute_id),
          reminders,
        });
    }

    // Teachers: every class they teach, across all routines, grouped per shift.
    for (const t of teacherRows ?? []) {
      const row = t as { user_id: string; institute_id: string; teacher_name: string };
      const name = normalizeNoticeName(row.teacher_name);
      if (!name) continue;
      const mine = routines.filter((r) => r.instituteId === row.institute_id);
      const found: DueReminder[] = [];
      for (const shift of [1, 2]) {
        const shiftRoutines = mine.filter((r) => shiftNumber(r.shift) === shift);
        if (shiftRoutines.length === 0) continue;
        const entries = shiftRoutines.flatMap((r) =>
          r.entries.filter((entry) => normalizeNoticeName(entry.teacher) === name),
        );
        if (entries.length === 0) continue;
        const pseudo: ReminderRoutine = {
          semester: 0,
          shift: String(shift),
          department: "CST",
          periods: shiftRoutines[0]!.periods,
          entries,
        };
        const profile: ReminderProfile = {
          semester: 0,
          group: "",
          shift: String(shift),
          department: "CST",
        };
        found.push(...dueReminders(profile, pseudo, now, walkMinutes));
      }
      if (found.length > 0)
        jobs.push({ userId: row.user_id, instituteId: row.institute_id, reminders: found });
    }

    const subscriptions = subs ?? [];
    let sent = 0;
    const preview: { user: string; reminders: unknown[] }[] = [];
    const dayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    for (const job of jobs) {
      if (dryRun) {
        preview.push({ user: job.userId, reminders: job.reminders });
        continue;
      }
      const mine = subscriptions.filter((s: Record<string, unknown>) => s.user_id === job.userId);
      if (mine.length === 0) continue;

      for (const reminder of job.reminders) {
        const classKey = `${dayKey}:${reminder.classKey}`;
        const { error: logError } = await db.from("notification_log").insert({
          user_id: job.userId,
          kind: reminder.kind,
          class_key: classKey,
        });
        if (logError) continue; // duplicate — never send twice

        const urgent = reminder.kind.includes("soon");
        const tag = `${dayKey}:${reminder.kind}:${reminder.classKey}`;
        for (const sub of mine) {
          const s = sub as Record<string, unknown>;
          try {
            await webpush.sendNotification(
              {
                endpoint: String(s.endpoint),
                keys: { p256dh: String(s.p256dh), auth: String(s.auth) },
              },
              JSON.stringify({
                title: reminder.title,
                body: reminder.body,
                url: reminder.url,
                id: `${dayKey}:${reminder.classKey}:${reminder.kind}`,
                type: reminder.kind,
                urgent,
                tag, // unique per distinct class/day/kind — never reused
                renotify: false,
              }),
              {
                TTL: 86400, // 24h, never 0
                headers: { Urgency: urgent ? "high" : "normal" },
                // No `topic`: every reminder here is a distinct post.
              },
            );
            sent++;
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
            } else {
              console.error("class reminder push failed", status, e);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        sent,
        now: now.toISOString(),
        ...(dryRun
          ? {
              preview,
              studentCount: studentRows?.length ?? 0,
              teacherCount: teacherRows?.length ?? 0,
              subs: subscriptions.length,
            }
          : {}),
      }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.split("\n").slice(0, 4) : undefined,
      }),
      {
        status: 500,
      },
    );
  }
});
