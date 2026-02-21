'use server';

import webpush from 'web-push';

/**
 * @fileOverview Server-side actions for Push Notifications using VAPID keys.
 */

const publicKey = 'BGhticg39ljdRxklpu9I0VnP082zrMzjFeDmGLb4v29lQsL5W0AOHCGMmBBt5koUSSgYOvy3j3wCgnnizjFLYY0';
const privateKey = 'JzHrEkA0_8toaUPoUmxQX2lSeeVSTGisSY7BwopsFao';

// Inisialisasi web-push dengan kredensial yang diberikan
webpush.setVapidDetails(
  'mailto:matchboxdevelopment@gmail.com',
  publicKey,
  privateKey
);

/**
 * Mengirim notifikasi push ke daftar langganan (subscriptions).
 */
export async function sendAdminNotification(subscriptions: any[], payload: { title: string; body: string }) {
  if (!subscriptions || subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
  });

  const promises = subscriptions.map(sub => 
    webpush.sendNotification(sub, pushPayload).catch(err => {
      console.error('Gagal mengirim push notification ke satu perangkat:', err.statusCode);
      // Di produksi, sub yang expired (410/404) sebaiknya dihapus dari DB
    })
  );

  await Promise.all(promises);
}

/**
 * Mengambil Public Key untuk proses registrasi di sisi client.
 */
export async function getVapidPublicKey() {
  return publicKey;
}
