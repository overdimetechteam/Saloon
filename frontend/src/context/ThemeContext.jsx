import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ isDark: false, toggle: () => {}, navPalette: null, setNavPalette: () => {}, setForcedLight: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false; // light by default
  });
  const [forcedLight, setForcedLight] = useState(false);
  const [navPalette, setNavPalette] = useState(null);

  useEffect(() => {
    const effective = forcedLight ? 'light' : (isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', effective);
    // Only persist when not forced — don't overwrite the user's real preference
    if (!forcedLight) localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark, forcedLight]);

  useEffect(() => {
    const root = document.documentElement;
    if (navPalette) {
      root.style.setProperty('--accent',     navPalette.main);
      root.style.setProperty('--accent-rgb', navPalette.rgb);
      root.style.setProperty('--accent-light', navPalette.light);
      root.style.setProperty('--accent-tl',  navPalette.textLight);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-rgb');
      root.style.removeProperty('--accent-light');
      root.style.removeProperty('--accent-tl');
    }
  }, [navPalette]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(v => !v), navPalette, setNavPalette, setForcedLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);