import { describe, expect, it } from "vitest";
import { notifications, openNotiCount } from "./notifications";

const todayISO = "2026-10-05";
const empty = { ackedKeys: new Set<string>(), bills: [], cards: [], assets: [], vehicles: [], documents: [], homeTasks: [], tasks: [] };

describe("notifications — thresholds (README §4)", () => {
  it("bills: included at exactly 8 days out, excluded at 9", () => {
    const within = notifications({ ...empty, todayISO, bills: [{ id: "b1", name: "บิล", nextDue: "2026-10-13" }] });
    const outside = notifications({ ...empty, todayISO, bills: [{ id: "b2", name: "บิล", nextDue: "2026-10-14" }] });
    expect(within).toHaveLength(1);
    expect(outside).toHaveLength(0);
  });

  it("asset warranty: included at 45 days, excluded at 46, excluded if already expired", () => {
    const within = notifications({ ...empty, todayISO, assets: [{ id: "a1", name: "เครื่อง", warrantyUntil: "2026-11-19" }] });
    const outside = notifications({ ...empty, todayISO, assets: [{ id: "a2", name: "เครื่อง", warrantyUntil: "2026-11-20" }] });
    const expired = notifications({ ...empty, todayISO, assets: [{ id: "a3", name: "เครื่อง", warrantyUntil: "2026-10-01" }] });
    expect(within).toHaveLength(1);
    expect(outside).toHaveLength(0);
    expect(expired).toHaveLength(0);
  });

  it("documents: excludes ประกัน/ทะเบียน types even within the 30-day window", () => {
    const normal = notifications({ ...empty, todayISO, documents: [{ id: "d1", name: "พาสปอร์ต", type: "เอกสารบุคคล", expiry: "2026-10-20" }] });
    const insurance = notifications({ ...empty, todayISO, documents: [{ id: "d2", name: "ประกันรถ", type: "ประกัน", expiry: "2026-10-20" }] });
    const registration = notifications({ ...empty, todayISO, documents: [{ id: "d3", name: "ป้ายภาษี", type: "ทะเบียน", expiry: "2026-10-20" }] });
    expect(normal).toHaveLength(1);
    expect(insurance).toHaveLength(0);
    expect(registration).toHaveLength(0);
  });

  it("home tasks: included within 20 days", () => {
    const within = notifications({ ...empty, todayISO, homeTasks: [{ id: "h1", name: "ล้างแอร์", nextDue: "2026-10-25" }] });
    const outside = notifications({ ...empty, todayISO, homeTasks: [{ id: "h2", name: "ล้างแอร์", nextDue: "2026-10-26" }] });
    expect(within).toHaveLength(1);
    expect(outside).toHaveLength(0);
  });

  it("vehicle service: flags when ≤1000 km remain until the next service target", () => {
    const close = notifications({ ...empty, todayISO, vehicles: [{ id: "v1", model: "Yaris", insuranceExpiry: null, taxExpiry: null, mileage: 9100, serviceEveryKm: 5000 }] });
    const far = notifications({ ...empty, todayISO, vehicles: [{ id: "v2", model: "Yaris", insuranceExpiry: null, taxExpiry: null, mileage: 5500, serviceEveryKm: 5000 }] });
    expect(close.some((n) => n.key.startsWith("vsvc:"))).toBe(true);
    expect(far.some((n) => n.key.startsWith("vsvc:"))).toBe(false);
  });

  it("tasks: only overdue/due-tomorrow and not-done tasks are flagged", () => {
    const dueToday = notifications({ ...empty, todayISO, tasks: [{ id: "t1", name: "โทรนัด", due: "2026-10-05", done: false }] });
    const dueLater = notifications({ ...empty, todayISO, tasks: [{ id: "t2", name: "โทรนัด", due: "2026-10-07", done: false }] });
    const alreadyDone = notifications({ ...empty, todayISO, tasks: [{ id: "t3", name: "โทรนัด", due: "2026-10-05", done: true }] });
    expect(dueToday).toHaveLength(1);
    expect(dueLater).toHaveLength(0);
    expect(alreadyDone).toHaveLength(0);
  });
});

describe("notifications — ack tracking", () => {
  it("marks an item done when its id is in ackedKeys, and openNotiCount excludes it", () => {
    const bills = [{ id: "b1", name: "บิล", nextDue: "2026-10-08" }];
    const items = notifications({ ...empty, todayISO, bills, ackedKeys: new Set(["bill:b1@2026-10-08"]) });
    expect(items[0].done).toBe(true);
    expect(openNotiCount(items)).toBe(0);
  });
});
