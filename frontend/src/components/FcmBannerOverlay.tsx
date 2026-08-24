import { useEffect } from "react";
import { FCM_FOREGROUND_EVENT } from "../utils/pushNotificationHelper";
import type { FcmNotificationPayload } from "../utils/pushNotificationHelper";
import { useMobileToast } from "../contexts/MobileToastContext";
import type { MobileToastType, MobileToastPriority } from "../contexts/MobileToastContext";

/**
 * FcmBannerOverlay — now a thin event bridge only.
 * Listens for FCM foreground events and pushes them into the
 * centralized MobileToastContext queue so they appear as
 * Facebook-style notification cards via MobileToastProvider.
 *
 * Renders nothing — must be mounted inside <MobileToastProvider>.
 */

const STATUS_TYPE: Record<string, MobileToastType> = {
  DISPATCHED:   'incident',
  RESOLVED:     'success',
  REVIEWING:    'warning',
  REJECTED:     'error',
  PENDING:      'info',
  NEW_INCIDENT: 'incident',
};

const STATUS_PRIORITY: Record<string, MobileToastPriority> = {
  NEW_INCIDENT: 'critical',
  DISPATCHED:   'important',
  REJECTED:     'important',
  REVIEWING:    'normal',
  RESOLVED:     'normal',
  PENDING:      'normal',
};

export default function FcmBannerOverlay() {
  const { push } = useMobileToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<FcmNotificationPayload>).detail;

      const statusKey = payload.status ?? payload.type ?? '';
      const type: MobileToastType     = STATUS_TYPE[statusKey]     ?? 'incident';
      const priority: MobileToastPriority = STATUS_PRIORITY[statusKey] ?? 'normal';

      // Build navigateTo
      let navigateTo: string | undefined;
      if (payload.type === 'NEW_INCIDENT' && payload.incidentId) {
        // Admin-facing incidents don't apply here; mobile users go to history
        navigateTo = '/mobile/history';
      } else if (payload.incidentId) {
        navigateTo = `/mobile/history?incidentId=${payload.incidentId}`;
      }

      push({
        title:      payload.title  || 'Emergency Update',
        message:    payload.body   || undefined,
        type,
        priority,
        status:     payload.status ?? payload.type,
        incidentId: payload.incidentId,
        navigateTo,
        // Critical (NEW_INCIDENT) never auto-dismisses; others use context default
        duration:   priority === 'critical' ? 0 : undefined,
      });
    };

    window.addEventListener(FCM_FOREGROUND_EVENT, handler);
    return () => window.removeEventListener(FCM_FOREGROUND_EVENT, handler);
  }, [push]);

  // Renders nothing — visuals handled by MobileToastProvider
  return null;
}
