# Sonnet fix batch — paste the "Prompt" section into a fresh session

## Prompt

You are fixing a pre-audited list of mechanical issues in KhunOwl (Next.js 15 App Router + TypeScript + Supabase). The audit is done — do NOT re-audit or explore beyond the files named. Read `CLAUDE.md` and the "Architecture patterns" section of `HANDOFF.md` first (skim, ~2 min), then fix the items below one at a time.

### Hard rules
- **Do not touch** these files/folders — another session is editing them right now: `supabase/**`, `lib/db.types.ts`, `lib/domain/dates.ts`, `lib/server/process-due.ts`, `lib/actions/bills.ts`, `lib/actions/subscriptions.ts`, `lib/actions/budgets.ts`, `lib/actions/trips.ts`, `components/forms/bill-form.tsx`, `components/forms/subscription-form.tsx`.
- Never run SQL, migrations, or anything against Supabase. Dev and prod share ONE database.
- **Never run `next build` / `npm run build`** — it overwrites `.next` and breaks any running dev server. Verify with `npm run typecheck && npm run lint && npm test` only.
- UI text stays Thai; code/identifiers/commits in English. Match the surrounding code style (no new libraries).
- Don't commit or push; leave changes in the working tree and report a summary (one line per item: done / skipped + why).

### Items (path:line, problem → fix)
1. `middleware.ts:10` — `/manifest.webmanifest` and `/sw.js` get 307 → `/login` when no cookies (browsers fetch the manifest without credentials), so PWA install is broken. → Exclude `manifest.webmanifest` and `sw.js` from the matcher regex.
2. `app/api/cron/process-due/route.ts:10` and `app/api/cron/notify/route.ts:12` — if `CRON_SECRET` is unset, the header `Bearer undefined` passes. → `const secret = process.env.CRON_SECRET; if (!secret || auth !== \`Bearer ${secret}\`) return 401`.
3. `components/ui/form-modal.tsx:36` — the delete button fires immediately in all 19 forms (deleting a vehicle cascades its whole service/fuel history). → In `FormModal`, make the first click turn the button into a confirm state ("ยืนยันลบ?" , auto-reverts after ~4s), and only the second click calls `onDelete`. One change covers every form.
4. `lib/actions/backup.ts:21,40` — `select("*")` without paging; PostgREST caps responses at 1000 rows, so backups silently drop data. → Loop with `.range(from, from+999)` until a page returns < 1000 rows (add `.order("id")` for stable paging on tables that have `id`; budgets has no `id`, order by `category`).
5. `app/(app)/stats/page.tsx:10` — fetches ALL transactions unbounded (also capped at 1000 → wrong stats). → Read `components/stats/stats-client.tsx` to find the oldest date range it actually uses, then filter `.gte("date", <that start>)` and page with `.range()` as in item 4 if needed.
6. `app/layout.tsx:40` + `app/(app)/layout.tsx:15,29` — `auth.getUser()` and the `profiles.prefs` query run twice per request. → Add `lib/server/session.ts` with `getCurrentUser = cache(async () => ...)` and `getProfilePrefs = cache(async () => ...)` (React `cache` from "react"), use them in both layouts.
7. `components/providers/quick-add-provider.tsx:6-15` — all 10 forms are statically imported into the shared layout bundle. → `next/dynamic` each form (`ssr: false` is fine; they only render after a click). Keep `VehiclePickItem` as a type-only import.
8. `app/(app)/docs/page.tsx:14`, `app/(app)/assets/page.tsx:16`, `app/(app)/home/page.tsx:40,63` — one `createSignedUrl` HTTP call per file on every render (N+1). → Add `signedUrls(supabase, paths[])` to `lib/supabase/storage.ts` using `storage.from(BUCKET).createSignedUrls(paths, 3600)` (skip null paths), call it once per page and map results back by path.
9. `components/trips/trips-client.tsx:77,83`, `components/trips/trip-detail-client.tsx:76,132,180,234`, `components/forms/trip-expense-form.tsx` displays, `components/stats/stats-client.tsx:114,115,127,150` — money shown without honoring "ซ่อนยอดเงิน". → Use `const { hide } = usePrefs()` and pass `hide` to `fmtC(...)` (3rd arg) / render `฿ •••`-style masking for the stats `toLocaleString()` money texts. Don't change km/mileage numbers.
10. Missing error boundaries. → Add `app/(app)/error.tsx` ("use client", Thai message "เกิดข้อผิดพลาด", a "ลองใหม่" button calling `reset()`) and `app/not-found.tsx` (Thai "ไม่พบหน้านี้" + link back to "/"). Reuse existing CSS classes (`.btn`, `.hint`, etc. in `app/globals.css`).
11. `components/ui/form-modal.tsx`, `components/providers/quick-add-provider.tsx:72`, `components/providers/toast-provider.tsx` — modals lack `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape-to-close; toasts lack `aria-live`. → Add those; Escape calls the existing close handler; toast container gets `role="status" aria-live="polite"`.
12. `components/shell/app-shell.tsx:52,74,141,171,189` — active nav uses `pathname === href`, so `/trips/[id]` doesn't highlight "ทริป". → helper `isActive(href) = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")`.
13. `lib/server/search.ts:24-34` — the raw query is interpolated into `.or()` filters; `,` `(` `)` break the filter (category silently empty) and `%` `_` act as wildcards. → Escape: strip/replace `,()` and backslash-escape `%`/`_` before building `like`; also wrap the value in double quotes inside `.or()` (`name.ilike."${like}"`) with `"` escaped.
14. Add zod validation to server actions that take raw args (not FormData): `lib/actions/cards.ts:114` `payCard` (amount finite positive, ids uuid), `lib/actions/push.ts:14,24`, `lib/actions/prefs.ts:18-32` (enums; pin: string|null max 64), `lib/actions/vehicles.ts:103` `bumpVehicleMileage` (int ≥ 0), `lib/actions/notifications.ts:7,15` (string max 200). Return `{ error }` in the same style as the rest of the file (or silently return for `void` actions).
15. `lib/actions/fuel-logs.ts` (~line 50) — the error from the fuel-cost transaction insert is ignored. → If the insert errors, return `{ error }` (after the fuel log was saved, say so in Thai: "บันทึกเติมน้ำมันแล้ว แต่สร้างรายการเงินไม่สำเร็จ: ...").
16. `components/providers/process-due-trigger.tsx:18` — promise has no `.catch`. → add `.catch(() => {})`.
17. `app/(app)/forecast/page.tsx:20-21` — two extra sequential queries after `Promise.all`. → Move them into the existing `Promise.all`.
18. `lib/supabase/storage.ts:27` — no type allow-list on uploads. → Allow only `image/*` and `application/pdf` (check `file.type`); otherwise return Thai error "รองรับเฉพาะรูปภาพหรือ PDF".

When done, run `npm run typecheck && npm run lint && npm test`, fix anything you broke, and report.
