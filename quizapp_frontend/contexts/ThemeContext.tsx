"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // On mount: read from localStorage (persisted preference), default to dark
  useEffect(() => {
    const stored = localStorage.getItem('quizai-theme') as Theme | null;
    // Only honour a stored 'light' choice; everything else → dark
    const initial: Theme = stored === 'light' ? 'light' : 'dark';
    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
    // Persist the default so next load is instant
    if (!stored) localStorage.setItem('quizai-theme', 'dark');
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('quizai-theme', t);
  };

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
