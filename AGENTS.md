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

## Campus AI (Phase 1 — read-only)

- Edge Function `campus-ai/` verifies the caller JWT, builds a **user-JWT** Supabase client (never service role), checks bans, increments `ai_usage` (atomic RPC, 20/day via `AI_DAILY_LIMIT`) and **refunds** it on provider-side failures (`ai_usage_refund`). Kill switch `AI_ENABLED=false`. Provider wrapper `campus-ai/provider.ts` calls **OpenRouter chat-completions** (`OPENROUTER_API_KEY`, `AI_MODEL` — both required, no default model; e.g. `google/gemini-2.5-flash`); provider 429 returns a bilingual busy answer and refunds the question. Key is sent as a Bearer header, never logged or stored in the repo.
- Fixed tools only: `get_my_routine`, `get_class_updates`, `find_teacher`, `find_room_or_location`, `get_notices`, `search_shop`, `get_my_notifications`. Institute/class scope comes from `student_profiles` in the function; tools with `using(true)` RLS are filtered server-side. Max 4 tool calls, 700 max_tokens, 18s timeout, last 6 messages, deep-link whitelist in `campus-ai/shared.ts`. No phone numbers / personal data; shop returns product links only.
- Required secrets (names only): `OPENROUTER_API_KEY` and `AI_MODEL` (both set in Supabase; missing either returns the existing 503 without counting usage). Optional: `AI_DAILY_LIMIT`, `AI_ENABLED`. Response: `{answer, sources[], deepLink?}`. Verified: missing key increments nothing (usage 0); increment→refund restores 1→0.
- Live checks (6/6): cross-institute scope, injection-as-data, unauth 401, banned 403, rate limit 429 on 21st question. Secrets `OPENROUTER_API_KEY` + `AI_MODEL` set in Supabase; 15 real Bangla/Banglish/English questions answered with 4.2s spacing — **0 provider 429s**. Phone/password/injection requests were refused; empty results returned the exact "couldn't find" message.

## Shop images

- `src/lib/shop-image.ts` is the single URL helper: accepts storage paths, `/shop-images/...` prefixes and legacy full URLs without double-prefixing. `imageUrl()` in repo delegates to it. `ShopImage` reserves aspect ratio, shows skeleton while loading and an icon placeholder on error; used on cards, detail carousel, My Shop and seller page.
- Upload validates blob size/MIME and uploads with the real type (webp/png/jpg) instead of always labeling webp; a failed upload aborts the product save with a bilingual error and keeps form data. Migration `20261126000014_shop_image_paths_repair.sql` normalizes legacy full-URL values (dry run: 0 rows). Storage RLS unchanged.

## Campus Shop storefront (Phase 4)

- Migrations `20261126000012_shop_wishlist.sql` + `...13_shop_wishlist_default.sql`: per-user wishlist with `user_id DEFAULT auth.uid()`, RLS owner-only. No other RLS/request rules changed in this phase.
- `/shop` redesigned: sticky search + segments (Home/Wishlist/Requests/My Shop), category icon row, New arrivals / Under ৳500 / Old Books / Recently viewed rails, main grid, filter bottom sheet, floating +Sell button. Product detail: zoomable carousel, clickable seller card → `/shop/seller/$sellerId`, similar products, share, sticky Wishlist/Contact/Request bar. `/shop/wishlist` and public seller page added. Wishlist RLS check (2 users + anon): 6/6 passed.

## Campus Shop purchase requests (Phase 3)

- Migrations `20261126000008_shop_requests.sql` (`purchase_requests`, `notifications` inbox, RLS, status guard/effects, 5-pending rate limit, one active request/product), `...09_shop_request_defaults.sql` (`buyer_id default auth.uid()`), `...10_shop_request_notify_buyer.sql` (buyer notification on submit). No payments.
- Product page has **Request to Buy**; `/shop/requests` is the buyer view (cancel pending); `/shop/my` has an **Orders / Requests** tab (accept, reject, complete + safety note); `/shop/inbox` is the notification inbox. Live RLS check (seller/buyer/other/banned): 10/10 passed.

## Campus Shop seller dashboard (Phase 2)

- Migrations `20261126000005_shop_seller_dashboard.sql` (`quantity`, `views`, stock→sold trigger, sold counter, view RPC, banned-seller update policy), `...06_shop_counter_fix.sql` (internal counter update allowed), `...07_shop_ban_check.sql` (ban check via `shop_is_banned()`).
- `/shop/my` dashboard: profile header + stats, status tabs, edit/delete/reserve/out-of-stock/relist, edit-profile dialog. Entry via **My Shop** on `/shop`. Product detail counts a view once via RPC. Live RLS check (seller/other/buyer/banned): 9/9 passed.

## Campus Shop profiles (Phase 1)

- Migration `20261126000003_shop_profiles.sql` (+ `...04_shop_contact_rule.sql`): `shop_profiles` replaces per-product contact fields (backfilled from first product). Public fields via `shop_public_profile()` RPC; phone via `shop_seller_contact()` (authenticated only). Selling requires a profile; bans still block. Google sign-in reused from `src/lib/supabase-auth.ts` — no second auth system.
- `/shop` gates signed-out users with "Continue with Google" and first-time sellers with `ShopAccessGate`; `/shop/new` also requires a profile. Live RLS check (seller/buyer/other/banned): 8/8 passed.

## Admin panel layout

- `src/components/sohoj/AdminPanel.tsx`: full-screen sheet on phones (safe-area insets), centered `sm:max-w-2xl` / `lg:max-w-3xl` dialog on larger screens. Tabs scroll horizontally on phones and become a 5-column, 2-row grid from `sm` up; lists use `min-h-0 flex-1 overflow-y-auto` for proper inner scrolling.

## Error handling

- Shared `src/components/sohoj/ErrorState.tsx` powers the React boundary, TanStack route error and 404 pages — English-only, theme tokens, Try again / Go home / Report. `src/lib/error-page.ts` is the standalone branded server HTML (English).
- Hydration fix: localStorage-backed resources are read in `useEffect` after mount (TeacherDirectory, home index, `useAdminRole`, Student page), not in initial state — this removes React #418 mismatches online and offline.

## PWA notifications (Phase 1)

- Custom in-app sound `public/sounds/notify.mp3` (user-supplied MP3, ~4.4s, copied unchanged). `src/lib/notify-sound.ts` + `PushSoundHost` play it on `PUSH_RECEIVED` from the SW; audio unlocked on first tap/key and failures are silent. Settings route `/settings` has the sound toggle (default on) and shows last push time.
- `public/sw.js` (cache v5) broadcasts every push to open clients, uses unique tags, vibrate, `requireInteraction` for urgent, and `renotify` only when requested. Edge functions `send-class-reminders` / `sync-notices` send `Urgency: high/normal`, `TTL: 86400`, typed payload with `id`/`type`/`urgent`, delete 404/410 subscriptions and log other failures. No `topic` (distinct posts). Inbox/health screen are Phase 2.

## Admin roles (Phase 1 — backend)

- Migrations `20261126000001_admin_roles.sql` + `20261126000002_sub_admin_check_order.sql`: `institute_admins` now uses `super_admin` / `sub_admin` with `assigned_by` / `assigned_at`; legacy global admins stay super admins and at least one super admin is guaranteed. New `admin_audit_log` + triggers for admin changes, product removals, bans and CR changes.
- DB-side rules: `add_sub_admin` / `remove_sub_admin` RPCs check `is_super_admin()` on every call, enforce max 2 sub admins per institute with an advisory xact lock, one institute per user, target institute membership, and a last-super-admin guard. `my_admin_role()` / `list_admin_assignments()` expose role data to the UI. CR RLS now allows institute admins in their own institute.
- Client: `MAX_SUB_ADMINS_PER_INSTITUTE = 2` (mirrors DB), repo helpers in `src/lib/repo/admins.ts`. Live verification with 5 test users: 15/15 checks passed; all test data cleaned.
- Manage Admins UI and sub-admin scoped panel are later phases.

## Campus Shop

- Migrations `20261125000001_shop.sql` (schema/RLS/bucket), `...02_shop_image_cleanup.sql` (delete images with product), `...03_shop_rls_fixes.sql` (banned check via `shop_is_banned()` SECURITY DEFINER, `reporter_id default auth.uid()`, storage delete guard), `...04_shop_seller.sql` (`shop_seller_name()` RPC). RLS enforces institute scoping, seller-only writes, 10 active listings/user, one report/user/product, banned-user block, hides sold/removed from buyers; admin moderates via `is_institute_admin`/`is_super_admin`.
- Live RLS verification (4 test users, all cleaned up): 11/11 checks passed — anon isolation, cross-user writes, immutable fields, 11th listing, ban, duplicate report, sold/removed visibility, storage isolation/type/size, image cleanup, cross-institute admin.
- Pure helpers `src/lib/shop.ts`, repo `src/lib/repo/shop.ts` (pagination, CRUD, reports, bans, canvas image compression + bucket upload), scope helper `src/lib/shop-scope.ts`. No new dependencies.
- Phase 2 screens: `/shop` (feed/search/chips/sort/condition+price filters/pull-to-refresh/pagination), `/shop/$productId` (carousel, contact, report). No home card — Shop is reached only from the bottom bar.
- Bottom bar has a **Campus Shop** tab in the middle (route-aware active state). Any signed-in user can post via `/shop/new` (image picker + canvas compression + validation); reachable from the Sell button on `/shop` and the empty state.
- Assumption: images are in a public bucket (only contact numbers must be logged-in-only; enforced by table RLS). No in-app payments.

- CR posting fix: `my_cr_assignments()` returns snake_case columns, so `src/lib/repo/crs.ts` must map them via `fromRow` before the client uses `instituteId` (otherwise the insert violates RLS with 403 `42501`). Posts use `withNetworkRetry` (network only, once), `saveThenNotify` (push failure never rolls back the save), and specific bilingual errors via `postErrorMessage`. Toasts render above the bottom tab bar with auto-dismiss + close button.
- CR offline banner is an in-flow status element (not a toast), driven by shared `useConnectivity()` (real Supabase reachability probe + online/offline/focus/visibility re-check + one retry). A failed post shows the actual error instead of blaming the network. Message field auto-grows; semester labels use `ordinal()`.

## Class Representatives (CR)

- Migration `20261124000001_cr.sql`: `class_representatives` (super admin + own-institute admin after the role migration) + `class_updates` (CR/student/admin reads by class). RLS + SECURITY DEFINER helpers `current_verified_email`, `is_cr_of`, `is_student_of`, `my_cr_assignments`.
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
