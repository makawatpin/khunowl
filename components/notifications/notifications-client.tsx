"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import type { NotificationGroup, NotificationItem } from "@/lib/domain/notifications";
import { payBillNow, undoPayBill } from "@/lib/actions/bills";
import { markHomeTaskDone, undoHomeTaskDone } from "@/lib/actions/home-tasks";
import { toggleTaskDone } from "@/lib/actions/tasks";
import { ackNotification } from "@/lib/actions/notifications";
import { useToast } from "@/components/providers/toast-provider";
import { PayCardForm } from "@/components/forms/pay-card-form";

const GROUPS: NotificationGroup[] = ["ต้องจ่าย", "ใกล้หมดอายุ", "ต้องเตรียม"];
const GROUP_ICON: Record<NotificationGroup, IconName> = { "ต้องจ่าย": "card", "ใกล้หมดอายุ": "shield", "ต้องเตรียม": "wrench" };
const TONE_VAR: Record<NotificationItem["tone"], string> = { red: "neg", amber: "warn", green: "pos", accent: "accent" };

export interface NotiCardTarget {
  id: string;
  name: string;
  used: number;
  minPayment: number;
  dueDate: string | null;
}

export function NotificationsClient({
  items,
  totalDueAmount,
  accounts,
  cardLookup,
}: {
  items: NotificationItem[];
  totalDueAmount: number;
  accounts: { id: string; name: string }[];
  cardLookup: Record<string, NotiCardTarget>;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [showDone, setShowDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payingCard, setPayingCard] = useState<NotiCardTarget | null>(null);

  const open = items.filter((n) => !n.done);
  const list = showDone ? items : open;

  const handleAction = async (n: NotificationItem) => {
    if (!n.action) return;
    setBusyId(n.id);
    if (n.action.kind === "payBill") {
      const res = await payBillNow(n.action.id);
      setBusyId(null);
      if (res.error) return show(res.error);
      router.refresh();
      if (res.txnId && res.prevDue) {
        const { txnId, prevDue, prevLastPaid } = res;
        show(`จ่าย ${n.title} แล้ว`, async () => undoPayBill(txnId, n.action!.id, prevDue, prevLastPaid ?? null));
      }
    } else if (n.action.kind === "payCard") {
      setBusyId(null);
      setPayingCard(cardLookup[n.action.id] ?? null);
    } else if (n.action.kind === "homeDone") {
      const res = await markHomeTaskDone(n.action.id);
      setBusyId(null);
      if (res.error) return show(res.error);
      router.refresh();
      if (res.prevNextDue !== undefined) {
        const { prevLastDone, prevNextDue } = res;
        show(`${n.title} เรียบร้อย`, async () => undoHomeTaskDone(n.action!.id, prevLastDone ?? null, prevNextDue!));
      }
    } else if (n.action.kind === "taskDone") {
      await toggleTaskDone(n.action.id, true);
      setBusyId(null);
      router.refresh();
      show("ทำเสร็จแล้ว");
    }
  };

  const handleAck = async (n: NotificationItem) => {
    setBusyId(n.id);
    await ackNotification(n.id);
    setBusyId(null);
    router.refresh();
    show("รับทราบแล้ว");
  };

  return (
    <>
      <div className="grid g3">
        <div className="card" style={{ background: "var(--hero)" }}>
          <div className="card-pad">
            <div className="cap" style={{ color: "rgba(255,255,255,.85)" }}>ต้องจัดการ</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: "#fff" }}>{open.length} รายการ</div>
          </div>
        </div>
        <div className="card card-pad" style={{ background: "var(--neg-soft)" }}>
          <div className="cap">ต้องจ่ายรวม (8 วัน)</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: "var(--neg)" }}><Money value={totalDueAmount} /></div>
        </div>
        <div className="card card-pad" style={{ background: "var(--pos-soft)" }}>
          <div className="cap">จัดการแล้ว</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: "var(--pos)" }}>{items.length - open.length} รายการ</div>
        </div>
      </div>
      <div className="chips" style={{ marginTop: 16 }}>
        <button className={"chip" + (!showDone ? " on" : "")} onClick={() => setShowDone(false)}>ยังไม่จัดการ</button>
        <button className={"chip" + (showDone ? " on" : "")} onClick={() => setShowDone(true)}>ทั้งหมด</button>
      </div>
      {!list.length && <div className="card card-pad empty" style={{ marginTop: 16 }}>ไม่มีเรื่องต้องจัดการ</div>}
      {GROUPS.map((g) => {
        const groupItems = list.filter((n) => n.group === g);
        if (!groupItems.length) return null;
        return (
          <div key={g}>
            <div className="sec"><h2>{g}</h2></div>
            <div className="card list">
              {groupItems.map((n) => (
                <div key={n.id} className="row" style={n.done ? { opacity: 0.5 } : undefined}>
                  <span className="ic" style={{ background: `var(--${TONE_VAR[n.tone]}-soft)` }}>
                    <Icon name={GROUP_ICON[g]} size={17} color={`var(--${TONE_VAR[n.tone]})`} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="row-t">{n.title}</span>
                  </span>
                  {n.done ? (
                    <span className="badge green">เรียบร้อย</span>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      {n.action && (
                        <button className="btn btn-sm btn-primary" disabled={busyId === n.id} onClick={() => handleAction(n)}>
                          {actionLabel(n.action.kind)}
                        </button>
                      )}
                      <button className="btn btn-sm" disabled={busyId === n.id} onClick={() => handleAck(n)}>
                        {n.action ? "ซ่อน" : "รับทราบ"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <p className="hint">เปิดการแจ้งเตือนบนเบราว์เซอร์ได้ในหน้าตั้งค่า</p>
      {payingCard && (
        <PayCardForm card={payingCard} accounts={accounts} onClose={() => setPayingCard(null)} />
      )}
    </>
  );
}

function actionLabel(kind: NonNullable<NotificationItem["action"]>["kind"]): string {
  if (kind === "payBill") return "จ่าย";
  if (kind === "payCard") return "ชำระ";
  if (kind === "homeDone") return "ทำแล้ว";
  return "เสร็จ";
}
