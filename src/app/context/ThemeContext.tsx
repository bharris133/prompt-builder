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
  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (newTheme: Theme) => {
      let useEffectiveTheme =
        newTheme === 'system'
          ? systemPrefersDark.matches
            ? 'dark'
            : 'light'
          : newTheme;

      root.classList.remove('light', 'dark');
      root.classList.add(useEffectiveTheme);
      console.log(
        `[Theme] Applied theme: ${useEffectiveTheme} (Chosen: ${newTheme})`
      );
    };

    // Listener for system theme changes
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme('system'); // Re-apply based on new system preference
      }
    };

    // Initial application
    applyTheme(theme);

    // Add listener
    systemPrefersDark.addEventListener('change', handleSystemChange);

    // Cleanup listener
    return () => {
      systemPrefersDark.removeEventListener('change', handleSystemChange);
    };
  }, [theme]); // Re-run only when the selected theme ('light', 'dark', 'system') changes

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
