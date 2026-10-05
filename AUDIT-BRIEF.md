# Audit brief — KhunOwl (MheeTang Life OS)

Paste the "Prompt" section below into a fresh session (Opus). It is written to keep token use low: it tells the auditor what to read, what to skip, and how to report.

## Prompt

You are auditing KhunOwl, a Thai personal-finance/life app (Next.js 15 App Router + TypeScript, Supabase Postgres/Auth/RLS, deployed on Vercel at https://khunowl.vercel.app). Goal: find real bugs, UX/UI problems, and performance bottlenecks, and propose concrete fixes. **Audit first, do not edit code until I approve the findings list.**

### Read first (in this order, stop when you have context)
1. `HANDOFF.md` (lessons + deliberate scope cuts — do NOT re-report items listed there as intentional), then `CLAUDE.md`.
2. `supabase/schema.sql` + `supabase/migrations/` (RLS, views `account_balances`/`card_usage`, FKs).
3. Skip: `node_modules`, `.next`, `design-reference/` (prototype only), `screenshots/`, `public/`, lockfile, generated `lib/db.types.ts`.

### Token discipline
- Use Grep/Glob to locate before Read; read files in ranges, never whole large files twice.
- Don't dump file contents in your report. Cite `path:line` only.
- Run the cheap mechanical checks first and only read code where they flag something: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (look at route sizes / First Load JS).
- Work area by area and keep a running list; do not re-derive context between areas.

### Areas to cover
1. **Security / data integrity (highest priority):** every Server Action in `lib/actions/*` — zod validation present, relies on RLS (no trusting client `user_id`), no service-role key in client code, `api/cron/*` routes verify `CRON_SECRET`, `middleware.ts` auth coverage, RLS policies exist on every table incl. new ones, storage bucket policies, open-redirect/`next` params in `auth`.
2. **Money/date correctness:** balance math (opening balance + transaction effects), credit-card usage, transfers, auto-debit processing in `process-due` (idempotency: double-run, concurrent tabs, timezone Asia/Bangkok, month-end `addMonths`), trip settlement shares rounding, no raw `new Date()` outside `lib/dates/today.ts`, numeric(14,2) handling (float errors).
3. **Performance:** `app/(app)/layout.tsx` runs 6 queries on every layout render (QuickAdd dropdown data could load lazily) ; N+1 or sequential awaits that should be `Promise.all`; missing DB indexes for filtered/ordered columns (check against actual queries); unbounded list queries (transactions, notifications) without pagination/limits; heavy Client Components that could be Server Components; large client bundles (`next build` output), image/font loading, `staleTimes` setting in `next.config.ts`, `revalidatePath` over-invalidation, `loading.tsx` coverage per route.
4. **UX/UI:** consistent states on every screen (loading, empty, error, success toast), form validation messages in Thai, destructive actions have confirm/undo, touch targets ≥44px, focus states/keyboard/a11y labels, dark and light theme contrast, "hide amounts" toggle covers *every* money display (including server-formatted text, search results, notifications, charts), Thai text overflow/wrapping on narrow screens.
5. **Responsive:** check at 375px, 768px, 1024px, 1280px, 1920px (desktop sidebar fit and mobile bottom nav were fixed recently; icon-rail 901–1240px was NOT retested). Use the Browser pane (`preview_start` name `dev`; no login needed in dev) and prefer `read_page`/JS measurements over screenshots (cheap).
6. **PWA/push/offline:** `public/sw.js` is push-only; manifest correctness; VAPID/push subscription cleanup on 404/410.
7. **Not-yet-verified features (list from HANDOFF):** slip OCR, legacy import round-trip, clear-all-data — review by code only; do not run destructive actions against the real database.

### Safety rules
- Dev/prod share ONE Supabase project. Never run destructive SQL/Server Actions (clear data, import, deletes) and clean up any test row you create. Don't print secrets from `.env.local`.
- Don't push, deploy, or edit Vercel/Supabase settings.

### Output format (keep it compact)
A single table sorted by severity, max ~40 rows: `ID | Severity (Critical/High/Med/Low) | Area | path:line | Problem (1 sentence) | Fix (1 sentence) | Effort (S/M/L)`. Then a short "Top 5 quick wins" and "Top 3 structural improvements". No prose beyond that. Mark anything unverified as "suspected" vs "confirmed (reproduced / read code)".
