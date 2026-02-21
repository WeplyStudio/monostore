/**
 * Service Worker for Web Push Notifications.
 */

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'https://placehold.co/192x192/2563eb/white?text=M',
      badge: 'https://placehold.co/96x96/2563eb/white?text=M',
      vibrate: [100, 50, 100],
      data: {
        url: '/admin'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
