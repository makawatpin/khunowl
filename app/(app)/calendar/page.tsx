import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";
import { calendarEvents, defaultNextIncomeOccurrences } from "@/lib/domain/calendar";
import { formatMoney } from "@/lib/format/money";
import { CalendarClient } from "@/components/calendar/calendar-client";

export default async function CalendarPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const [
    { data: billRows },
    { data: subRows },
    { data: cardRows },
    { data: incomeRows },
    { data: assetRows },
    { data: homeTaskRows },
    { data: propertyRows },
    { data: vehicleRows },
    { data: taskRows },
    { data: docRows },
  ] = await Promise.all([
    supabase.from("bills").select("name, amount, cycle, next_due, domain"),
    supabase.from("subscriptions").select("name, price, cycle, next_billing, domain"),
    supabase.from("card_usage").select("name, used, due_date").eq("archived", false),
    supabase.from("recurring_income").select("name, amount, day_of_month"),
    supabase.from("assets").select("name, warranty_until").eq("sold", false),
    supabase.from("home_tasks").select("name, next_due"),
    supabase.from("properties").select("name").limit(1),
    supabase.from("vehicles").select("model, plate, insurance_expiry, tax_expiry"),
    supabase.from("tasks").select("name, due, priority, done"),
    supabase.from("documents").select("name, type, expiry"),
  ]);

  const homeName = propertyRows?.[0]?.name ?? "บ้าน";

  const events = calendarEvents({
    todayISO,
    bills: (billRows ?? []).map((b) => ({ name: b.name, amount: b.amount, cycle: b.cycle, nextDue: b.next_due, domain: b.domain })),
    subscriptions: (subRows ?? []).map((s) => ({ name: s.name, price: s.price, cycle: s.cycle, nextBilling: s.next_billing, domain: s.domain })),
    cards: (cardRows ?? [])
      .filter((c): c is typeof c & { name: string } => !!c.name)
      .map((c) => ({ name: c.name, used: c.used ?? 0, dueDate: c.due_date })),
    income: (incomeRows ?? []).map((i) => ({ name: i.name, amount: i.amount, dayOfMonth: i.day_of_month })),
    assets: (assetRows ?? []).map((a) => ({ name: a.name, warrantyUntil: a.warranty_until })),
    homeTasks: (homeTaskRows ?? []).map((h) => ({ name: h.name, nextDue: h.next_due, homeName })),
    vehicles: (vehicleRows ?? []).map((v) => ({ model: v.model, plate: v.plate, insuranceExpiry: v.insurance_expiry, taxExpiry: v.tax_expiry })),
    tasks: (taskRows ?? []).map((t) => ({ name: t.name, due: t.due, priority: t.priority, done: t.done })),
    documents: (docRows ?? []).map((d) => ({ name: d.name, type: d.type, expiry: d.expiry })),
    moneyFormatter: (n) => formatMoney(n),
    nextIncomeOccurrences: defaultNextIncomeOccurrences,
  });

  return <CalendarClient events={events} todayISO={todayISO} />;
}
