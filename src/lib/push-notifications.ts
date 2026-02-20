
'use server';

import webpush from 'web-push';

// Ganti dengan kunci VAPID Anda sendiri untuk produksi
const publicVapidKey = 'BEp_6_R-L2Xy4j6P3K5U5j_G0p7fX_oW4gY_eH2j1k2m3n4o5p6q7r8s9t0u1v2w3x4y5z';
const privateVapidKey = 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V';

webpush.setVapidDetails(
  'mailto:hello@itsjason.my.id',
  publicVapidKey,
  privateVapidKey
);

export async function sendAdminNotification(subscriptions: any[], payload: { title: string; body: string }) {
  const notifications = subscriptions.map(sub => {
    return webpush.sendNotification(
      sub.subscription,
      JSON.stringify(payload)
    ).catch(err => {
      console.error('Error sending push notification', err);
      // Anda mungkin ingin menghapus subscription yang tidak valid dari DB di sini
    });
  });

  await Promise.all(notifications);
}

export async function getVapidPublicKey() {
  return publicVapidKey;
}
