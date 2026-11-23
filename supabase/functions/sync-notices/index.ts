import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const SECRET = Deno.env.get("CRON_SECRET");
const DB_KEY = Deno.env.get("CRON_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const URL_BASE = Deno.env.get("SUPABASE_URL")!;

function isSafeNoticeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (u.username || u.password) return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0") return false;
    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const auth = req.headers.get("authorization") ?? "";
    if (!SECRET || auth !== `Bearer ${SECRET}`)
      return new Response("Unauthorized", { status: 401 });
    if (!DB_KEY)
      return new Response(JSON.stringify({ error: "DB key not configured" }), { status: 503 });

    const probe = new URL(req.url).searchParams.get("probe");
    if (probe) {
      try {
        const response = await fetch(probe, { signal: AbortSignal.timeout(25_000) });
        return new Response(
          JSON.stringify({ status: response.status, body: (await response.text()).slice(0, 200) }),
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
      }
    }
    const db = createClient(URL_BASE, DB_KEY, { auth: { persistSession: false } });
    const { data: sources } = await db.from("notice_sources").select("*").eq("active", true);
    let discovered = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const source of sources ?? []) {
      const row = source as { institute_id: string; url: string };
      if (!isSafeNoticeUrl(row.url)) {
        failed++;
        errors.push(`unsafe URL: ${row.url}`);
        continue;
      }
      try {
        const params = new URLSearchParams({ url: row.url, instituteId: row.institute_id });
        const proxy = await fetch(`https://campus-path-chi.vercel.app/api/notices?${params}`, {
          signal: AbortSignal.timeout(25_000),
        });
        if (!proxy.ok) throw new Error(`Proxy returned ${proxy.status}`);
        const payload = (await proxy.json()) as {
          notices?: { id: string; title: string; url: string; date: string; image?: string }[];
        };
        const notices = payload.notices ?? [];
        if (notices.length > 0) {
          const inserts = notices.map((n) => ({
            id: `${row.institute_id}:${n.id}`,
            institute_id: row.institute_id,
            title: n.title,
            url: n.url,
            published_date: n.date,
            ...(n.image ? { image: n.image } : {}),
            source_url: row.url,
            source: "fetched",
            status: "pending",
          }));
          const { error } = await db
            .from("notices")
            .upsert(inserts, { onConflict: "id", ignoreDuplicates: true });
          if (error) throw error;
          discovered += notices.length;
        }
      } catch (e) {
        failed++;
        errors.push(e instanceof Error ? e.message.slice(0, 120) : "unknown");
      }
    }

    // Push newly approved notices once (dedupe in notification_log).
    const { data: approved } = await db
      .from("notices")
      .select("id, institute_id, title, url, published_date")
      .eq("status", "approved")
      .is("pushed_at", null);
    const { data: profiles } = await db.from("student_profiles").select("user_id, institute_id");
    const { data: subs } = await db.from("push_subscriptions").select("*");
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    let sent = 0;
    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@campus-path.app",
        publicKey,
        privateKey,
      );
      for (const notice of approved ?? []) {
        const n = notice as {
          id: string;
          institute_id: string;
          title: string;
          url: string;
          published_date: string;
        };
        const userIds = new Set(
          (profiles ?? [])
            .filter((p: { institute_id: string }) => p.institute_id === n.institute_id)
            .map((p: { user_id: string }) => p.user_id),
        );
        for (const sub of subs ?? []) {
          const s = sub as { user_id: string; endpoint: string; p256dh: string; auth: string };
          if (!userIds.has(s.user_id)) continue;
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              JSON.stringify({
                title: "New notice / নতুন নোটিশ",
                body: `${n.title}${n.published_date ? ` · ${n.published_date}` : ""}`,
                url: n.url || "/student",
                tag: `new-notice-${n.id}`,
              }),
            );
            sent++;
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410)
              await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }
      }
    }
    for (const notice of approved ?? []) {
      await db
        .from("notices")
        .update({ pushed_at: new Date().toISOString() })
        .eq("id", (notice as { id: string }).id);
    }

    return new Response(JSON.stringify({ discovered, failed, sent, errors }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
    });
  }
});
