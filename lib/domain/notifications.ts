// Ported from design-reference/lifeos-data.jsx (notifications). Thresholds per
// README §4: bills/cards ≤8d · insurance/vehicle-tax/warranty ≤45d · documents
// ≤30d (except ประกัน/ทะเบียน) · home tasks ≤20d · vehicle service ≤1000km left ·
// overdue tasks ≤1d.
import { daysTo } from "./dates";
import { nextServiceKm } from "./vehicle";

export type NotificationGroup = "ต้องจ่าย" | "ใกล้หมดอายุ" | "ต้องเตรียม";
export type NotificationTone = "red" | "amber" | "green" | "accent";
export type NotificationAction =
  | { kind: "payBill"; id: string }
  | { kind: "payCard"; id: string }
  | { kind: "homeDone"; id: string }
  | { kind: "taskDone"; id: string };

export interface NotificationItem {
  id: string; // `${key}@${date}`
  key: string;
  group: NotificationGroup;
  tone: NotificationTone;
  title: string;
  date: string;
  action?: NotificationAction;
  done: boolean;
}

export interface NotificationsInput {
  todayISO: string;
  ackedKeys: ReadonlySet<string>; // notification_acks.noti_id, i.e. `${key}@${date}`
  bills: { id: string; name: string; nextDue: string }[];
  cards: { id: string; name: string; used: number; dueDate: string | null }[];
  assets: { id: string; name: string; warrantyUntil: string | null }[];
  vehicles: {
    id: string;
    model: string | null;
    insuranceExpiry: string | null;
    taxExpiry: string | null;
    mileage: number;
    serviceEveryKm: number;
  }[];
  documents: { id: string; name: string; type: string | null; expiry: string | null }[];
  homeTasks: { id: string; name: string; nextDue: string }[];
  tasks: { id: string; name: string; due: string | null; done: boolean }[];
}

export function notifications(input: NotificationsInput): NotificationItem[] {
  const { todayISO, ackedKeys, bills, cards, assets, vehicles, documents, homeTasks, tasks } = input;
  const out: NotificationItem[] = [];
  const add = (o: Omit<NotificationItem, "id" | "done">) => {
    const id = `${o.key}@${o.date}`;
    out.push({ ...o, id, done: ackedKeys.has(id) });
  };

  for (const b of bills) {
    if (daysTo(b.nextDue, todayISO) <= 8) {
      add({ key: `bill:${b.id}`, group: "ต้องจ่าย", tone: "red", title: b.name, date: b.nextDue, action: { kind: "payBill", id: b.id } });
    }
  }
  for (const c of cards) {
    if (c.used > 0 && daysTo(c.dueDate, todayISO) <= 8) {
      add({ key: `card:${c.id}`, group: "ต้องจ่าย", tone: "red", title: `ชำระ ${c.name}`, date: c.dueDate ?? todayISO, action: { kind: "payCard", id: c.id } });
    }
  }
  for (const a of assets) {
    const d = daysTo(a.warrantyUntil, todayISO);
    if (a.warrantyUntil && d >= 0 && d <= 45) {
      add({ key: `war:${a.id}`, group: "ใกล้หมดอายุ", tone: "amber", title: `ประกัน ${a.name}`, date: a.warrantyUntil });
    }
  }
  for (const v of vehicles) {
    if (v.insuranceExpiry && daysTo(v.insuranceExpiry, todayISO) <= 45) {
      add({ key: `vins:${v.id}`, group: "ใกล้หมดอายุ", tone: "amber", title: `ประกันรถ ${v.model ?? ""}`.trim(), date: v.insuranceExpiry });
    }
    if (v.taxExpiry && daysTo(v.taxExpiry, todayISO) <= 45) {
      add({ key: `vtax:${v.id}`, group: "ใกล้หมดอายุ", tone: "amber", title: `ภาษีรถ ${v.model ?? ""}`.trim(), date: v.taxExpiry });
    }
    const target = nextServiceKm(v.mileage, v.serviceEveryKm);
    const left = target - v.mileage;
    if (left <= 1000) {
      add({
        key: `vsvc:${v.id}:${target}`,
        group: "ต้องเตรียม",
        tone: "accent",
        title: `เช็กระยะ ${target.toLocaleString()} กม. · ${v.model ?? ""}`.trim(),
        date: todayISO,
      });
    }
  }
  for (const d of documents) {
    const n = daysTo(d.expiry, todayISO);
    if (d.expiry && n >= 0 && n <= 30 && d.type !== "ประกัน" && d.type !== "ทะเบียน") {
      add({ key: `doc:${d.id}`, group: "ใกล้หมดอายุ", tone: "amber", title: d.name, date: d.expiry });
    }
  }
  for (const h of homeTasks) {
    if (daysTo(h.nextDue, todayISO) <= 20) {
      add({ key: `home:${h.id}`, group: "ต้องเตรียม", tone: "green", title: h.name, date: h.nextDue, action: { kind: "homeDone", id: h.id } });
    }
  }
  for (const t of tasks) {
    if (!t.done && daysTo(t.due, todayISO) <= 1) {
      add({ key: `task:${t.id}`, group: "ต้องเตรียม", tone: "accent", title: t.name, date: t.due ?? todayISO, action: { kind: "taskDone", id: t.id } });
    }
  }

  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function openNotiCount(items: NotificationItem[]): number {
  return items.filter((n) => !n.done).length;
}
