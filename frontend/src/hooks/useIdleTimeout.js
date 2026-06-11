import { useEffect, useRef, useState, useCallback } from 'react';

const TIMEOUT_MS = 15 * 60 * 1000;  // 15 minutes idle → logout
const WARNING_MS = 14 * 60 * 1000;  // show warning at 14 min (60s before)

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];

export function useIdleTimeout(onTimeout) {
  const logoutTimer  = useRef(null);
  const warningTimer = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  const reset = useCallback(() => {
    setShowWarning(false);
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(() => setShowWarning(true), WARNING_MS);
    logoutTimer.current  = setTimeout(onTimeout, TIMEOUT_MS);
  }, [onTimeout]);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [reset]);

  return { showWarning, extendSession: reset };
}
