// src/app/layout.tsx // COMPLETE FILE REPLACEMENT

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './context/ThemeContext'; // Adjust path if needed
import { PromptProvider } from './context/PromptContext'; // Adjust path if needed

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prompt Builder - promptsreasy.ai', // Updated title example
  description: 'The easy way to build, manage, and refine your AI prompts.', // Updated description
};

// --- Inner Client Component to host Providers ---
// This is necessary because PromptProvider and ThemeProvider use client-side hooks
function AppClientProviders({ children }: { children: React.ReactNode }) {
  'use client'; // Mark this wrapper as a Client Component

  // The ThemeProvider's useEffect will handle adding 'light'/'dark' to document.documentElement
  // The PromptProvider provides context for the rest of the app
  return (
    <ThemeProvider>
      <PromptProvider>{children}</PromptProvider>
    </ThemeProvider>
  );
}
// --- End Inner Client Component ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The suppressHydrationWarning is important for the <html> tag
    // because the ThemeProvider might change its class on the client
    // causing a mismatch with the server-rendered HTML.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-150`}
      >
        {/*
          AppClientProviders wraps the children (your pages).
          ThemeProvider will apply 'light' or 'dark' class to document.documentElement.
          PromptProvider makes the prompt context available to all pages.
        */}
        <AppClientProviders>{children}</AppClientProviders>
      </body>
    </html>
  );
}
