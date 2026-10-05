import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/supabase/storage";
import { todayISOInBangkok } from "@/lib/dates/today";
import { HomeClient, type ApplianceItem, type HomeBillItem } from "@/components/home/home-client";
import type { ProjectDetailData } from "@/components/home/project-detail-client";

const HOME_BILL_RE = /ไฟ|น้ำ|เน็ต|Fibre|ส่วนกลาง/i;

export default async function HomePage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const [
    { data: propertyRows },
    { data: homeTaskRows },
    { data: assetRows },
    { data: billRows },
    { data: projectRows },
    { data: billsOfProjectRows },
    { data: accountRows },
  ] = await Promise.all([
    supabase.from("properties").select("name, kind, size, monthly_rent, since").limit(1),
    supabase.from("home_tasks").select("id, name, every_months, last_done, next_due, cost"),
    supabase.from("assets").select("id, name, kind, brand, model, serial, price, purchased_on, store, warranty_until, note, sold, receipt_path").eq("kind", "เครื่องใช้ไฟฟ้า"),
    supabase.from("bills").select("name, amount, cycle"),
    supabase.from("projects").select("id, name, kind, status, start_on, end_on, budget, note, phases"),
    supabase.from("project_bills").select("id, project_id, date, shop, phase, note, items, attachment_path"),
    supabase.from("accounts").select("id, name").eq("archived", false),
  ]);

  const propertyRow = propertyRows?.[0] ?? null;
  const property = propertyRow
    ? { name: propertyRow.name, kind: propertyRow.kind, size: propertyRow.size, monthlyRent: propertyRow.monthly_rent, since: propertyRow.since }
    : null;

  const homeTasks = (homeTaskRows ?? []).map((h) => ({
    id: h.id, name: h.name, everyMonths: h.every_months, lastDone: h.last_done, nextDue: h.next_due, cost: h.cost,
  }));

  const appliances: ApplianceItem[] = await Promise.all(
    (assetRows ?? []).map(async (a) => ({
      id: a.id, name: a.name, kind: a.kind, brand: a.brand, model: a.model, serial: a.serial,
      price: a.price, purchasedOn: a.purchased_on, store: a.store, warrantyUntil: a.warranty_until,
      note: a.note, sold: a.sold, receiptUrl: await signedUrl(supabase, a.receipt_path),
    })),
  );

  const homeBills: HomeBillItem[] = (billRows ?? [])
    .filter((b) => HOME_BILL_RE.test(b.name))
    .map((b) => ({ name: b.name, amount: b.amount, cycle: b.cycle }));

  const billsByProject = new Map<string, NonNullable<typeof billsOfProjectRows>>();
  for (const b of billsOfProjectRows ?? []) {
    const list = billsByProject.get(b.project_id) ?? [];
    list.push(b);
    billsByProject.set(b.project_id, list);
  }

  const projects: ProjectDetailData[] = await Promise.all(
    (projectRows ?? []).map(async (p) => ({
      id: p.id, name: p.name, kind: p.kind, status: p.status, startOn: p.start_on, endOn: p.end_on,
      budget: p.budget, note: p.note, phases: p.phases,
      bills: await Promise.all(
        (billsByProject.get(p.id) ?? []).map(async (b) => ({
          id: b.id, date: b.date, shop: b.shop, phase: b.phase, note: b.note,
          items: (b.items as { name: string; qty: number; price: number }[]) ?? [],
          attachmentUrl: await signedUrl(supabase, b.attachment_path),
        })),
      ),
    })),
  );

  const accounts = (accountRows ?? []).filter((a): a is { id: string; name: string } => !!a.id && !!a.name);

  return (
    <HomeClient
      property={property}
      homeTasks={homeTasks}
      appliances={appliances}
      homeBills={homeBills}
      projects={projects}
      accounts={accounts}
      todayISO={todayISO}
    />
  );
}
