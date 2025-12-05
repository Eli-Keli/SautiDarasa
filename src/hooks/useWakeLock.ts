import { useEffect, useState, useCallback } from 'react';

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

export const useWakeLock = (enabled: boolean = false) => {
  const [state, setState] = useState<WakeLockState>({
    isSupported: 'wakeLock' in navigator,
    isActive: false,
    error: null,
  });

  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Wake Lock API not supported' }));
      return;
    }

    try {
      const lock = await navigator.wakeLock.request('screen');
      setWakeLock(lock);
      setState((prev) => ({ ...prev, isActive: true, error: null }));

      console.log('[Wake Lock] Screen wake lock acquired');

      // Handle wake lock release
      lock.addEventListener('release', () => {
        console.log('[Wake Lock] Screen wake lock released');
        setState((prev) => ({ ...prev, isActive: false }));
        setWakeLock(null);
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Wake Lock] Failed to acquire wake lock:', error.message);
      setState((prev) => ({ ...prev, error: error.message, isActive: false }));
    }
  }, [state.isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        setState((prev) => ({ ...prev, isActive: false }));
        console.log('[Wake Lock] Manually released');
      } catch (err) {
        const error = err as Error;
        console.error('[Wake Lock] Failed to release wake lock:', error.message);
      }
    }
  }, [wakeLock]);

  // Auto-request when enabled
  useEffect(() => {
    if (enabled && state.isSupported && !wakeLock) {
      requestWakeLock();
    } else if (!enabled && wakeLock) {
      releaseWakeLock();
    }
  }, [enabled, state.isSupported, wakeLock, requestWakeLock, releaseWakeLock]);

  // Re-request on page visibility change
  useEffect(() => {
    if (!enabled || !state.isSupported) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        console.log('[Wake Lock] Page became visible, re-requesting wake lock');
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, state.isSupported, wakeLock, requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().catch((err) => {
          console.error('[Wake Lock] Cleanup error:', err);
        });
      }
    };
  }, [wakeLock]);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
  };
};
