import { PushNotifications } from '@capacitor/push-notifications';
import { updateProfile } from '../api/client';
import { Capacitor } from '@capacitor/core';

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

    // 5. Handle notification received while app is running (foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Foreground notification received:', notification);
    });

    // 6. Handle action performed on notification (tapped by user)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[PushNotifications] Action performed:', action);
    });

  } catch (error: any) {
    console.error('[PushNotifications] Setup error:', error.message);
  }
}
