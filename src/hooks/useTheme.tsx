import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeCtx {
  primaryColor: string;
  isDark: boolean;
  setPrimaryColor: (c: string) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx>({
  primaryColor: '#00E5FF',
  isDark: true,
  setPrimaryColor: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [primaryColor, setPrimary] = useState(
    () => localStorage.getItem('nk_color') ?? '#00E5FF'
  );
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('nk_theme') !== 'light'
  );

  // Aplicar cor via CSS var — atualiza TUDO que usa var(--neon-color)
  useEffect(() => {
    const r = parseInt(primaryColor.slice(1, 3), 16);
    const g = parseInt(primaryColor.slice(3, 5), 16);
    const b = parseInt(primaryColor.slice(5, 7), 16);
    document.documentElement.style.setProperty('--neon-color', primaryColor);
    document.documentElement.style.setProperty('--neon-rgb', `${r}, ${g}, ${b}`);
    localStorage.setItem('nk_color', primaryColor);
  }, [primaryColor]);

  // Aplicar dark/light
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
    localStorage.setItem('nk_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Ctx.Provider value={{
      primaryColor,
      isDark,
      setPrimaryColor: (c) => setPrimary(c),
      toggleTheme: () => setIsDark(d => !d),
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTheme = () => useContext(Ctx);
