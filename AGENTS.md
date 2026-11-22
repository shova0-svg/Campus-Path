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
