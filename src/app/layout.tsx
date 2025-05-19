'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider, useTheme } from './context/ThemeContext'; // <-- Import ThemeProvider
import { useEffect, useState } from 'react'; // Import useEffect, useState

const inter = Inter({ subsets: ['latin'] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme(); // Get theme from context
  const [effectiveTheme, setEffectiveTheme] = useState('light'); // Default to light to avoid flash

  // This effect runs on the client to determine the actual theme class
  useEffect(() => {
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const currentEffectiveTheme =
      theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
    setEffectiveTheme(currentEffectiveTheme);

    // Also apply to documentElement directly for immediate effect AND for context's useEffect to work correctly
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(currentEffectiveTheme);
  }, [theme]); // Re-run when theme from context changes

  return (
    // Add suppressHydrationWarning to html tag
    // The class applied here might be 'light' initially by default, then updated by useEffect
    <html lang="en" className={effectiveTheme} suppressHydrationWarning>
      <body
        className={`${inter.className} bg-white dark:bg-gray-900 transition-colors duration-300`}
      >
        {' '}
        {/* Base bg for body */}
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}
