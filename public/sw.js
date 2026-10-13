// Service worker for Web Push (no offline caching — see HANDOFF step 10 note).
self.addEventListener("push", (event) => {
  let data = { title: "KhunOwl", body: "มีการแจ้งเตือนใหม่", url: "/notifications" };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }
  const hasAck = Array.isArray(data.ackIds) && data.ackIds.length > 0;
  const actions = [{ action: "open", title: "เปิดดู" }];
  if (hasAck) actions.push({ action: "ack", title: "ทำเครื่องหมายแล้ว" });
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data.tag,
        renotify: !!data.tag,
        actions,
        data: { url: data.url || "/notifications", ackIds: data.ackIds || [] },
      }),
      typeof data.badge === "number" && self.navigator.setAppBadge
        ? self.navigator.setAppBadge(data.badge).catch(() => {})
        : Promise.resolve(),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url, ackIds } = event.notification.data || {};
  const target = url || "/notifications";

  if (event.action === "ack" && ackIds && ackIds.length) {
    event.waitUntil(
      fetch("/api/notifications/ack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ids: ackIds }),
      })
        .then((res) => {
          // A signed-out session is redirected to /login (200 HTML) — that is not a successful ack.
          if (res.ok && !res.redirected && self.navigator.clearAppBadge) return self.navigator.clearAppBadge();
        })
        .catch(() => {}),
    );
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
