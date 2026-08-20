import { useState, useEffect, useCallback } from 'react';

export type LocationStepStatus =
  | 'CHECKING'
  | 'READY'             // Both Phone GPS is ON and SendResQPls is ALLOWED -> Continue
  | 'GPS_OFF'           // Phone Location / GPS is turned OFF -> Open Location Settings
  | 'PERMISSION_DENIED' // SendResQPls app permission is NOT allowed -> Open App Settings
  | 'PROMPT';           // Permission not yet requested

export interface LocationCheckerResult {
  isLocationOn: boolean | null; // true if READY, false if GPS_OFF or PERMISSION_DENIED
  status: LocationStepStatus;
  isGpsOn: boolean | null;
  isPermissionGranted: boolean | null;
  checking: boolean;
  recheckLocation: () => Promise<boolean>;
  openLocationSettings: () => void;
  openAppSettings: () => void;
}

/**
 * Open Phone System Location Settings (GPS toggle)
 */
export function openLocationSettings() {
  try {
    // Android intent for Location settings
    window.location.href = 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end';
  } catch {
    try {
      window.open('geo:0,0', '_system');
    } catch {
      // Fallback
    }
  }
}

/**
 * Open App / Browser Permission Settings for SendResQPls
 */
export function openAppSettings() {
  try {
    window.open('app-settings:', '_system');
  } catch {
    try {
      window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=' + (window.location.hostname || 'com.sendresqpls.app') + ';end';
    } catch {
      // Fallback
    }
  }
}

export function useLocationChecker(): LocationCheckerResult {
  const [status, setStatus] = useState<LocationStepStatus>('CHECKING');
  const [isLocationOn, setIsLocationOn] = useState<boolean | null>(null);
  const [isGpsOn, setIsGpsOn] = useState<boolean | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(false);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setStatus('GPS_OFF');
      setIsLocationOn(false);
      setIsGpsOn(false);
      setIsPermissionGranted(false);
      return false;
    }

    setChecking(true);

    let permState: PermissionState | null = null;

    // ── Step 1: Check Permissions API ──
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        permState = perm.state;

        if (perm.state === 'denied') {
          // SendResQPls is explicitly NOT allowed -> Open App Settings
          setStatus('PERMISSION_DENIED');
          setIsPermissionGranted(false);
          setIsLocationOn(false);
          setChecking(false);
          return false;
        }
      }
    } catch {
      // Permissions API unavailable on some platforms, continue to probe
    }

    // ── Step 2: Probe Hardware / GPS availability ──
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success: Phone Location is ON and SendResQPls is ALLOWED -> Continue
          setStatus('READY');
          setIsLocationOn(true);
          setIsGpsOn(true);
          setIsPermissionGranted(true);
          setChecking(false);
          resolve(true);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            // Permission not granted -> Open App Settings
            setStatus('PERMISSION_DENIED');
            setIsPermissionGranted(false);
            setIsLocationOn(false);
            setChecking(false);
            resolve(false);
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            // Phone GPS is OFF -> Open Location Settings
            setStatus('GPS_OFF');
            setIsGpsOn(false);
            setIsPermissionGranted(permState === 'granted');
            setIsLocationOn(false);
            setChecking(false);
            resolve(false);
          } else if (err.code === err.TIMEOUT) {
            // Satellite fix timeout
            if (permState === 'granted') {
              // Permission is allowed, GPS hardware might be slow or off
              setStatus('GPS_OFF');
              setIsGpsOn(false);
              setIsPermissionGranted(true);
            } else {
              setStatus('GPS_OFF');
              setIsGpsOn(false);
            }
            setIsLocationOn(false);
            setChecking(false);
            resolve(false);
          } else {
            setStatus('GPS_OFF');
            setIsLocationOn(false);
            setChecking(false);
            resolve(false);
          }
        },
        { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
      );
    });
  }, []);

  useEffect(() => {
    checkStatus();

    // Listen for permission changes in browser
    let permObj: PermissionStatus | null = null;
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(p => {
        permObj = p;
        p.onchange = () => {
          if (p.state === 'granted') {
            setIsPermissionGranted(true);
          } else if (p.state === 'denied') {
            setIsPermissionGranted(false);
            setStatus('PERMISSION_DENIED');
            setIsLocationOn(false);
          }
          checkStatus();
        };
      }).catch(() => {});
    }

    // Re-check whenever user returns from phone settings or app settings
    const handleFocus = () => {
      checkStatus();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat check every 4s
    const interval = setInterval(() => {
      checkStatus();
    }, 4000);

    return () => {
      if (permObj) permObj.onchange = null;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [checkStatus]);

  return {
    isLocationOn,
    status,
    isGpsOn,
    isPermissionGranted,
    checking,
    recheckLocation: checkStatus,
    openLocationSettings,
    openAppSettings,
  };
}

