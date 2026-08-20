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

    let permState: PermissionState | null = null;

    // 1. Check permissions API if available
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        permState = perm.state;
        if (perm.state === 'granted') {
          // Permission is explicitly granted in browser!
          setIsLocationOn(true);
          setChecking(false);
          return true;
        } else if (perm.state === 'denied') {
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
        (err) => {
          // If explicitly denied by user
          if (err.code === err.PERMISSION_DENIED) {
            setIsLocationOn(false);
            setChecking(false);
            resolve(false);
          } else if (permState === 'granted') {
            // Permission is granted, satellite fix might just take time
            setIsLocationOn(true);
            setChecking(false);
            resolve(true);
          } else {
            setIsLocationOn(false);
            setChecking(false);
            resolve(false);
          }
        },
        { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
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
        if (p.state === 'granted') {
          setIsLocationOn(true);
        } else if (p.state === 'denied') {
          setIsLocationOn(false);
        }
        p.onchange = () => {
          if (p.state === 'granted') {
            setIsLocationOn(true);
          } else if (p.state === 'denied') {
            setIsLocationOn(false);
          }
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

  return { isLocationOn, checking, recheckLocation: checkStatus };
}
