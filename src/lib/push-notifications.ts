'use server';

import webpush from 'web-push';

/**
 * Kunci VAPID harus memiliki panjang yang tepat.
 * Public key: 65 bytes (87-88 karakter Base64URL).
 * Private key: 32 bytes (43 karakter Base64URL).
 */
const publicVapidKey = 'BAn-q3Y6P3lK8JpP6k-tG9-mS9L-nO9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9-O9';
const privateVapidKey = 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V';

webpush.setVapidDetails(
  'mailto:hello@itsjason.my.id',
  publicVapidKey,
  privateVapidKey
);

export async function sendAdminNotification(subscriptions: any[], payload: { title: string; body: string }) {
  const notifications = subscriptions.map(sub => {
    if (!sub.subscription) return Promise.resolve();
    return webpush.sendNotification(
      sub.subscription,
      JSON.stringify(payload)
    ).catch(err => {
      console.error('Error sending push notification', err);
    });
  });

  await Promise.all(notifications);
}

export async function getVapidPublicKey() {
  return publicVapidKey;
}
