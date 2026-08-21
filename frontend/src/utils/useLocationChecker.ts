import { useState, useEffect, useCallback } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';

export interface LocationAccuracyPluginInterface {
  enableLocation(): Promise<{ enabled: boolean; error?: string }>;
}

const LocationAccuracy = registerPlugin<LocationAccuracyPluginInterface>('LocationAccuracy');

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
  /** True while requestLocation() is actively probing — use to show a spinner on the button */
  requesting: boolean;
  /** Re-probes the current location status silently (no browser dialog) */
  recheckLocation: () => Promise<boolean>;
  /** Two-phase native location probe (Google Maps style). Phase 1: network. Phase 2: GPS. Only redirects to settings if PERMISSION_DENIED. */
  requestLocation: () => Promise<boolean>;
  /** Only needed when status === 'PERMISSION_DENIED' — sends user to OS app settings to manually unblock */
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
  const [requesting, setRequesting] = useState<boolean>(false);

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

  /**
   * One-tap native location probe & resolution.
   *
   * On Native Android (Capacitor):
   *   Calls Google Play Services SettingsClient to display the exact native system dialog:
   *   "To continue, your device will need to use Location Accuracy" -> [Turn on]
   *   When accepted, Android turns on GPS immediately in the OS and resolves coordinates.
   *
   * On Web / Browser fallback:
   *   Uses standard two-phase probe (network low-accuracy followed by high-accuracy GPS).
   */
  const requestLocation = useCallback(async (): Promise<boolean> => {
    setRequesting(true);

    // ── Native Android: Trigger Google Play Services Location Accuracy Dialog ──
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        const resultPromise = LocationAccuracy.enableLocation();
        const timeoutPromise = new Promise<{ enabled: boolean }>((res) =>
          setTimeout(() => res({ enabled: false }), 12000)
        );
        const result = await Promise.race([resultPromise, timeoutPromise]);

        if (result?.enabled) {
          // User tapped "Turn on" on the Google Play Services Location Accuracy system dialog!
          // Probe coordinates with high accuracy
          return new Promise<boolean>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                setStatus('READY');
                setIsLocationOn(true);
                setIsGpsOn(true);
                setIsPermissionGranted(true);
                setRequesting(false);
                resolve(true);
              },
              () => {
                // Short wait if GPS hardware is initializing
                setTimeout(() => {
                  navigator.geolocation.getCurrentPosition(
                    () => {
                      setStatus('READY');
                      setIsLocationOn(true);
                      setIsGpsOn(true);
                      setIsPermissionGranted(true);
                      setRequesting(false);
                      resolve(true);
                    },
                    () => {
                      setStatus('READY');
                      setIsLocationOn(true);
                      setIsGpsOn(true);
                      setIsPermissionGranted(true);
                      setRequesting(false);
                      resolve(true);
                    },
                    { timeout: 5000, enableHighAccuracy: true }
                  );
                }, 400);
              },
              { timeout: 5000, enableHighAccuracy: true }
            );
          });
        } else {
          // User clicked "No thanks" / rejected the system dialog
          setStatus('GPS_OFF');
          setIsLocationOn(false);
          setIsGpsOn(false);
          setRequesting(false);
          return false;
        }
      } catch (nativeErr) {
        console.warn('[LocationAccuracy] Native prompt error or rejected:', nativeErr);
        setStatus('GPS_OFF');
        setIsLocationOn(false);
        setIsGpsOn(false);
        setRequesting(false);
        return false;
      }
    }

    // ── Standard Web / Browser Fallback (Two-Phase Probe) ──
    if (!navigator.geolocation) {
      setStatus('GPS_OFF');
      setIsLocationOn(false);
      setRequesting(false);
      return false;
    }

    // Promisified wrapper
    const probe = (options: PositionOptions): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      );

    try {
      // ── Phase 1: network-assisted (lower accuracy, allows cached & cell/wifi) ──
      try {
        await probe({ timeout: 10000, maximumAge: 30000, enableHighAccuracy: false });
        setStatus('READY');
        setIsLocationOn(true);
        setIsGpsOn(true);
        setIsPermissionGranted(true);
        setRequesting(false);
        return true;
      } catch (err1: any) {
        if (err1.code === 1 /* PERMISSION_DENIED */) {
          // App permission explicitly blocked — stop, user must go to settings
          setStatus('PERMISSION_DENIED');
          setIsPermissionGranted(false);
          setIsLocationOn(false);
          setRequesting(false);
          return false;
        }
        // POSITION_UNAVAILABLE or TIMEOUT → fall through to Phase 2
      }

      // ── Phase 2: GPS (high accuracy) ──
      try {
        await probe({ timeout: 12000, maximumAge: 0, enableHighAccuracy: true });
        setStatus('READY');
        setIsLocationOn(true);
        setIsGpsOn(true);
        setIsPermissionGranted(true);
        setRequesting(false);
        return true;
      } catch (err2: any) {
        if (err2.code === 1 /* PERMISSION_DENIED */) {
          setStatus('PERMISSION_DENIED');
          setIsPermissionGranted(false);
          setIsLocationOn(false);
        } else {
          // GPS still unavailable after both phases
          setStatus('GPS_OFF');
          setIsGpsOn(false);
          setIsLocationOn(false);
        }
        setRequesting(false);
        return false;
      }
    } catch {
      setStatus('GPS_OFF');
      setIsLocationOn(false);
      setRequesting(false);
      return false;
    }
  }, []);

  return {
    isLocationOn,
    status,
    isGpsOn,
    isPermissionGranted,
    checking,
    requesting,
    recheckLocation: checkStatus,
    requestLocation,
    openLocationSettings,
    openAppSettings,
  };
}

