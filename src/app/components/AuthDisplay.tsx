// src/app/components/AuthDisplay.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, FormEvent } from 'react';
import { usePrompt } from '../hooks/usePrompt'; // Assuming usePrompt provides auth functions

interface AuthDisplayProps {
  initialMode?: 'signIn' | 'signUp'; // Optional prop to set initial view
  onAuthSuccess?: () => void; // Optional: Callback on successful auth to close modal
}

export function AuthDisplay({
  initialMode = 'signIn',
  onAuthSuccess,
}: AuthDisplayProps) {
  const { authLoading, signUpUser, signInUser } = usePrompt();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(initialMode === 'signUp');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let result;
    if (isSigningUp) {
      result = await signUpUser({ email, password });
    } else {
      result = await signInUser({ email, password });
    }

    if (result && !result.error && result.data) {
      // Check for user/session in data
      // On successful sign-in, the onAuthStateChange listener in context will update UI
      // On successful sign-up, it might require email confirmation or auto-login
      if (onAuthSuccess) {
        onAuthSuccess(); // Call to close modal if provided
      }
    }
    // Error alerts are handled within signUpUser/signInUser context functions
  };

  // This component now only returns the form and its toggle
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      {' '}
      {/* Added slight padding */}
      <div>
        <label
          htmlFor="auth-email"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
        >
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="auth-password"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
        >
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={authLoading}
        className="w-full py-2 px-4 rounded text-sm font-semibold text-white transition duration-150 ease-in-out bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
      >
        {authLoading ? 'Processing...' : isSigningUp ? 'Sign Up' : 'Sign In'}
      </button>
      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {isSigningUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </form>
  );
}
