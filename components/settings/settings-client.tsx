"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Toggle } from "@/components/ui/toggle";
import { Money } from "@/components/ui/money";
import { usePrefs } from "@/components/providers/prefs-provider";
import { PinSetupForm } from "@/components/forms/pin-setup-form";
import { BudgetForm } from "@/components/forms/budget-form";
import { IncomeForm, type IncomeFormInitial } from "@/components/forms/income-form";
import { PushNotificationToggle } from "@/components/settings/push-notification-toggle";
import { DataSection } from "@/components/settings/data-section";
import { setPinHash } from "@/lib/actions/prefs";
import { useToast } from "@/components/providers/toast-provider";

export function SettingsClient({
  hasPin,
  budgets,
  incomeList,
  accounts,
  notifyEnabled,
}: {
  hasPin: boolean;
  budgets: Record<string, number>;
  incomeList: IncomeFormInitial[];
  accounts: { id: string; name: string }[];
  notifyEnabled: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const { hide, toggleHide, theme, setTheme, motion, setMotion } = usePrefs();
  const [pinForm, setPinForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState(false);
  const [incomeForm, setIncomeForm] = useState<"new" | IncomeFormInitial | null>(null);

  const budgetTotal = Object.values(budgets).reduce((s, v) => s + v, 0);

  const handlePinToggle = async (on: boolean) => {
    if (on) {
      setPinForm(true);
      return;
    }
    await setPinHash(null);
    sessionStorage.removeItem("los:unlocked");
    router.refresh();
    show("ปิด PIN แล้ว");
  };

  return (
    <>
      <div className="sec"><h2>การแสดงผล</h2></div>
      <div className="card list">
        <Toggle on={hide} onChange={toggleHide} label="ซ่อนยอดเงิน" sub="แสดงเป็น ฿ ••• ทั้งแอป (กดไอคอนรูปตาด้านบนได้เช่นกัน)" />
        <Toggle on={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} label="โหมดมืด" />
        <Toggle on={motion !== "off"} onChange={(v) => setMotion(v ? "on" : "off")} label="แอนิเมชัน" sub="การ์ดลอยและการเปลี่ยนหน้าแบบลื่นไหล" />
      </div>

      <div className="sec"><h2>ความปลอดภัย</h2></div>
      <div className="card list">
        <Toggle on={hasPin} onChange={handlePinToggle} label="ล็อกด้วย PIN" sub={hasPin ? "ถามรหัสทุกครั้งที่เปิดแอป" : "ปิดอยู่"} />
        {hasPin && (
          <button className="row rowlink" onClick={() => setPinForm(true)}>
            <span className="ic"><Icon name="lock" size={17} color="var(--ink-soft)" /></span>
            <span style={{ flex: 1 }}>เปลี่ยน PIN</span>
            <Icon name="arrow" size={15} color="var(--ink-faint)" />
          </button>
        )}
      </div>

      <div className="sec"><h2>การแจ้งเตือน</h2></div>
      <PushNotificationToggle initialEnabled={notifyEnabled} />

      <div className="sec"><h2>เงิน</h2></div>
      <div className="card list">
        <button className="row rowlink" onClick={() => setBudgetForm(true)}>
          <span className="ic"><Icon name="chart" size={17} color="var(--ink-soft)" /></span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="row-t">งบประมาณรายเดือน</span>
            <span className="row-s">{Object.keys(budgets).length} หมวด · รวม <Money value={budgetTotal} /></span>
          </span>
          <Icon name="arrow" size={15} color="var(--ink-faint)" />
        </button>
        {incomeList.map((i) => (
          <button key={i.id} className="row rowlink" onClick={() => setIncomeForm(i)}>
            <span className="ic"><Icon name="money" size={17} color="var(--ink-soft)" /></span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span className="row-t">{i.name}</span>
              <span className="row-s"><Money value={i.amount} /> · ทุกวันที่ {i.dayOfMonth}</span>
            </span>
            <Icon name="arrow" size={15} color="var(--ink-faint)" />
          </button>
        ))}
        <button className="row rowlink" onClick={() => setIncomeForm("new")}>
          <span className="ic"><Icon name="plus" size={17} color="var(--ink-soft)" /></span>
          <span style={{ flex: 1 }}>เพิ่มรายรับประจำ</span>
        </button>
      </div>

      <div className="sec"><h2>ข้อมูล</h2></div>
      <DataSection />

      {pinForm && <PinSetupForm onClose={() => setPinForm(false)} />}
      {budgetForm && <BudgetForm initial={budgets} onClose={() => setBudgetForm(false)} />}
      {incomeForm === "new" && <IncomeForm accounts={accounts} onClose={() => setIncomeForm(null)} />}
      {incomeForm && incomeForm !== "new" && <IncomeForm initial={incomeForm} accounts={accounts} onClose={() => setIncomeForm(null)} />}
    </>
  );
}
