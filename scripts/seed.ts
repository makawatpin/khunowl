/**
 * Dev-only seed script — ports the sample data from
 * design-reference/lifeos-data.jsx (LOS_ACCOUNTS, LOS_TXNS, LOS_TRIPS, ...)
 * into the relational schema, for one dev user.
 *
 * Usage: npm run db:seed   (reads .env.local; refuses to run in production)
 */
import "dotenv/config";
import { config as loadEnvLocal } from "dotenv";
loadEnvLocal({ path: ".env.local", override: true });

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/db.types";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV=production");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
      "Get the service_role secret from the Supabase dashboard → Project Settings → API.",
  );
  process.exit(1);
}

const email = process.env.SEED_USER_EMAIL || "dev@khunowl.test";
const password = process.env.SEED_USER_PASSWORD || "khunowl-dev-2026";

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CYCLE_MAP: Record<string, Database["public"]["Enums"]["cycle_t"]> = {
  "รายเดือน": "monthly",
  "เดือน": "monthly",
  "ทุก 3 เดือน": "quarterly",
  "ทุก 6 เดือน": "semiannual",
  "รายปี": "yearly",
  "ปี": "yearly",
  "ทุกปี": "yearly",
};
const PRI_MAP: Record<string, Database["public"]["Enums"]["task_pri"]> = {
  "สูง": "high",
  "กลาง": "medium",
  "ต่ำ": "low",
};
const VEHICLE_KIND_MAP: Record<string, Database["public"]["Enums"]["vehicle_kind"]> = {
  "รถยนต์": "car",
  "มอเตอร์ไซค์": "motorcycle",
};
const EVERY_MONTHS: Record<string, number> = { "ทุก 6 เดือน": 6, "ทุกปี": 12 };

async function main() {
  console.log(`Seeding as ${email} …`);

  // 1. dev user (idempotent: reuse if it already exists)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  let userId: string;
  if (createErr) {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const existing = list.users.find((u) => u.email === email);
    if (!existing) throw createErr;
    userId = existing.id;
    console.log("User already existed, reusing:", userId);
  } else {
    userId = created.user.id;
    console.log("Created user:", userId);
  }

  const db = admin; // service role — bypasses RLS
  const asUser = <T extends Record<string, unknown>>(row: T) => ({ ...row, user_id: userId });

  // 2. accounts — reuse the trigger-created default "เงินสด" cash account for id 'cash'
  const { data: defaultCash, error: defaultCashErr } = await db
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("bank", "cash")
    .limit(1)
    .maybeSingle();
  if (defaultCashErr) throw defaultCashErr;

  const accountId: Record<string, string> = {
    cash: defaultCash?.id ?? randomUUID(),
    kbank: randomUUID(),
    scb: randomUUID(),
    wallet: randomUUID(),
  };

  const LOS_ACCOUNTS = [
    { id: "cash", name: "เงินสด", type: "เงินสด", bal: 3200, bank: "cash" },
    { id: "kbank", name: "กสิกร K PLUS", type: "ออมทรัพย์", bal: 21450, bank: "kbank", last4: "4529" },
    { id: "scb", name: "ไทยพาณิชย์", type: "ออมทรัพย์", bal: 16200, bank: "scb", last4: "8812" },
    { id: "wallet", name: "TrueMoney", type: "e-Wallet", bal: 2000, bank: "truemoney", last4: "7127" },
  ];
  const ACCT_TYPE_MAP: Record<string, Database["public"]["Enums"]["account_type"]> = {
    "เงินสด": "cash",
    "ออมทรัพย์": "savings",
    "e-Wallet": "ewallet",
  };

  const LOS_CARDS = [
    { id: "ktc", name: "KTC Visa Platinum", bank: "ktc", network: "VISA", last4: "3301", limit: 80000, used: 18420, statement: "2026-09-25", due: "2026-10-10", min: 1850 },
    { id: "scbm", name: "SCB M Card", bank: "scb", network: "Mastercard", last4: "6604", limit: 50000, used: 6130, statement: "2026-09-18", due: "2026-09-28", min: 620 },
  ];
  const cardId: Record<string, string> = { ktc: randomUUID(), scbm: randomUUID() };

  const LOS_TXNS = [
    { id: "x01", type: "expense", amount: 8000, date: "2026-09-01", src: "scb", cat: "บ้าน", name: "ค่าเช่าคอนโด" },
    { id: "x02", type: "expense", amount: 1040, date: "2026-09-01", src: "ktc", cat: "รถ", name: "เติมน้ำมัน Yaris" },
    { id: "x03", type: "expense", amount: 1890, date: "2026-09-04", src: "ktc", cat: "ช้อปปิ้ง", name: "Uniqlo" },
    { id: "x04", type: "expense", amount: 640, date: "2026-09-06", src: "wallet", cat: "อาหาร", name: "MK สุกี้" },
    { id: "x05", type: "expense", amount: 1240, date: "2026-09-08", src: "kbank", cat: "อาหาร", name: "ซูเปอร์มาร์เก็ต Tops" },
    { id: "x06", type: "expense", amount: 320, date: "2026-09-10", src: "wallet", cat: "เดินทาง", name: "Grab" },
    { id: "x07", type: "expense", amount: 1111, date: "2026-09-14", src: "ktc", cat: "รถ", name: "เติมน้ำมัน Yaris" },
    { id: "x08", type: "expense", amount: 450, date: "2026-09-15", src: "cash", cat: "สุขภาพ", name: "ร้านยา" },
    { id: "x09", type: "expense", amount: 980, date: "2026-09-17", src: "kbank", cat: "บันเทิง", name: "ตั๋วหนัง + ป๊อปคอร์น" },
    { id: "x10", type: "expense", amount: 1560, date: "2026-09-19", src: "kbank", cat: "อาหาร", name: "ข้าวกับเพื่อน" },
    { id: "x11", type: "expense", amount: 185, date: "2026-09-21", src: "wallet", cat: "เดินทาง", name: "BTS + MRT" },
    { id: "x12", type: "income", amount: 6500, date: "2026-09-12", src: "kbank", cat: "ฟรีแลนซ์", name: "งานออกแบบโลโก้" },
  ] as const;

  // account/card sources that appear in LOS_TXNS determine opening_balance / opening_used
  // (opening = snapshot_balance − net effect of the sample transactions), mirroring the
  // importLegacy algorithm in README §9.
  const acctNet: Record<string, number> = {};
  const cardNet: Record<string, number> = {};
  for (const t of LOS_TXNS) {
    if (t.src in accountId) {
      acctNet[t.src] = (acctNet[t.src] || 0) + (t.type === "income" ? t.amount : -t.amount);
    } else if (t.src in cardId) {
      cardNet[t.src] = (cardNet[t.src] || 0) + (t.type === "expense" ? t.amount : -t.amount);
    }
  }

  const { error: accountsErr } = await db.from("accounts").upsert(
    LOS_ACCOUNTS.map((a) =>
      asUser({
        id: accountId[a.id],
        name: a.name,
        type: ACCT_TYPE_MAP[a.type],
        bank: a.bank,
        last4: "last4" in a ? a.last4 : null,
        opening_balance: a.bal - (acctNet[a.id] || 0),
      }),
    ),
  );
  if (accountsErr) throw accountsErr;

  const { error: cardsErr } = await db.from("cards").insert(
    LOS_CARDS.map((c) =>
      asUser({
        id: cardId[c.id],
        name: c.name,
        bank: c.bank,
        network: c.network,
        last4: c.last4,
        credit_limit: c.limit,
        opening_used: c.used - (cardNet[c.id] || 0),
        statement_date: c.statement,
        due_date: c.due,
        min_payment: c.min,
      }),
    ),
  );
  if (cardsErr) throw cardsErr;

  // 3. bills / subscriptions / income / installment plans / budgets
  const LOS_BILLS = [
    { id: "b_net", domain: "ais.th", name: "อินเทอร์เน็ต AIS Fibre", amount: 699, cycle: "รายเดือน", due: "2026-09-21", account: "kbank", auto: true },
    { id: "b_phone", domain: "ais.th", name: "ค่ามือถือ", amount: 599, cycle: "รายเดือน", due: "2026-09-24", account: "kbank", auto: true },
    { id: "b_elec", domain: "mea.or.th", name: "ค่าไฟ MEA", amount: 1240, cycle: "รายเดือน", due: "2026-09-28", account: "scb", auto: false },
    { id: "b_rent", name: "ค่าเช่าคอนโด", amount: 8000, cycle: "รายเดือน", due: "2026-10-01", account: "scb", auto: false },
    { id: "b_ins", domain: "aia.co.th", name: "ประกันชีวิต AIA", amount: 1500, cycle: "รายเดือน", due: "2026-10-05", account: "kbank", auto: true },
  ];
  const { error: billsErr } = await db.from("bills").insert(
    LOS_BILLS.map((b) =>
      asUser({
        name: b.name,
        domain: b.domain ?? null,
        amount: b.amount,
        cycle: CYCLE_MAP[b.cycle],
        next_due: b.due,
        account_id: accountId[b.account],
        auto_debit: b.auto,
      }),
    ),
  );
  if (billsErr) throw billsErr;

  const LOS_SUBS = [
    { id: "s_net", domain: "netflix.com", name: "Netflix", price: 419, cycle: "เดือน", next: "2026-10-15", src: "ktc" },
    { id: "s_spot", domain: "spotify.com", name: "Spotify", price: 149, cycle: "เดือน", next: "2026-09-27", src: "ktc" },
    { id: "s_icl", domain: "icloud.com", name: "iCloud 2TB", price: 349, cycle: "เดือน", next: "2026-10-03", src: "scbm" },
    { id: "s_gpt", domain: "chatgpt.com", name: "ChatGPT Plus", price: 700, cycle: "เดือน", next: "2026-10-08", src: "ktc" },
    { id: "s_adobe", domain: "adobe.com", name: "Adobe Photography", price: 3990, cycle: "ปี", next: "2027-02-12", src: "ktc" },
  ];
  const { error: subsErr } = await db.from("subscriptions").insert(
    LOS_SUBS.map((s) =>
      asUser({
        name: s.name,
        domain: s.domain,
        price: s.price,
        cycle: CYCLE_MAP[s.cycle],
        next_billing: s.next,
        card_id: cardId[s.src],
      }),
    ),
  );
  if (subsErr) throw subsErr;

  const { error: incomeErr } = await db
    .from("recurring_income")
    .insert([asUser({ name: "เงินเดือน", amount: 58000, day_of_month: 25, account_id: accountId.kbank })]);
  if (incomeErr) throw incomeErr;

  const { error: plansErr } = await db
    .from("installment_plans")
    .insert([asUser({ name: "โซฟา SB Design ผ่อน 0%", card_id: cardId.ktc, total: 24000, months: 10, paid_months: 4 })]);
  if (plansErr) throw plansErr;

  const LOS_BUDGETS: Record<string, number> = {
    "อาหาร": 8000, "เดินทาง": 3000, "ช้อปปิ้ง": 5000, "บิล/ค่าน้ำไฟ": 4000, "บันเทิง": 2000, "รถ": 4000,
  };
  const { error: budgetsErr } = await db
    .from("budgets")
    .upsert(Object.entries(LOS_BUDGETS).map(([category, monthly_limit]) => asUser({ category, monthly_limit })));
  if (budgetsErr) throw budgetsErr;

  // 4. transactions
  const { error: txnsErr } = await db.from("transactions").insert(
    LOS_TXNS.map((t) =>
      asUser({
        type: t.type as Database["public"]["Enums"]["txn_type"],
        amount: t.amount,
        date: t.date,
        name: t.name,
        category: t.cat,
        src_account_id: t.src in accountId ? accountId[t.src] : null,
        src_card_id: t.src in cardId ? cardId[t.src] : null,
      }),
    ),
  );
  if (txnsErr) throw txnsErr;

  // 5. assets
  const LOS_ASSETS = [
    { name: "iPhone 17 Pro", kind: "อุปกรณ์", brand: "Apple", price: 46900, bought: "2025-10-02", store: "Apple Store ไอคอนสยาม", serial: "F7XQ2LL9G4", warranty: "2026-10-02" },
    { name: 'MacBook Pro 14"', kind: "อุปกรณ์", brand: "Apple", price: 74900, bought: "2024-06-18", store: "Studio7", serial: "C02X1Q8JQ6", warranty: "2027-06-18" },
    { name: 'ทีวี LG OLED 55"', kind: "เครื่องใช้ไฟฟ้า", brand: "LG", price: 42000, bought: "2024-11-11", store: "Power Buy", serial: "LG55C3TH", warranty: "2026-11-11" },
    { name: "Fujifilm X-T5", kind: "อุปกรณ์", brand: "Fujifilm", price: 63900, bought: "2023-03-05", store: "Big Camera", serial: "FX5T2291", warranty: "2025-03-05" },
    { name: "แอร์ Daikin 18000 BTU", kind: "เครื่องใช้ไฟฟ้า", brand: "Daikin", price: 28500, bought: "2023-04-20", store: "HomePro", serial: "DK18KTH22", warranty: "2028-04-20" },
    { name: "เครื่องซักผ้า Samsung", kind: "เครื่องใช้ไฟฟ้า", brand: "Samsung", price: 17900, bought: "2022-08-09", store: "HomePro", serial: "SM9KG2022", warranty: "2025-08-09" },
  ];
  const { error: assetsErr } = await db.from("assets").insert(
    LOS_ASSETS.map((a) =>
      asUser({
        name: a.name,
        kind: a.kind,
        brand: a.brand,
        price: a.price,
        purchased_on: a.bought,
        store: a.store,
        serial: a.serial,
        warranty_until: a.warranty,
      }),
    ),
  );
  if (assetsErr) throw assetsErr;

  // 6. home + home tasks
  const { error: homeErr } = await db
    .from("properties")
    .insert([asUser({ name: "คอนโด ลาดพร้าว 71", kind: "เช่า", monthly_rent: 8000, since: "2024-02-01", size: "32 ตร.ม." })]);
  if (homeErr) throw homeErr;

  const LOS_HOME_TASKS = [
    { name: "ล้างแอร์", every: "ทุก 6 เดือน", last: "2026-04-02", next: "2026-10-02", cost: 700 },
    { name: "เปลี่ยนไส้กรองน้ำ", every: "ทุก 6 เดือน", last: "2026-03-15", next: "2026-09-15", cost: 450 },
    { name: "ล้างเครื่องซักผ้า", every: "ทุกปี", last: "2025-12-01", next: "2026-12-01", cost: 800 },
    { name: "ตรวจระบบไฟ", every: "ทุกปี", last: "2026-01-20", next: "2027-01-20", cost: 1200 },
  ];
  const { error: homeTasksErr } = await db.from("home_tasks").insert(
    LOS_HOME_TASKS.map((h) =>
      asUser({ name: h.name, every_months: EVERY_MONTHS[h.every] ?? 6, last_done: h.last, next_due: h.next, cost: h.cost }),
    ),
  );
  if (homeTasksErr) throw homeTasksErr;

  // 7. vehicles + services + fuel
  const LOS_VEHICLES = [
    {
      id: "v_yaris", kind: "รถยนต์", brand: "Toyota", model: "Yaris Ativ 1.2 Sport", year: 2022, plate: "2กก 1234 กรุงเทพฯ",
      vin: "MR2B29F3X0123456", color: "เทา", bought: "2022-05-14", price: 599000, mileage: 14450, serviceEvery: 5000,
      insurance: { company: "วิริยะประกันภัย", policy: "VIR-2026-884213", premium: 15200, expiry: "2026-10-20" },
      prb: { expiry: "2026-10-20", premium: 645 }, tax: { expiry: "2026-11-14", premium: 1200 },
    },
    {
      id: "v_pcx", kind: "มอเตอร์ไซค์", brand: "Honda", model: "PCX 160", year: 2024, plate: "1ขค 8899 กรุงเทพฯ",
      vin: "MLHJK5410P5012233", color: "ดำ", bought: "2024-03-02", price: 89400, mileage: 6120, serviceEvery: 4000,
      insurance: { company: "ทิพยประกันภัย", policy: "TIP-2026-110945", premium: 4200, expiry: "2027-03-01" },
      prb: { expiry: "2027-03-01", premium: 324 }, tax: { expiry: "2027-03-31", premium: 100 },
    },
  ];
  const vehicleId: Record<string, string> = { v_yaris: randomUUID(), v_pcx: randomUUID() };
  const { error: vehiclesErr } = await db.from("vehicles").insert(
    LOS_VEHICLES.map((v) =>
      asUser({
        id: vehicleId[v.id],
        kind: VEHICLE_KIND_MAP[v.kind],
        brand: v.brand,
        model: v.model,
        year: v.year,
        plate: v.plate,
        vin: v.vin,
        color: v.color,
        purchased_on: v.bought,
        price: v.price,
        mileage: v.mileage,
        service_every_km: v.serviceEvery,
        insurance_company: v.insurance.company,
        insurance_policy: v.insurance.policy,
        insurance_premium: v.insurance.premium,
        insurance_expiry: v.insurance.expiry,
        prb_premium: v.prb.premium,
        prb_expiry: v.prb.expiry,
        tax_premium: v.tax.premium,
        tax_expiry: v.tax.expiry,
      }),
    ),
  );
  if (vehiclesErr) throw vehiclesErr;

  const LOS_SERVICE = [
    { vid: "v_yaris", cat: "ซ่อมบำรุง", name: "เปลี่ยนน้ำมันเครื่อง + กรอง", date: "2026-06-02", mileage: 10000, cost: 2400, provider: "Toyota ลาดพร้าว" },
    { vid: "v_yaris", cat: "ล้าง/ดูแล", name: "ล้างรถ + ดูดฝุ่น", date: "2026-08-10", mileage: 0, cost: 250, provider: "" },
    { vid: "v_yaris", name: "เช็กระยะ 10,000 กม.", date: "2026-06-02", mileage: 10000, cost: 1800, provider: "Toyota ลาดพร้าว" },
    { vid: "v_yaris", name: "เปลี่ยนยาง 4 เส้น", date: "2026-02-18", mileage: 7200, cost: 14800, provider: "B-Quik" },
    { vid: "v_yaris", name: "เปลี่ยนแบตเตอรี่", date: "2025-11-08", mileage: 5400, cost: 3200, provider: "B-Quik" },
    { vid: "v_pcx", name: "เปลี่ยนน้ำมันเครื่อง", date: "2026-08-22", mileage: 6000, cost: 420, provider: "Honda Wing ลาดพร้าว" },
    { vid: "v_pcx", name: "เปลี่ยนยางหลัง", date: "2026-05-10", mileage: 4300, cost: 1650, provider: "ร้านช่างเอ" },
  ];
  const { error: serviceErr } = await db.from("vehicle_services").insert(
    LOS_SERVICE.map((s) =>
      asUser({
        vehicle_id: vehicleId[s.vid],
        category: s.cat ?? null,
        name: s.name,
        date: s.date,
        mileage: s.mileage,
        cost: s.cost,
        provider: s.provider || null,
      }),
    ),
  );
  if (serviceErr) throw serviceErr;

  const LOS_FUEL = [
    { vid: "v_yaris", date: "2026-09-14", mileage: 14450, liters: 32.1, perL: 34.6, total: 1111 },
    { vid: "v_yaris", date: "2026-09-01", mileage: 13960, liters: 30.4, perL: 34.2, total: 1040 },
    { vid: "v_yaris", date: "2026-08-18", mileage: 13480, liters: 33.0, perL: 33.9, total: 1119 },
    { vid: "v_yaris", date: "2026-08-04", mileage: 12950, liters: 31.2, perL: 34.1, total: 1064 },
    { vid: "v_pcx", date: "2026-09-12", mileage: 6120, liters: 5.6, perL: 34.6, total: 194 },
    { vid: "v_pcx", date: "2026-09-02", mileage: 5900, liters: 5.2, perL: 34.2, total: 178 },
    { vid: "v_pcx", date: "2026-08-21", mileage: 5680, liters: 5.4, perL: 33.9, total: 183 },
  ];
  const { error: fuelErr } = await db.from("fuel_logs").insert(
    LOS_FUEL.map((f) =>
      asUser({ vehicle_id: vehicleId[f.vid], date: f.date, mileage: f.mileage, liters: f.liters, price_per_l: f.perL, total: f.total }),
    ),
  );
  if (fuelErr) throw fuelErr;

  // 8. documents + tasks
  const LOS_DOCS = [
    { name: "พาสปอร์ต", type: "เอกสารบุคคล", expiry: "2029-04-11", rel: "" },
    { name: "ใบขับขี่รถยนต์", type: "เอกสารบุคคล", expiry: "2027-05-14", rel: "Toyota Yaris" },
    { name: "กรมธรรม์ประกันรถ", type: "ประกัน", expiry: "2026-10-20", rel: "Toyota Yaris" },
    { name: "พ.ร.บ. รถยนต์", type: "ประกัน", expiry: "2026-10-20", rel: "Toyota Yaris" },
    { name: "ป้ายภาษีรถ", type: "ทะเบียน", expiry: "2026-11-14", rel: "Toyota Yaris" },
    { name: "ใบเสร็จ iPhone 17 Pro", type: "ใบเสร็จ", expiry: "", rel: "iPhone 17 Pro" },
    { name: "AppleCare+ iPhone", type: "ประกัน", expiry: "2026-10-02", rel: "iPhone 17 Pro" },
    { name: "สัญญาเช่าคอนโด", type: "สัญญา", expiry: "2027-01-31", rel: "คอนโด ลาดพร้าว 71" },
    { name: "ใบรับประกันแอร์ Daikin", type: "ใบรับประกัน", expiry: "2028-04-20", rel: "แอร์ Daikin" },
  ];
  const { error: docsErr } = await db.from("documents").insert(
    LOS_DOCS.map((d) => asUser({ name: d.name, type: d.type, expiry: d.expiry || null, related: d.rel || null })),
  );
  if (docsErr) throw docsErr;

  const LOS_TASKS = [
    { name: "โทรนัดศูนย์เช็กระยะ 15,000 กม.", due: "2026-09-24", pri: "สูง", rel: "Toyota Yaris" },
    { name: "ต่อประกันรถ + พ.ร.บ.", due: "2026-10-10", pri: "สูง", rel: "Toyota Yaris" },
    { name: "นัดช่างล้างแอร์", due: "2026-09-25", pri: "กลาง", rel: "แอร์ Daikin" },
    { name: "ส่งเอกสารเคลมประกันสุขภาพ", due: "2026-09-23", pri: "กลาง", rel: "" },
  ];
  const { error: tasksErr } = await db
    .from("tasks")
    .insert(LOS_TASKS.map((t) => asUser({ name: t.name, due: t.due, priority: PRI_MAP[t.pri], related: t.rel || null })));
  if (tasksErr) throw tasksErr;

  // 9. friends + trips + expenses + shares + settlements
  const LOS_FRIENDS = [
    { key: "mint", name: "มิ้นท์", color: "#23A36A" },
    { key: "bank", name: "แบงค์", color: "#3E82CF" },
    { key: "fah", name: "ฟ้า", color: "#8A5CC4" },
    { key: "guy", name: "กาย", color: "#E09338" },
  ];
  const friendId: Record<string, string> = Object.fromEntries(LOS_FRIENDS.map((f) => [f.key, randomUUID()]));
  const { error: friendsErr } = await db
    .from("friends")
    .insert(LOS_FRIENDS.map((f) => asUser({ id: friendId[f.key], name: f.name, color: f.color })));
  if (friendsErr) throw friendsErr;

  const today = new Date();
  const relDay = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  type TripDef = {
    key: string;
    name: string;
    start: string;
    end: string;
    currency: string;
    rate: number;
    members: string[]; // 'me' | friend key
    settlements: { from: string; to: string; amt: number; date: string }[];
    expenses: {
      title: string;
      cat: string;
      paidBy: string;
      date: string;
      splitMode: "equal" | "items" | "custom";
      amount?: number;
      split?: string[];
      shares?: Record<string, number>;
      items?: { name: string; price: number; people: string[] }[];
    }[];
  };

  const LOS_TRIPS: TripDef[] = [
    {
      key: "t_jp", name: "ตะลุยญี่ปุ่น", start: relDay(25), end: relDay(31), currency: "JPY", rate: 0.23,
      members: ["me", "mint", "bank"], settlements: [],
      expenses: [
        { title: "JR Pass 7 วัน", cat: "เดินทาง", paidBy: "me", date: relDay(-20), splitMode: "equal", amount: 29650, split: ["me", "mint", "bank"] },
        { title: "โรงแรม Shinjuku 3 คืน", cat: "ที่พัก", paidBy: "mint", date: relDay(-18), splitMode: "equal", amount: 48000, split: ["me", "mint", "bank"] },
        { title: "ตั๋ว DisneySea", cat: "เที่ยว/ตั๋ว", paidBy: "me", date: relDay(-10), splitMode: "custom", amount: 28200, shares: { me: 10000, mint: 10000, bank: 8200 } },
      ],
    },
    {
      key: "t_hy", name: "เที่ยวหาดใหญ่", start: relDay(-40), end: relDay(-37), currency: "THB", rate: 1,
      members: ["me", "mint", "bank", "fah"],
      settlements: [{ from: "fah", to: "me", amt: 1500, date: relDay(-35) }],
      expenses: [
        { title: "ตั๋วเครื่องบินไป-กลับ", cat: "เดินทาง", paidBy: "me", date: relDay(-40), splitMode: "equal", amount: 7200, split: ["me", "mint", "bank", "fah"] },
        { title: "โรงแรม 2 คืน", cat: "ที่พัก", paidBy: "mint", date: relDay(-40), splitMode: "equal", amount: 6400, split: ["me", "mint", "bank", "fah"] },
        { title: "รถตู้เหมาวัน", cat: "เดินทาง", paidBy: "bank", date: relDay(-39), splitMode: "equal", amount: 1800, split: ["me", "mint", "bank", "fah"] },
        { title: "คาเฟ่ริมทะเล", cat: "อาหาร", paidBy: "me", date: relDay(-38), splitMode: "equal", amount: 560, split: ["me", "mint", "fah"] },
        {
          title: "ดินเนอร์ร้านซีฟู้ด", cat: "อาหาร", paidBy: "bank", date: relDay(-38), splitMode: "items",
          items: [
            { name: "กุ้งเผา + ปูผัดผงกะหรี่", price: 1200, people: ["me", "mint", "bank", "fah"] },
            { name: "ไวน์แดง 1 ขวด", price: 900, people: ["me", "bank", "fah"] },
            { name: "มะพร้าวน้ำหอม", price: 80, people: ["mint"] },
            { name: "น้ำส้ม", price: 70, people: ["me"] },
            { name: "เบียร์ 2 ขวด", price: 240, people: ["bank", "fah"] },
          ],
        },
      ],
    },
  ];

  const round2 = (n: number) => Math.round(n * 100) / 100;

  for (const trip of LOS_TRIPS) {
    const tripId = randomUUID();
    const { error: tripErr } = await db.from("trips").insert([
      asUser({ id: tripId, name: trip.name, start_on: trip.start, end_on: trip.end, currency: trip.currency, rate: trip.rate }),
    ]);
    if (tripErr) throw tripErr;

    const memberId: Record<string, string> = {};
    const { error: membersErr } = await db
      .from("trip_members")
      .insert(
        trip.members.map((key) => {
          const id = randomUUID();
          memberId[key] = id;
          return asUser({ id, trip_id: tripId, friend_id: key === "me" ? null : friendId[key] });
        }),
      );
    if (membersErr) throw membersErr;

    for (const exp of trip.expenses) {
      const expenseId = randomUUID();
      const amount = exp.amount ?? (exp.items ? exp.items.reduce((s, it) => s + it.price, 0) : 0);
      const { error: expErr } = await db.from("trip_expenses").insert([
        asUser({
          id: expenseId,
          trip_id: tripId,
          title: exp.title,
          category: exp.cat,
          date: exp.date,
          split_mode: exp.splitMode,
          amount,
          paid_by: memberId[exp.paidBy],
        }),
      ]);
      if (expErr) throw expErr;

      const shares = new Map<string, number>();
      if (exp.splitMode === "equal" && exp.split) {
        const each = round2(amount / exp.split.length);
        exp.split.forEach((key) => shares.set(key, each));
      } else if (exp.splitMode === "custom" && exp.shares) {
        Object.entries(exp.shares).forEach(([key, v]) => shares.set(key, v));
      } else if (exp.splitMode === "items" && exp.items) {
        const { error: itemsErr } = await db.from("trip_expense_items").insert(
          exp.items.map((it) =>
            asUser({ expense_id: expenseId, name: it.name, price: it.price, people: it.people.map((k) => memberId[k]) }),
          ),
        );
        if (itemsErr) throw itemsErr;
        exp.items.forEach((it) => {
          const each = round2(it.price / it.people.length);
          it.people.forEach((key) => shares.set(key, round2((shares.get(key) || 0) + each)));
        });
      }
      const { error: sharesErr } = await db.from("trip_expense_shares").insert(
        Array.from(shares.entries()).map(([key, amt]) => asUser({ expense_id: expenseId, member_id: memberId[key], amount: amt })),
      );
      if (sharesErr) throw sharesErr;
    }

    if (trip.settlements.length) {
      const { error: settleErr } = await db.from("trip_settlements").insert(
        trip.settlements.map((s) =>
          asUser({ trip_id: tripId, from_member: memberId[s.from], to_member: memberId[s.to], amount: s.amt, date: s.date }),
        ),
      );
      if (settleErr) throw settleErr;
    }
  }

  // 10. home construction project
  const projectId = randomUUID();
  const { error: projectErr } = await db.from("projects").insert([
    asUser({
      id: projectId,
      name: "น็อคดาวน์ ต่อเติมหลังบ้าน",
      kind: "ต่อเติม",
      status: "in_progress",
      start_on: "2023-09-24",
      budget: 500000,
      note: "ต่อเติมครัวและห้องน้ำหลังบ้าน",
      phases: ["น็อคดาวน์", "งานดิน", "โครงสร้าง", "พื้น", "ประปา", "ห้องน้ำ", "ไฟฟ้า", "หลังคา"],
    }),
  ]);
  if (projectErr) throw projectErr;

  const LOS_PROJECT_BILLS = [
    { date: "2023-09-24", shop: "พี่แมน", phase: "น็อคดาวน์", items: [{ name: "ค่าแรงขุดต้นไม้", qty: 1, price: 150 }] },
    { date: "2023-09-24", shop: "ที่อาจ", phase: "งานดิน", items: [{ name: "ค่าดิน (คันละ 480)", qty: 12, price: 480 }] },
    { date: "2023-09-25", shop: "Homepro", phase: "ประปา", items: [{ name: "ถังบำบัด DOS 1200 ลิตร", qty: 1, price: 4890 }] },
    {
      date: "2023-09-27", shop: "บัวใหญ่ค้าเหล็ก", phase: "โครงสร้าง",
      items: [
        { name: "เพลท 6x6", qty: 16, price: 80 },
        { name: 'น็อต 3 หุน 5"', qty: 64, price: 10 },
        { name: "น็อตตัวเมีย 3 หุน 0.5 กก.", qty: 1, price: 50 },
      ],
    },
    { date: "2023-10-05", shop: "CPAC โนนตาเถร", phase: "พื้น", items: [{ name: "เทพื้น CPAC (คิว)", qty: 7, price: 2225.6 }] },
    { date: "2023-10-11", shop: "HOMEPRO", phase: "ห้องน้ำ", items: [{ name: "สุขภัณฑ์ MOYA SN-T005 3/4.8L", qty: 2, price: 2785 }], note: "สั่งผ่าน Shopee" },
  ];
  const { error: projectBillsErr } = await db.from("project_bills").insert(
    LOS_PROJECT_BILLS.map((b) =>
      asUser({ project_id: projectId, date: b.date, shop: b.shop, phase: b.phase, items: b.items, note: b.note ?? null }),
    ),
  );
  if (projectBillsErr) throw projectBillsErr;

  console.log("\nSeed complete for", email, `(password: ${password})`);
  console.log("Accounts:", LOS_ACCOUNTS.length, "Cards:", LOS_CARDS.length, "Transactions:", LOS_TXNS.length);
  console.log("Trips:", LOS_TRIPS.length, "Assets:", LOS_ASSETS.length, "Vehicles:", LOS_VEHICLES.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
