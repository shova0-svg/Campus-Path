<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

<!-- AGENT-MEMORY:BEGIN -->

- Campus data, search and route generation live in `src/lib/campus-data.ts` as pure functions; UI pieces in `src/components/sohoj/`. Why: keeps the demo data testable (`src/test/campus-data.test.ts`).
- Accounts use Lovable Cloud auth (email/password, Google, Lovable) via the single `AuthProvider` in `src/hooks/use-auth.tsx`; display names live in `public.profiles` (filled by a signup trigger). Admin mode = signed-in email checked against the admin list in `src/lib/admin.ts`. Rooms, routines and admin lists still live in localStorage. Why: real sign-in first; moving campus data to Cloud is a separate step.

<!-- AGENT-MEMORY:END -->

<!-- PHASE1:BEGIN -->

## Supabase data sync (Phase 1)

- Schema: `supabase/migrations/20261122000001_campus_data.sql` (apply in Lovable Cloud / Supabase).
- One-time idempotent seed: `npx tsx scripts/seed-supabase.ts` (needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in the environment; publishable key works only where RLS allows writes).
- Repos: `src/lib/repo/*` (Supabase CRUD). Cache: `src/lib/cache.ts` (stale-while-revalidate, offline-safe). Resources: `src/lib/resources.ts`.
- Assumptions: code seeds use stable `text` ids so upserts are idempotent; public read tables allow anon SELECT (app is login-gated anyway, and offline cache still works).
- Image OCR Edge Function: `supabase/functions/parse-routine` — deploy in Lovable Cloud, set secrets `LOVABLE_API_KEY` (never in client), optionally `AI_MODEL`; max 4MB upload, JWT + `institute_admins` check, 10 req/min per admin. Without the key it returns a friendly error.

<!-- PHASE1:END -->

<!-- PHASE3:BEGIN -->

## Web push class reminders (Phase 3)

- Schema: `supabase/migrations/20261122000003_push_notifications.sql` — `push_subscriptions` (RLS: own rows only), `notification_log` (unique `(user_id, kind, class_key)` dedupe), and a pg_cron job calling `send-class-reminders` every 5 minutes.
- VAPID keys generate: `npx web-push generate-vapid-keys` (or `openssl ecparam -name prime256v1 -genkey ...` + base64url). Put **public** key in client env `VITE_VAPID_PUBLIC_KEY`; put **private** key in Edge Function secret `VAPID_PRIVATE_KEY` (also set `VAPID_PUBLIC_KEY`, optional `VAPID_SUBJECT`). Never commit the private key.
- Edge Function: `supabase/functions/send-class-reminders` — deploy in Lovable Cloud. Secrets needed: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_SUBJECT`. Pure logic in `reminders.ts` (tested in `src/test/reminders.test.ts`). `src/lib/reminders.ts` re-exports it for the client; local `notify.ts` scheduling stays as fallback when push is unsupported.
- Cron note: pg_cron + pg_net must be enabled in Lovable Cloud. The migration reads `app.settings.functions_url` and `app.settings.service_role_key` — set these via Lovable (or harden the cron command there) since secrets must not live in SQL. If extensions are unavailable, schedule the function externally (e.g. cron-hit the URL with the service-role header).
- iOS: Web Push needs the PWA added to Home Screen; the Student page shows a hint. Without `VITE_VAPID_PUBLIC_KEY`, reminders use the local-only fallback (works only while the tab is open).
- Manual test: (1) apply migration + deploy function + set secrets, (2) sign in as a test student, set routine (CST, sem 3, group A, Morning), (3) Student page → "Enable class reminders" → allow notifications, (4) close the app / kill the tab, (5) at a scheduled time (e.g. ~5 min before class ends, or ~8 min before the next class in another building) a push arrives; (6) tapping it opens `/student`. Dedupe: a second cron run same day must not repeat the same reminder.

<!-- PHASE3:END -->

<!-- PHASE4:BEGIN -->

## Pilot readiness (Phase 4)

- Schema: `supabase/migrations/20261122000004_pilot.sql` — `feedback` (own insert, institute-admin read) + `usage_events` (own insert, institute-admin read). Only 5 events allowed: app_open, qr_scan, search, journey_view, reminder_enabled.
- Pure helpers: `src/lib/feedback.ts` (validation, `openFeedback()` event), `src/lib/stats.ts` (`aggregateUsage` with Asia/Dhaka day keys), `src/lib/analytics.ts` (`logEvent()` fire-and-forget, never throws). Tests in `src/test/pilot.test.ts`.
- One global `FeedbackHost` lives in `__root.tsx`; cards/pages/error boundary call `openFeedback({ category, message, page })` to prefill it. "Report wrong info" flags live on room cards (home), teacher cards, routine cards and the student journey.
- Admin Panel has **Feedback** (filter by category) and **Stats** (7/30-day active users, QR scans, top searched rooms, reminder opt-ins) tabs, loaded from Supabase on tab open; empty/error degrades to empty lists.
- First-visit 3-step intro (`Onboarding`, localStorage `sohoj-rasta-onboarded-v1`) + `InstallHint` (Android `beforeinstallprompt`, manual iOS hint). Global error boundary + enhanced TanStack root error component with **Report this**.
- Full architecture, env vars, migration/seed/Edge Function steps and the pilot checklist are in `README.md`.

<!-- PHASE4:END -->

## Branding (Campus Path)

- App name: **Campus Path** / **ক্যাম্পাস পাথ**; tagline "Find your way on campus" / "ক্যাম্পাসে নিজের পথ খুঁজে নিন". Colors: navy `#0B1F3A`, `#14365F`, `#081628`, gold `#C9962F` (light `#F6D98A`), ice blue `#9FD8E6`, white.
- Logos: `public/brand/campus-path-icon.svg` + `public/brand/campus-path-logo-light.svg` are user-supplied — never redraw or edit. In-app wordmark is live text in `src/components/brand/Logo.tsx`; the light horizontal SVG is only for README / og:image / print.
- Regenerate icons with `npm run icons` (`scripts/generate-icons.mjs`, `sharp` devDependency) → `public/icons/*`, `public/og-image.png`, `public/favicon.svg`.
- IMPORTANT: do not rename `sohoj-*` localStorage keys, `SOHOJ1|` QR prefix, `sohoj:*` events, Supabase identifiers or `src/components/sohoj/*` paths — those are data/QR compat identifiers, not brand text.

<!-- AGENT-SKILLS:BEGIN -->

## Skills to use going forward

These skills are installed in this codebase (`.claude/skills/`) and enabled as
project-scoped plugins in `~/.claude/plugins/installed_plugins.json`. Use them:

- **graphify** — treat any question about this codebase, its architecture, file
  relationships, or project content as a graphify query first. Turn code/docs
  into a persistent knowledge graph, then query/path/explain. Prefer it over
  ad-hoc grepping when the question is broad or cross-file.
- **ponytail** — default mode for coding tasks (write/fix/refactor/review/pick
  dependencies): smallest change that fully solves the task, YAGNI, stdlib
  first, no unrequested abstractions, and a reply a busy human reads once.
  Levels: lite / full / ultra. Also use `ponytail-review` for code review and
  `ponytail-audit` for whole-repo quality/bloat audits.
- **context-optimizer** (skills: `cco`, `token-check`, `doc-digest`,
  `fresh-start`, `sharpen-prompt`, `project-context`) — use when the user asks
  about session cost, context size, token usage, long documents, handoffs to a
  new chat, prompt sharpening, or reusable project context. Prefer digesting
  long inputs instead of pasting them whole into context.

<!-- AGENT-SKILLS:END -->
