import { PushNotifications } from '@capacitor/push-notifications';
import { updateProfile } from '../api/client';
import { Capacitor } from '@capacitor/core';

// Custom event name used to broadcast incoming FCM notifications to the UI
export const FCM_FOREGROUND_EVENT = 'srq-push-foreground';

export interface FcmNotificationPayload {
  title: string;
  body: string;
  incidentId?: string;
  status?: string;
  type?: string;
}

export async function setupPushNotifications() {
  // Only execute on native platforms (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    console.log('[PushNotifications] Skipped - Not running on a native device.');
    return;
  }

  try {
    // 1. Check permissions
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotifications] Permission not granted.');
      return;
    }

    // 2. Register for push notifications
    await PushNotifications.register();

    // 3. Handle device registration token (sent by APNS/FCM)
    PushNotifications.addListener('registration', async (token) => {
      console.log('[PushNotifications] Token generated:', token.value);
      try {
        await updateProfile({ pushToken: token.value });
        console.log('[PushNotifications] Token successfully saved to backend.');
      } catch (err: any) {
        console.error('[PushNotifications] Failed to save token to backend:', err.message);
      }
    });

    // 4. Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[PushNotifications] Registration error:', error.error);
    });

    // 5. ── App is OPEN (foreground): dispatch a custom event so the UI shows a banner ──
    // Android does NOT auto-show a heads-up notification when the app is in foreground.
    // We fire a CustomEvent so MobileHome (or any screen) can catch it and show a banner.
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Foreground notification:', notification);
      const payload: FcmNotificationPayload = {
        title: notification.title || 'SendResqPls',
        body: notification.body || '',
        incidentId: notification.data?.incidentId,
        status: notification.data?.status,
        type: notification.data?.type,
      };
      window.dispatchEvent(
        new CustomEvent(FCM_FOREGROUND_EVENT, { detail: payload })
      );
    });

    // 6. ── User TAPS notification from status bar (app was background/closed) ──
    // Navigate them to the right screen based on the notification data.
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[PushNotifications] Tapped:', action);
      const data = action.notification?.data || {};

      if (data.type === 'NEW_INCIDENT' && data.incidentId) {
        // Admin tapped a new-report notification → open that request
        window.location.href = `/requests/${data.incidentId}`;
      } else if (data.incidentId) {
        // Citizen tapped a status-update notification → show history
        window.location.href = '/mobile/history';
      }
    });

  } catch (error: any) {
    console.error('[PushNotifications] Setup error:', error.message);
  }
}
