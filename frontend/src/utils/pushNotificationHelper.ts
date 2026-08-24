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

// ── Pending route store ──────────────────────────────────────────────────────
// When the app is killed and the user taps a notification, Capacitor fires
// pushNotificationActionPerformed before React Router is ready. We store the
// intended route here and consume it once the router mounts.
let _pendingRoute: string | null = null;

export function setPendingRoute(path: string) {
  _pendingRoute = path;
}

/** Called by RouterAwareNotificationSetup on mount — consumes the route once. */
export function consumePendingRoute(): string | null {
  const r = _pendingRoute;
  _pendingRoute = null;
  return r;
}

// ── Router callback registry ─────────────────────────────────────────────────
// RouterAwareNotificationSetup (inside React Router) registers its navigate fn
// here so the push listener can trigger in-app navigation without a page reload.
let _navigate: ((path: string) => void) | null = null;

export function registerPushNavigate(fn: (path: string) => void) {
  _navigate = fn;
}

export function unregisterPushNavigate() {
  _navigate = null;
}

/** Navigate using React Router if mounted, otherwise store as pending route. */
function pushRoute(path: string) {
  if (_navigate) {
    _navigate(path);
  } else {
    // App not yet mounted (cold start) — store for deferred navigation
    setPendingRoute(path);
    // Fallback: if SPA hasn't loaded at all, use location.href
    if (!document.getElementById('root')?.hasChildNodes()) {
      window.location.href = path;
    }
  }
}

// ── Token save with retry ────────────────────────────────────────────────────
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

    // 2. Create high-importance notification channel for Android (enables heads-up banner & sound)
    try {
      await PushNotifications.createChannel({
        id: 'emergency_alerts',
        name: 'Emergency Alerts & Status Updates',
        description: 'Real-time emergency alerts and report status updates from MDRRMO',
        importance: 5, // 5 = IMPORTANCE_HIGH (Heads-Up Banner)
        visibility: 1, // 1 = VISIBILITY_PUBLIC
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#EF4444',
      });
      console.log('[Push] ✅ Android notification channel emergency_alerts registered');
    } catch (chErr: any) {
      console.warn('[Push] Notification channel creation skipped/error:', chErr?.message);
    }

    // 3. Register with FCM
    console.log('[Push] Registering with FCM...');
    await PushNotifications.register();

    // 4. Handle FCM token — save to backend with retry
    PushNotifications.addListener('registration', async (token) => {
      console.log(`[Push] ✅ FCM token received: ${token.value.slice(0, 20)}...`);
      await saveTokenToBackend(token.value);
    });

    // 5. Registration errors
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
    // Uses pushRoute() instead of window.location.href to keep React Router alive.
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification tapped:', action.notification?.title);
      const data = action.notification?.data || {};

      if (data.type === 'NEW_INCIDENT' && data.incidentId) {
        // Admin: go to the specific incident detail page
        pushRoute(`/requests/${data.incidentId}`);
      } else if (data.incidentId) {
        // Citizen: go to report history and automatically open Track Status modal
        pushRoute(`/mobile/history?incidentId=${data.incidentId}`);
      }
    });

    console.log('[Push] ✅ All listeners registered.');

  } catch (error: any) {
    console.error('[Push] ❌ Setup error:', error.message);
  }
}

