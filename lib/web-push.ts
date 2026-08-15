import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEcROGAlhIRQoDRls8OLvWyBOCHOp4-bgOIigzPrBl1KuTq70aL9e68KRGF_RTrPhC2olLKQ8p54hzDGUPLTXN4';
const privateKey = process.env.VAPID_PRIVATE_KEY || '2QsUyuleFFbv_MmpJ46T6sW7wUX224xLyX-3_2hUJuc';
const subject = process.env.VAPID_SUBJECT || 'mailto:support@dailyforest.app';

try {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} catch (err) {
  console.error('Error configuring web-push VAPID details:', err);
}

export function getPublicVapidKey(): string {
  return publicKey;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    calendarId?: string;
    taskId?: string;
    [key: string]: unknown;
  };
}

export async function sendWebPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const pushPayloadString = JSON.stringify({
      title: payload.title,
      message: payload.body,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      data: payload.data || {},
    });

    const response = await webpush.sendNotification(pushSubscription, pushPayloadString);
    return { success: true, statusCode: response.statusCode };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    console.error('Failed to send web push notification:', err);
    return {
      success: false,
      statusCode: err.statusCode,
      error: err.message || 'Unknown push error',
    };
  }
}
