import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('crypto_edu_theme');
    // Default to light theme as requested!
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('crypto_edu_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Beautiful animated theme switch pill
 */
export function ThemeToggle({ className = '', showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
        isDark
          ? 'bg-slate-900 border-slate-700/80 text-amber-300 hover:border-slate-600 shadow-inner'
          : 'bg-slate-100 border-slate-300/80 text-blue-600 hover:border-slate-400 shadow-sm'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center w-5 h-5 rounded-full transition-transform">
        {isDark ? (
          <Moon className="w-4 h-4 text-cyan-300 animate-in spin-in-180 duration-200" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-180 duration-200" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold pr-1 select-none">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
