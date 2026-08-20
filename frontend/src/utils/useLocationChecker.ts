import { useState, useEffect, useCallback } from 'react';

export function useLocationChecker() {
  const [isLocationOn, setIsLocationOn] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(false);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setIsLocationOn(false);
      return false;
    }

    setChecking(true);

    // 1. Check permissions API if available
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') {
          setIsLocationOn(false);
          setChecking(false);
          return false;
        }
      }
    } catch {
      // Ignore and proceed to active test
    }

    // 2. Actively test GPS hardware availability
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocationOn(true);
          setChecking(false);
          resolve(true);
        },
        () => {
          // If permission denied or GPS hardware is disabled/unavailable
          setIsLocationOn(false);
          setChecking(false);
          resolve(false);
        },
        { timeout: 4500, maximumAge: 10000, enableHighAccuracy: false }
      );
    });
  }, []);

  useEffect(() => {
    checkStatus();

    // Listen to permission changes if supported
    let permObj: PermissionStatus | null = null;
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(p => {
        permObj = p;
        p.onchange = () => {
          checkStatus();
        };
      }).catch(() => {});
    }

    // Re-check whenever user returns from phone/browser settings
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

    // Heartbeat check every 6s
    const interval = setInterval(() => {
      checkStatus();
    }, 6000);

    return () => {
      if (permObj) permObj.onchange = null;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [checkStatus]);

  return { isLocationOn, checking, recheckLocation: checkStatus };
}
