'use server';

/**
 * @fileOverview Placeholder for notifications logic.
 * Web Push has been disabled to prevent VAPID key errors.
 * System now uses real-time internal notifications.
 */

export async function sendAdminNotification(subscriptions: any[], payload: { title: string; body: string }) {
  // Web Push disabled to avoid VAPID key issues. 
  // Real-time notifications are handled via Firestore listeners in the Admin UI.
  console.log('Notification triggered via internal system:', payload.title);
}

export async function getVapidPublicKey() {
  return '';
}
