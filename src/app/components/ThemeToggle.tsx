// src/app/components/ThemeToggle.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { useTheme } from '../context/ThemeContext';

// Icons
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
// SystemIcon no longer needed for display

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // --- NEW: State to track if component has mounted ---
  const [isMounted, setIsMounted] = useState(false);

  // --- Effect to set mounted state ---
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- Helper function to get effective theme ONLY WHEN MOUNTED ---
  const getEffectiveTheme = () => {
    if (!isMounted) {
      // Return a default during SSR or before hydration
      // 'light' is often a safe default, or potentially read from a cookie if set server-side later
      return 'light';
    }
    // Now safe to access window
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    return theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
  };

  // Calculate effective theme after mount check
  const effectiveTheme = getEffectiveTheme();

  // --- Updated Cycle Logic (uses effectiveTheme) ---
  const cycleTheme = () => {
    // Toggle based on the *currently displayed* effective theme
    const nextTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme); // Set explicitly to light or dark
  };

  // --- Updated Title Logic (uses effectiveTheme) ---
  const getButtonTitle = () => {
    if (!isMounted) return 'Toggle theme'; // Default title before mount
    return effectiveTheme === 'light'
      ? 'Switch to Dark Mode'
      : 'Switch to Light Mode';
  };

  // --- Updated Icon Rendering (uses effectiveTheme) ---
  const renderIcon = () => {
    if (!isMounted) return null; // Don't render icon before mount
    return effectiveTheme === 'light' ? <SunIcon /> : <MoonIcon />;
  };

  // Render nothing or a placeholder until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="p-2 w-[36px] h-[36px]"></div> // Placeholder with same size as button
    );
  }

  // Render the actual button once mounted
  return (
    <button
      onClick={cycleTheme}
      title={getButtonTitle()}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      aria-label={getButtonTitle()}
    >
      {renderIcon()}
    </button>
  );
}
