import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeCtx {
  primaryColor: string;
  isDark: boolean;
  setPrimaryColor: (c: string) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx>({ primaryColor: '#00E5FF', isDark: true, setPrimaryColor: () => {}, toggleTheme: () => {} });

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r}, ${g}, ${b}`;
}

function applyColor(color: string) {
  const root = document.documentElement;
  root.style.setProperty('--neon-color', color);
  try { root.style.setProperty('--neon-rgb', hexToRgb(color)); } catch {}
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('light-mode', !dark);
  document.documentElement.classList.toggle('dark-mode', dark);
  // Forçar background do body
  document.body.style.backgroundColor = dark ? 'var(--bg)' : 'var(--bg)';
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [primaryColor, setPrimary] = useState(() => {
    const saved = localStorage.getItem('nk_color') ?? '#00E5FF';
    applyColor(saved);
    return saved;
  });
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('nk_theme') !== 'light';
    applyTheme(saved);
    return saved;
  });

  const setPrimaryColor = useCallback((c: string) => {
    applyColor(c);
    localStorage.setItem('nk_color', c);
    setPrimary(c);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(d => {
      const next = !d;
      applyTheme(next);
      localStorage.setItem('nk_theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  // Re-aplicar ao montar (garante que SSR/HMR não resetem)
  useEffect(() => { applyColor(primaryColor); }, [primaryColor]);
  useEffect(() => { applyTheme(isDark); }, [isDark]);

  return <Ctx.Provider value={{ primaryColor, isDark, setPrimaryColor, toggleTheme }}>{children}</Ctx.Provider>;
};

export const useTheme = () => useContext(Ctx);
