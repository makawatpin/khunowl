"use client";

import { useEffect, useState } from "react";
import { deletePushSubscription, savePushSubscription, saveNotifyLeadDays, sendTestPush } from "@/lib/actions/push";
import { LEAD_DAY_OPTIONS } from "@/lib/domain/notifications";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const LEAD_LABEL: Record<number, string> = { 7: "ล่วงหน้า 7 วัน", 3: "ล่วงหน้า 3 วัน", 1: "ล่วงหน้า 1 วัน", 0: "วันครบกำหนด" };

export function PushNotificationToggle({ initialEnabled, initialLeadDays }: { initialEnabled: boolean; initialLeadDays: number[] }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [leadDays, setLeadDays] = useState<number[]>(initialLeadDays);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // iOS only exposes Web Push to a web app that was added to the Home Screen.
    setNeedsInstall(isIOS && !standalone);
    setSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  }, []);

  const handleTest = async () => {
    setPending(true);
    setTestMsg(null);
    setError(null);
    const res = await sendTestPush();
    if (res.error) setError(res.error);
    else setTestMsg(`ส่งแล้ว ${res.sent}/${res.devices} อุปกรณ์ — รอสักครู่`);
    setPending(false);
  };

  const toggleLead = async (d: number) => {
    const next = leadDays.includes(d) ? leadDays.filter((x) => x !== d) : [...leadDays, d];
    setLeadDays(next);
    const res = await saveNotifyLeadDays(next);
    if (res.error) setError(res.error);
  };

  const handleEnable = async () => {
    setPending(true);
    setError(null);
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error("ยังไม่ได้ตั้งค่า VAPID key");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("ไม่ได้รับอนุญาตให้แจ้งเตือน");
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("สมัครรับการแจ้งเตือนไม่สำเร็จ");
      const res = await savePushSubscription({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
      if (res.error) throw new Error(res.error);
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปิดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  };

  const handleDisable = async () => {
    setPending(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      } else {
        await deletePushSubscription("");
      }
      setEnabled(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ปิดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  };

  if (needsInstall) {
    return (
      <div className="card card-pad">
        <div style={{ fontWeight: 600 }}>ติดตั้งแอปก่อนเปิดการแจ้งเตือน</div>
        <div className="row-s">บน iPhone/iPad: กดปุ่มแชร์ใน Safari แล้วเลือก &quot;เพิ่มไปยังหน้าจอโฮม&quot; จากนั้นเปิดแอปจากไอคอนและกลับมาที่หน้านี้</div>
      </div>
    );
  }

  if (!supported) {
    return <div className="hint">เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบพุช</div>;
  }

  return (
    <div className="card card-pad">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>การแจ้งเตือนบนเบราว์เซอร์นี้</div>
          <div className="row-s">สรุปรายการที่ถึงกำหนดทุกเช้า (08:00)</div>
        </div>
        <button className={"btn" + (enabled ? "" : " btn-primary")} disabled={pending} onClick={enabled ? handleDisable : handleEnable}>
          {pending ? "กำลังตั้งค่า…" : enabled ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือน"}
        </button>
      </div>
      {enabled && (
        <>
          <div className="row-s" style={{ marginTop: 12 }}>เตือนเมื่อ (เช้า 08:00)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {LEAD_DAY_OPTIONS.map((d) => (
              <button key={d} className={"btn" + (leadDays.includes(d) ? " btn-primary" : "")} aria-pressed={leadDays.includes(d)} onClick={() => toggleLead(d)}>
                {LEAD_LABEL[d]}
              </button>
            ))}
          </div>
          <div className="row-s" style={{ marginTop: 8 }}>บิลที่เลยกำหนดจะเตือนทุกเช้าจนกว่าจะทำเครื่องหมายแล้ว</div>
          <div style={{ marginTop: 12 }}>
            <button className="btn" disabled={pending} onClick={handleTest}>ส่งแจ้งเตือนทดสอบ</button>
          </div>
        </>
      )}
      {testMsg && <div className="hint">{testMsg}</div>}
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
    </div>
  );
}
