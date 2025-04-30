// src/app/components/ThemeToggle.tsx // COMPLETE NEW FILE
'use client';

import React from 'react';
import { useTheme } from '../context/ThemeContext';

// Example Icons (replace with actual SVGs or library icons)
const SunIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const MoonIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);
const SystemIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17.25v-2.86l.43-.43a.75.75 0 011.06 0l.43.43v2.86m-1.92 0h1.92M12 17.25v2.25m-4.125-2.25H3.75m16.5 0h-4.125M12 3.75a9 9 0 100 18 9 9 0 000-18zm0 0v3.75m0 10.5V21m-6.375-6.375H3.75m16.5 0h-1.875"
    />
  </svg>
); // Example: Settings/Cog

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getButtonTitle = () => {
    if (theme === 'light') return 'Switch to Dark Mode';
    if (theme === 'dark') return 'Switch to System Preference';
    return 'Switch to Light Mode';
  };

  return (
    <button
      onClick={cycleTheme}
      title={getButtonTitle()}
      // Basic styling - adjust as needed
      // Add dark mode styles for the button itself
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      aria-label={getButtonTitle()}
    >
      {theme === 'light' && <SunIcon />}
      {theme === 'dark' && <MoonIcon />}
      {theme === 'system' && <SystemIcon />}
    </button>
  );
}
