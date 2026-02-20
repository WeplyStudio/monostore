'use server';

/**
 * @fileOverview Placeholder for notifications logic.
 * Web Push has been disabled to prevent VAPID key errors.
 */

export async function sendAdminNotification(subscriptions: any[], payload: { title: string; body: string }) {
  // Web Push disabled. Logic moved to internal UI notifications.
  console.log('Push notification suppressed:', payload.title);
}

export async function getVapidPublicKey() {
  return '';
}
