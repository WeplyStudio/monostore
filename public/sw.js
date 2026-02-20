self.addEventListener('push', function(event) {
  let data = { title: 'MonoStore', body: 'Ada aktivitas baru di toko Anda.' };
  try {
    data = event.data.json();
  } catch (e) {
    if (event.data) {
      data = { title: 'MonoStore', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'order-notification'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/admin')
  );
});
