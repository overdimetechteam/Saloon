import { useEffect, useRef, useState, useCallback } from 'react';

const TIMEOUT_MS = 15 * 60 * 1000;  // 15 minutes idle → logout
const WARNING_MS = 14 * 60 * 1000;  // show warning at 14 min (60s before)

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];

export function useIdleTimeout(onTimeout) {
  const logoutTimer  = useRef(null);
  const warningTimer = useRef(null);
  const callbackRef  = useRef(onTimeout);
  const [showWarning, setShowWarning] = useState(false);

  // Keep the ref pointing at the latest callback without making reset depend on it.
  // This means re-renders (e.g. navigation) never recreate reset or re-run the effect.
  useEffect(() => { callbackRef.current = onTimeout; }, [onTimeout]);

  // Empty deps → stable reference, event listeners registered exactly once on mount.
  const reset = useCallback(() => {
    setShowWarning(false);
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(() => setShowWarning(true), WARNING_MS);
    logoutTimer.current  = setTimeout(() => callbackRef.current(), TIMEOUT_MS);
  }, []);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset(); // start the clock on mount
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [reset]);

  return { showWarning, extendSession: reset };
}
