"use client";

import { useEffect, useState } from "react";
import { deletePushSubscription, savePushSubscription } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushNotificationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  }, []);

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
      {error && <div className="hint" style={{ color: "var(--neg)" }}>{error}</div>}
    </div>
  );
}
