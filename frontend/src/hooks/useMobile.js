import { useState, useEffect } from 'react';

function getBreaks() {
  if (typeof window === 'undefined')
    return { w: 1200, isMobile: false, isTablet: false, isDesktop: true };
  const w = window.innerWidth;
  return { w, isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024 };
}

export function useBreakpoint() {
  const [bp, setBp] = useState(getBreaks);
  useEffect(() => {
    const handler = () => setBp(getBreaks());
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  return bp;
}

// Backward-compatible — existing callers that pass 768 still work
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}
