# CLAUDE.md — MheeTang Life OS

Build the app described in README.md. Stack: Next.js 15 App Router + TypeScript, Supabase (Postgres/Auth/Storage), deploy on Vercel.

Rules
- design-reference/ is a visual + behavior reference only. Recreate in Next.js; never import or ship those files.
- UI text stays Thai, copied verbatim from the prototype. Code, identifiers, commits in English.
- Schema source of truth: supabase/schema.sql (migration 0001). Change via new migrations only.
- All writes go through Server Actions with zod validation. No service-role key in client code.
- Dates are Asia/Bangkok `date` values. Money is numeric(14,2); balances come from views, never stored.
- Port business logic from design-reference/lifeos-data.jsx, lifeos-store.jsx, lifeos-trips.jsx, lifeos-slips.jsx into lib/domain with vitest tests before building UI on it.
- Read README.md, then UI-UPDATES-v2.md (latest UI; wins on conflicts). Screenshots of every screen are in screenshots/.
- Work in the order of README §10, one PR-sized step at a time; run typecheck + tests before moving on.
