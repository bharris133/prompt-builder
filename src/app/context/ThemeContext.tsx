// src/app/context/ThemeContext.tsx // COMPLETE NEW FILE
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useContext,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = 'promptBuilderTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize state, reading from localStorage or defaulting to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'system'; // Default for SSR/initial render
    }
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : 'system';
  });

  // Effect to apply the theme class and listen for system changes
  // src/app/context/ThemeContext.tsx // MODIFY THE useEffect

  // Effect to apply the theme class (mainly for 'system' changes now)
  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDarkMQ = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    // Function to reflect system preference if 'system' theme is chosen
    const applySystemPreference = () => {
      const effectiveSystemTheme = systemPrefersDarkMQ.matches
        ? 'dark'
        : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveSystemTheme);
      console.log(
        `[Theme System Listener] System changed. Applied class: ${effectiveSystemTheme}`
      );
    };

    // If current theme is 'system', apply based on current MQ and listen for changes
    if (theme === 'system') {
      applySystemPreference(); // Apply on initial load if 'system'
      systemPrefersDarkMQ.addEventListener('change', applySystemPreference);
    } else {
      // If 'light' or 'dark' is explicitly chosen, RootLayout's useEffect handles it.
      // We still ensure the correct class is on root based on the 'theme' state.
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      console.log(
        `[Theme Effect] Explicit theme chosen. Applied class: ${theme}`
      );
    }

    // Cleanup listener
    return () => {
      systemPrefersDarkMQ.removeEventListener('change', applySystemPreference);
    };
  }, [theme]); // Re-run when selected theme changes

  // Function to update theme state and localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        console.log(`[Theme] Saved theme preference: ${newTheme}`);
      } catch (error) {
        console.error('[Theme] Failed to save theme to localStorage:', error);
      }
    } else {
      console.warn(`[Theme] Invalid theme value provided: ${newTheme}`);
    }
  }, []);

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
