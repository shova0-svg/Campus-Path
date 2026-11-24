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

## Teacher identity

- 1st-shift routine notices use English names; `src/data/teacher-aliases.ts` holds manually verified English→Bangla directory aliases. 2nd-shift teachers match by printed phone (`normalizePhone`).
- 6 names remain unmatched/ambiguous (`MD. MOHOSIN`, `SAMROZ NAHAR`, `ANJUMAN ARA`, `MD. SORIAT ULLAH`, `SYEDA SADIKA AKHTER JAHAN`, `MD. MOHON ALI`) — see `UNCONFIRMED_ALIASES`; never auto-match, never use acronyms as identity.

## Campus Shop

- Migrations `20261125000001_shop.sql` (schema/RLS/bucket), `...02_shop_image_cleanup.sql` (delete images with product), `...03_shop_rls_fixes.sql` (banned check via `shop_is_banned()` SECURITY DEFINER, `reporter_id default auth.uid()`, storage delete guard), `...04_shop_seller.sql` (`shop_seller_name()` RPC). RLS enforces institute scoping, seller-only writes, 10 active listings/user, one report/user/product, banned-user block, hides sold/removed from buyers; admin moderates via `is_institute_admin`/`is_super_admin`.
- Live RLS verification (4 test users, all cleaned up): 11/11 checks passed — anon isolation, cross-user writes, immutable fields, 11th listing, ban, duplicate report, sold/removed visibility, storage isolation/type/size, image cleanup, cross-institute admin.
- Pure helpers `src/lib/shop.ts`, repo `src/lib/repo/shop.ts` (pagination, CRUD, reports, bans, canvas image compression + bucket upload), scope helper `src/lib/shop-scope.ts`. No new dependencies.
- Phase 2 screens: `/shop` (feed/search/chips/sort/condition+price filters/pull-to-refresh/pagination), `/shop/$productId` (carousel, contact, report), home **Campus Shop** card. No bottom tab.
- Assumption: images are in a public bucket (only contact numbers must be logged-in-only; enforced by table RLS). No in-app payments.

## Class Representatives (CR)

- Migration `20261124000001_cr.sql`: `class_representatives` (super-admin only) + `class_updates` (CR/student/admin reads by class). RLS + SECURITY DEFINER helpers `current_verified_email`, `is_cr_of`, `is_student_of`, `my_cr_assignments`.
- Super admin assigns CRs by email in Admin Panel → CRs. Only verified emails count. Client keeps an offline cache at `class-updates-v1:*`; posting requires network.
- Student side: home "Class Updates" card, `/updates`, seen marker `class-updates-seen-v1`. CR side: `/cr`.

## Teacher accounts

- Admin Panel → Teacher Accounts creates auth users for routine teachers via `create-teacher-account` Edge Function (admin JWT + `institute_admins` check, service key only in Edge secrets). Temporary password is returned once to the admin.
- `teacher_profiles` links `user_id` → routine teacher name; `send-class-reminders` builds a per-teacher pseudo routine from all 8 routines and sends class reminders for their own classes.

## Notices

- `public.notices` (pending/approved/rejected) + `public.notice_sources`: synced by `sync-notices` Edge Function every 10 minutes (`campus-path-notice-sync` cron).
- Approved notices are pushed once (`pushed_at`) to students in that institute; `notices` RLS exposes only approved rows publicly, admins manage all.
- Admin Panel → Notices: add manually, drop a source link, approve/reject/edit/delete. Client keeps an offline copy in `sohoj-notices-v1`.

## Class push reminders

- Edge Function `send-class-reminders` runs every minute via pg_cron (`campus-path-class-reminders`) and sends Web Push to `push_subscriptions`.
- Required Edge Function secrets (names only): `CRON_SECRET` (shared auth), `CRON_DB_KEY` (valid service-role key for PostgREST), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Vault secret `campus_path_cron_key` must hold the same `CRON_SECRET` value; the cron job reads it from `vault.decrypted_secrets` so no key is stored in `cron.job`.
- Dedupe: `notification_log` unique `(user_id, kind, class_key)` prevents a repeat for the same class/day.
- Debug: call the function with `Authorization: Bearer <CRON_SECRET>` and `?dryRun=1[&now=ISO]` to preview due reminders without sending.

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
