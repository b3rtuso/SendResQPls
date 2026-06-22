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

/** Save push token to backend with up to 3 retries */
async function saveTokenToBackend(token: string, attempt = 1): Promise<void> {
  try {
    await updateProfile({ pushToken: token });
    console.log(`✅ [Push] Token saved to backend (attempt ${attempt})`);
  } catch (err: any) {
    if (attempt < 3) {
      const delay = attempt * 1500; // 1.5s, 3s
      console.warn(`⚠️ [Push] Token save failed, retrying in ${delay}ms... (${err.message})`);
      await new Promise(r => setTimeout(r, delay));
      return saveTokenToBackend(token, attempt + 1);
    }
    console.error(`❌ [Push] Token save failed after 3 attempts: ${err.message}`);
  }
}

export async function setupPushNotifications(): Promise<void> {
  // Only execute on native platforms (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Skipped — not running on a native device.');
    return;
  }

  try {
    // Remove all previous listeners first to prevent duplicates on re-login
    await PushNotifications.removeAllListeners();

    // 1. Check permissions
    let permStatus = await PushNotifications.checkPermissions();
    console.log(`[Push] Permission status: ${permStatus.receive}`);

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
      console.log(`[Push] After request: ${permStatus.receive}`);
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[Push] ❌ Permission not granted — user will not receive notifications.');
      return;
    }

    // 2. Register with FCM
    console.log('[Push] Registering with FCM...');
    await PushNotifications.register();

    // 3. Handle FCM token — save to backend with retry
    PushNotifications.addListener('registration', async (token) => {
      console.log(`[Push] ✅ FCM token received: ${token.value.slice(0, 20)}...`);
      await saveTokenToBackend(token.value);
    });

    // 4. Registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] ❌ Registration error:', error.error);
    });

    // 5. App is OPEN (foreground) — dispatch custom event so UI shows a banner
    // Android does NOT auto-show a heads-up notification in foreground.
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Foreground notification received:', notification.title);
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

    // 6. User TAPS notification from status bar (app was background/closed)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification tapped:', action.notification?.title);
      const data = action.notification?.data || {};

      if (data.type === 'NEW_INCIDENT' && data.incidentId) {
        window.location.href = `/requests/${data.incidentId}`;
      } else if (data.incidentId) {
        window.location.href = '/mobile/history';
      }
    });

    console.log('[Push] ✅ All listeners registered.');

  } catch (error: any) {
    console.error('[Push] ❌ Setup error:', error.message);
  }
}
