# Handoff: MheeTang (KhunOwl) Life OS — System Design

เว็บแอปจัดการชีวิตส่วนตัวแบบครบวงจร (เงิน · ทรัพย์สิน · รถ · บ้าน · ทริป · เอกสาร · ปฏิทิน · แจ้งเตือน) ภาษาไทยเป็นหลัก ใช้งานบนมือถือเป็นหลัก

**Stack:** Next.js 15 (App Router, TypeScript) · Vercel (host + Cron) · Supabase (Postgres, Auth, Storage, RLS)

## 0. อ่านก่อน

> **UI ล่าสุดอยู่ใน `UI-UPDATES-v2.md` — อ่านก่อนเริ่ม** (รายการบัญชีแบบแถว, ตัวกรอง, สีตามหมวด, แถบหัวสีไล่เฉด, contrast ใหม่). ภาพหน้าจอทุกหน้าอยู่ใน `screenshots/` ตามตารางหัวข้อ 2

- ไฟล์ใน `design-reference/` คือ **prototype HTML/React-in-browser (hi-fi)** ใช้อ้างอิงหน้าตาและพฤติกรรม ไม่ใช่โค้ด production ห้าม copy ไปใช้ตรง ๆ ให้ **สร้างใหม่เป็น Next.js** โดยคง visual ตาม prototype (สี, ระยะ, ฟอนต์, ข้อความไทยทุกตัว)
- Fidelity: **High-fidelity** — สี ฟอนต์ ระยะ ต้องตรง ดูค่าใน `design-reference/lifeos.css`
- Prototype ปัจจุบันเก็บข้อมูลทั้งหมดเป็น JSON ก้อนเดียวใน `localStorage` + sync ขึ้น Supabase เป็น 1 row ต่อ user (`supabase-sync.jsx`, last-write-wins) **ระบบจริงต้องเปลี่ยนเป็น relational schema** (`supabase/schema.sql`) พร้อมตัวนำเข้าข้อมูลเก่า (หัวข้อ 9)
- Business logic ทั้งหมดอยู่ใน `lifeos-data.jsx`, `lifeos-store.jsx`, `lifeos-trips.jsx`, `lifeos-slips.jsx` → ย้ายเป็น pure functions ใน `lib/domain/*` พร้อม unit test
- `product-spec.md` คือ product vision เต็ม (Phase 1–5) ใช้เป็น roadmap ไม่ต้องทำทั้งหมดใน v1
- `supabase-config.js` ใน prototype มี URL/anon key ของโปรเจกต์ทดลอง ให้ย้ายเป็น env และสร้าง/ใช้โปรเจกต์ Supabase ใหม่สำหรับ production

## 1. Architecture

```
Browser (PWA, mobile-first)
  ├─ Next.js App Router (RSC + Client Components)
  │    ├─ Server Components: อ่านข้อมูลผ่าน Supabase server client (cookie session)
  │    ├─ Server Actions: เขียนข้อมูลทุกอย่าง (zod validate → Supabase)
  │    └─ Route Handlers: /api/cron/*, /api/push/*, /auth/callback
  ├─ TanStack Query: cache + optimistic update + undo (เฉพาะ client islands)
  └─ Tesseract.js (client-side OCR สลิปโอนเงิน — ไม่ส่งรูปออกนอกเครื่อง)
Vercel
  ├─ Edge middleware: refresh session, redirect /login
  ├─ Cron (vercel.json): /api/cron/process-due (ทุกวัน 00:05 ICT), /api/cron/notify (ทุกวัน 08:00 ICT)
Supabase
  ├─ Auth (email+password; เปิด Google ได้ภายหลัง)
  ├─ Postgres + RLS (ทุกตารางผูก user_id = auth.uid())
  └─ Storage bucket `files` (private, path = <uid>/<kind>/<uuid>.<ext>, ใช้ signed URL)
```

**Libraries:** `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `@tanstack/react-query`, `date-fns` + `date-fns-tz` (Asia/Bangkok), `tesseract.js`, `web-push`, `vitest`, `@serwist/next` (PWA). Styling: CSS variables จาก `lifeos.css` + Tailwind v4 (map tokens เป็น theme) — หรือ CSS Modules ก็ได้ ขอให้ token เดียวกัน

### Time zone / เงิน / วันที่
- วันที่เก็บเป็น `date` (ไม่มี time zone) ตีความเป็น Asia/Bangkok เสมอ; "วันนี้" คำนวณฝั่ง server ด้วย TZ นี้ (ห้ามใช้ `new Date()` ดิบ)
- เงินเป็น `numeric(14,2)` ใน DB; ใน JS ใช้ number ปัดทศนิยม 2 ตำแหน่ง (`Math.round(x*100)/100`) ตามเดิม
- ยอดคงเหลือบัญชี / ยอดใช้บัตร **ไม่เก็บเป็นค่าที่แก้ไขได้** → คำนวณจาก view `account_balances`, `card_usage` (opening + ผลรวม transactions) กัน drift

## 2. Routes ↔ Screens

| Route | Prototype (`lifeos-app.jsx` id) | ไฟล์อ้างอิง | ภาพ |
|---|---|---|---|
| `/login` | Login | `Login.html` | — |
| `/` | `dash` ภาพรวมวันนี้ | `lifeos-money.jsx` (DashboardScreen) | `screenshots/01-dashboard.png` |
| `/money` | `money` เงินและบัญชี | `lifeos-money.jsx` | `02-money.png` |
| `/stats` | `stats` สรุป & สถิติ | `lifeos-stats.jsx` | `03-stats.png` |
| `/bills` | `bills` บิล & บัตรเครดิต (+สมาชิก, ผ่อน) | `lifeos-money.jsx` | `04-bills.png` |
| `/trips`, `/trips/[id]` | `trips` ทริป & หารเงิน | `lifeos-trips.jsx` | `05-trips.png` |
| `/forecast` | `forecast` คาดการณ์เงินสด | `lifeos-stats.jsx` | `06-forecast.png` |
| `/assets` | `assets` ทรัพย์สิน & ประกัน | `lifeos-things.jsx` | `07-assets.png` |
| `/vehicle` | `vehicle` รถยนต์ | `lifeos-vehicle.jsx` | `08-vehicle.png` |
| `/home` | `home` บ้าน (+โปรเจกต์ต่อเติม) | `lifeos-life.jsx`, `lifeos-build.jsx` | `09-home.png` |
| `/docs` | `docs` คลังเอกสาร | `lifeos-things.jsx` | `10-docs.png` |
| `/calendar` | `calendar` ปฏิทิน | `lifeos-life.jsx` | `11-calendar.png` |
| `/notifications` | `notis` ศูนย์แจ้งเตือน | `lifeos-life.jsx` | `12-notifications.png` |
| `/search?q=` | `search` ค้นหาทั้งระบบ | `lifeos-data.jsx` (`searchAll`) | — |
| `/settings` | `settings` | `lifeos-settings.jsx` | — |

Layout: `(app)/layout.tsx` = sidebar (desktop ≥ ~900px, ดูกลุ่มเมนูใน `NAV`) / bottom nav 5 ช่อง (มือถือ: ภาพรวม · เงิน · **+** · ปฏิทิน · อื่น ๆ) ปุ่ม **+** เปิด Quick Add sheet. Forms ทั้งหมดเป็น modal/sheet (`FormModal` ใน `lifeos-ui.jsx`, registry ใน `lifeos-forms.jsx`) → ใช้ parallel/intercepting routes หรือ client state ก็ได้ แต่ต้อง deep-link ได้อย่างน้อย `/trips/[id]`

## 3. Data model

ดู `supabase/schema.sql` (พร้อมรัน) สรุปความสัมพันธ์:

```
auth.users ─┬─ profiles(prefs)
            ├─ accounts ──┐
            ├─ cards ─────┼─< transactions >─ ref(bill/sub/slip/trip)  (src_*/to_* FK, exactly-one checks)
            ├─ bills / subscriptions / recurring_income / installment_plans / budgets
            ├─ assets ── purchase_txn_id → transactions     (Record once, use everywhere)
            ├─ properties, home_tasks, projects ─< project_bills
            ├─ vehicles ─< vehicle_services, fuel_logs
            ├─ documents (→ asset / vehicle), tasks
            ├─ friends ─ trips ─< trip_members ─< trip_expenses ─< trip_expense_items
            │                                         └─< trip_expense_shares   (materialised on write)
            │                     └─< trip_settlements → transactions
            └─ notification_acks, push_subscriptions
```

กฎ:
- ทุกตารางมี RLS `user_id = auth.uid()` (policy สร้างด้วย loop ท้ายไฟล์) — ทดสอบด้วย 2 users ว่าเห็นข้อมูลกันไม่ได้
- Enum ภาษาอังกฤษใน DB, label ไทยอยู่ใน `lib/i18n/th.ts` (cycle: monthly→"รายเดือน", quarterly→"ทุก 3 เดือน", semiannual→"ทุก 6 เดือน", yearly→"รายปี")
- Trip: สมาชิก "ฉัน" = `trip_members.friend_id is null`; `paid_by` และ `people[]` อ้าง `trip_members.id`
- `transactions.ref` + unique index ทำให้ auto-debit/สลิปซ้ำไม่เกิดสองครั้ง (idempotent)
- หมวดค่าใช้จ่าย: `อาหาร, เดินทาง, ช้อปปิ้ง, บ้าน, บิล/ค่าน้ำไฟ, บันเทิง, สุขภาพ, รถ, อื่นๆ`; รายรับ: `เงินเดือน, ฟรีแลนซ์, โบนัส, ขายของ, อื่นๆ` (เก็บเป็น text ให้ผู้ใช้เพิ่มได้ภายหลัง)

## 4. Domain logic ที่ต้องพอร์ต (`lib/domain/`)

| โมดูล | ฟังก์ชันใน prototype | หมายเหตุ |
|---|---|---|
| `dates.ts` | `addMonths` (clamp วันสิ้นเดือน), `addCycle`, `occurrences(start,cycle,from,to)` (limit 60), `daysTo`, `dueLabel` (เกินกำหนด/วันนี้/พรุ่งนี้/อีก n วัน; ≤7 วัน = amber, ≤1 = red) | test: 31 ม.ค. +1 เดือน → 28/29 ก.พ. |
| `money.ts` | `txnEffect`, `payBillNow`, `paySubNow`, `payCardNow` | ใน DB ทำเป็น 1 transaction: insert txn + เลื่อน `next_due` (RPC หรือ server action ใช้ `supabase.rpc`) |
| `forecast.ts` | `forecast(days)`, `upcomingPayments`, `subsMonthly` | บิลค้างจ่ายนับเป็นรายจ่ายวันนี้; ยอดบัตรเครดิตนับที่ due date; รายได้ประจำ `nextIncomeDate(day)` |
| `notifications.ts` | `notifications()` | key = `<kind>:<id>@<date>`; กฎ: บิล/บัตร ≤8 วัน · ประกัน/ภาษีรถ/ประกันสินค้า ≤45 วัน · เอกสาร ≤30 วัน (ยกเว้นประเภท ประกัน/ทะเบียน) · งานบ้าน ≤20 วัน · เช็กระยะรถเหลือ ≤1,000 กม. · งานค้าง ≤1 วัน |
| `calendar.ts` | `calendarEvents()` | รวมบิล สมาชิก บัตร รายได้ ประกัน งานบ้าน ประกัน/ภาษีรถ งาน เอกสาร; สี tone: red=จ่าย, accent=สมาชิก, green=รายได้/บ้าน, amber=หมดอายุ |
| `vehicle.ts` | `nextServiceKm`, `fuelStats` (km/L, ฿/km จากช่วงระหว่างการเติม), `vehicleYearCost` | |
| `trips.ts` | `tAmt`, `tShares` (equal/items/custom), `tBalances`, `tSettle` (greedy ลดจำนวนโอน, ตัด < 0.01), `fmtC` | สกุล: THB JPY KRW CNY TWD VND ฯลฯ (`TRIP_CUR`); JPY/KRW/TWD/VND ไม่มีทศนิยม; `rate` = THB ต่อ 1 หน่วย; ปิดยอด settlement สร้าง txn ถ้าเป็นของ "ฉัน" |
| `search.ts` | `searchAll` | v1: ILIKE + `pg_trgm` ผ่าน RPC `search_all(q)` (union ทุกตาราง) หรือ query คู่ขนานใน server action |
| `slips.ts` | `parseSlip`, `slipDup` ฯลฯ | ทำงานฝั่ง client (Tesseract `tha+eng`), ปี พ.ศ.→ค.ศ., กันซ้ำด้วย `ref='slip:<เลขอ้างอิง>'` |

**Test ขั้นต่ำ (vitest):** addMonths edge cases, occurrences, tSettle (ตัวอย่างใน `LOS_TRIPS`: ยอดรวมของทุกคน = 0), tShares ทั้ง 3 โหมด, forecast, notifications threshold.

## 5. พฤติกรรมสำคัญ (Interactions)

- **Quick Add** (+): sheet เลือก รายจ่าย / รายรับ / โอน / บิล / ทรัพย์สิน / เติมน้ำมัน / ซ่อมรถ / งาน / เอกสาร / ทริป — ฟิลด์บังคับน้อยที่สุด (ชื่อ, จำนวน, วัน) ที่เหลืออยู่ใน "รายละเอียดเพิ่มเติม"
- **Undo:** ทุก mutation มี toast "เลิกทำ" 5 วินาที (prototype snapshot ทั้งก้อน) → ระบบจริงให้ server action คืนค่า inverse (เช่น delete ของที่เพิ่งสร้าง / restore ค่าก่อนแก้) ผ่าน mutation ของ TanStack Query; toast ปกติ 2.6 วินาที
- **Auto-process on due:** บิลที่ `auto_debit` และสมาชิกที่ถึงวัน → สร้าง txn อัตโนมัติ (วนสูงสุด 12 / 24 รอบเผื่อไม่ได้เปิดแอปนาน) ทำใน Cron `/api/cron/process-due` (service role, ตรวจ header `Authorization: Bearer $CRON_SECRET`) และเรียกซ้ำตอนเปิดแอปได้ (idempotent ด้วย `ref`). เปิดแอปแล้ว toast "ตัดบิล/สมาชิกอัตโนมัติ n รายการ"
- **Hide amounts:** pref `hide` แสดง `฿ •••` ทุกที่ที่ใช้ `money()`
- **PIN lock:** เก็บ hash ฝั่ง client (`pinHash`) ใช้กันคนมองข้ามไหล่เท่านั้น ไม่ใช่ security boundary (ความปลอดภัยจริงคือ Supabase Auth + RLS)
- **Theme:** `data-theme=light|dark`, `data-motion=on|off` บน `<html>`
- **Daily notification:** Web Push ผ่าน `web-push` + VAPID; Cron `/api/cron/notify` ส่งสรุป "ถึงกำหนด n รายการ" (รายการที่ `daysTo ≤ 1` และยังไม่ ack) ต่อ user ที่เปิด `prefs.notify`; กด ack → `notification_acks`
- **Backup:** ปุ่ม export JSON / import (รูปแบบเดิม `{app:'KhunOwl', data:{...}}` ต้องยังนำเข้าได้ — หัวข้อ 9) และ export CSV ของ transactions
- **States:** loading skeleton ต่อ card, empty state ต่อรายการ (ข้อความไทยตาม prototype), error toast ภาษาไทย, ฟอร์ม validate ด้วย zod ข้อความเดียวกับ `valid` ใน prototype (เช่น Trip custom split ต้องรวมเท่ายอด ±0.05)
- **Responsive:** mobile-first; sidebar แสดงเมื่อกว้างพอ; ตารางกลายเป็น list row บนมือถือ; touch target ≥ 44px

## 6. Design tokens (จาก `lifeos.css`)

- Font: **Anuphan** 300/400/500/600/700 (Google Fonts, ใช้ `next/font/google`), base 15px / line-height 1.45; ตัวเลขใช้ `font-variant-numeric: tabular-nums; letter-spacing:-0.015em`
- สี: `--desk #E8E8E9` · `--bg #F7F6F4` · `--panel #FFFFFF` · `--panel-2 #F4F3F1` · `--sidebar #1C1F2B` · `--ink #1B1E26` · `--ink-soft #5C6068` · `--ink-faint #6A6E75` · `--line #ECEAE6` · `--accent #F2658A` · `--accent-deep #E0456F` · `--accent-soft #FDE7EC` · `--accent-2 #FF8A63` · `--hero linear-gradient(120deg,#FF8A63,#F2658A 55%,#EE4E97)` · `--pos #23A36A` (soft `#E3F5EC`) · `--warn #E09338` (soft `#FBF0E1`, text `#B8762A`) · `--neg #E24B4B` (soft `#FCE8E8`)
- Radius: xl 26 · lg 20 · md 14 · sm 11 · pill 999. Card shadow `0 2px 14px rgba(40,40,50,.05)`; hero shadow `0 12px 28px rgba(238,78,151,.22)`; shell shadow `0 24px 60px rgba(30,30,40,.14)`
- Layout: body padding 22px, สีพื้น desk; shell มุมโค้ง 26 พื้น sidebar เข้ม + canvas `--bg` มุมโค้ง; sidebar กว้าง 238px; content padding `18px 30px 36px`; dashboard 2 คอลัมน์ ≥1180px (ขวา 330px); bottom nav สูง 64px
- Dark theme: ดู `[data-theme=dark]` ใน `lifeos.css`
- Component classes ที่ต้องสร้างเป็น React components: Card, Row, Sec, Badge(red/amber/green/accent), Bar, Btn(primary/accent), Tabs, Chipstat, FormModal, Field, Chips, Toast, Empty, Avatar/AvStack (ทริป), LIcon (ไอคอน set ใน `lifeos-ui.jsx` — ใช้ไอคอน SVG ชุดเดียวกัน หรือ lucide ที่ใกล้เคียง)

## 7. Assets

`design-reference/assets/`: `khunowl-*` (icon, favicon, apple-touch) และ `banks/` (โลโก้ธนาคาร/บัตร ใช้ key เดียวกับ `accounts.bank`, `cards.bank`). โลโก้บริการสมาชิก/บิลใช้ `domain` (เช่น `netflix.com`) — ให้ใช้ favicon service หรือเก็บโลโก้เอง; ถ้าโหลดไม่ได้ fallback เป็นตัวอักษรย่อ. ไม่มีรูปถ่ายใน design

## 8. Deployment (Vercel + Supabase)

**ENV** (`.env.local` / Vercel Project Settings):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # publishable key
SUPABASE_SERVICE_ROLE_KEY=            # server only — ใช้ใน cron เท่านั้น
CRON_SECRET=                          # Vercel ใส่ให้ใน Authorization header ของ cron
NEXT_PUBLIC_VAPID_PUBLIC_KEY= / VAPID_PRIVATE_KEY= / VAPID_SUBJECT=mailto:you@example.com
```
**vercel.json**
```json
{ "crons": [
  { "path": "/api/cron/process-due", "schedule": "5 17 * * *" },
  { "path": "/api/cron/notify",      "schedule": "0 1 * * *" } ] }
```
(UTC: 17:05 = 00:05 ICT, 01:00 = 08:00 ICT)

**ขั้นตอน:** `supabase init` → วาง `supabase/schema.sql` เป็น `migrations/0001_init.sql` → `supabase link` + `db push` → ตั้ง Auth (Site URL = โดเมน Vercel, Redirect `/auth/callback`; เปิด email confirm) → `supabase gen types typescript > lib/db.types.ts` → deploy ผ่าน GitHub → Vercel; ใช้ Preview env ชี้ Supabase branch/โปรเจกต์ dev แยกจาก prod. Cache: หน้าในแอปเป็น dynamic (per-user) ห้าม cache ข้าม user; static assets cache ตามปกติ (prototype เดิมใช้ `no-cache` ทุกไฟล์ ไม่ต้องคงไว้)

**Security checklist:** RLS ทุกตาราง · service role ใช้เฉพาะ `/api/cron/*` · signed URL อายุสั้นสำหรับไฟล์ · zod validate ทุก server action · จำกัดขนาดไฟล์ (รูป ≤10MB, เอกสาร ≤20MB) · rate limit login (Supabase built-in) · CSP พื้นฐานใน `next.config`

## 9. นำเข้าข้อมูลจาก prototype เดิม

ผู้ใช้เดิมมี JSON backup `{ app:'KhunOwl', exportedAt, data:{ v:1, accounts, cards, bills, subs, income, plans, txns, assets, homeTasks, vehicles, service, fuel, docs, tasks, trips, friends, projects, home, budgets, notisDone } }` (สร้างโดย `losExport` ใน `lifeos-store.jsx`; ข้อมูลที่ sync ไว้อยู่ในตาราง `life_data.data` เดิม). ทำ Server Action `importLegacy(json)` ใน `/settings`:
1. สร้าง id map (string เก่า → uuid ใหม่) ต่อ entity
2. ลำดับ insert: accounts, cards → friends → bills/subs/income/plans/budgets → transactions → assets/home/tasks/docs → vehicles → service/fuel → trips (members, expenses, items, shares คำนวณใหม่ด้วย `tShares`, settlements) → projects
3. accounts: `opening_balance = bal − ผลรวม txn ของบัญชีนั้น`; cards: `opening_used = used − ผลรวมผลของ txn` เพื่อให้ยอดหลังนำเข้าตรงกับของเดิม
4. map ค่าไทย→enum: รอบ `รายเดือน/เดือน→monthly, ทุก 3 เดือน→quarterly, ทุก 6 เดือน→semiannual, รายปี/ปี/ทุกปี→yearly`; ประเภทบัญชี `เงินสด→cash, ออมทรัพย์→savings, e-Wallet→ewallet`; ความสำคัญงาน `สูง/กลาง/ต่ำ→high/medium/low`; `trip.members` ค่า `'me'` → member ที่ `friend_id null`
5. ทำใน transaction เดียว; แสดงสรุปจำนวนที่นำเข้า/ข้าม

## 10. แผนสร้าง (ให้ Claude Code ทำตามลำดับ ทีละ PR)

1. **Scaffold:** create-next-app (TS, App Router), tokens/globals จาก `lifeos.css`, Anuphan, layout shell (sidebar/bottom nav), PWA manifest + icons, Supabase clients (`server`, `browser`, `middleware`)
2. **DB + Auth:** migration, type gen, `/login` (ตาม `Login.html`), signup/confirm, middleware guard, seed script ข้อมูลตัวอย่างจาก `lifeos-data.jsx` (dev only)
3. **Domain lib + tests** (หัวข้อ 4)
4. **Money:** dashboard, accounts, transactions CRUD, bills/cards/subscriptions, quick add, undo toast, hide amounts
5. **Planning:** calendar, notifications, forecast, stats, global search
6. **Things:** assets+warranty, documents (Storage upload ผ่านกล้อง/ไฟล์), home + projects
7. **Vehicle:** vehicles, service, fuel, insurance/tax reminders
8. **Trips:** trips, members/friends, 3 split modes, settle + สร้าง txn
9. **Automation:** Cron process-due, Web Push, slip OCR import (`lifeos-slips.jsx` UI)
10. **Settings + migration:** theme, PIN, backup/export, `importLegacy`, polish, a11y, Lighthouse PWA

**Definition of done ต่อฟีเจอร์:** ตรงกับ prototype ทั้งข้อความไทยและ visual; RLS ทดสอบแล้ว; มี empty/loading/error state; ใช้งานได้ที่ 390px และ ≥1280px.

## 11. นอก v1 (เก็บไว้ใน roadmap)

AI Assistant / natural-language input (Claude API ผ่าน server route), Family sharing, OCR ใบเสร็จ, Bank import, Multi-currency นอกเหนือทริป, Net worth/Investment/Loan
