// Serves the FCM service worker. We handle the raw 'push' event ourselves rather
// than initializing the firebase-messaging-compat SDK here — that SDK registers
// its own internal 'push' listener (and onBackgroundMessage adds a second one on
// top), so a single push would call showNotification() multiple times per token.
// One manual listener is the single source of truth (pattern from couples-app).
export async function GET() {
  const js = `
self.addEventListener('push', (e) => {
  let title = 'Repeat Calories';
  let body = 'You have a new update';
  let url = '/menu';
  try {
    const payload = e.data && e.data.json();
    if (payload?.notification) {
      title = payload.notification.title || title;
      body = payload.notification.body || body;
    } else if (payload?.data) {
      title = payload.data.title || title;
      body = payload.data.body || body;
    }
    url = payload?.fcmOptions?.link || payload?.data?.link || url;
  } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      requireInteraction: false,
      tag: 'repeat-calories-notification',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url ?? '/menu'));
});
`

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache',
    },
  })
}
