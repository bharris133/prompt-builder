// src/app/components/AuthDisplay.tsx // COMPLETE NEW FILE
'use client';

import React, { useState, FormEvent } from 'react';
import { usePrompt } from '../hooks/usePrompt';
export function AuthDisplay() {
  const { user, authLoading, signUpUser, signInUser, signOutUser } =
    usePrompt();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false); // Toggle between Sign In / Sign Up view

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSigningUp) {
      await signUpUser({ email, password });
    } else {
      await signInUser({ email, password });
    }
    // Clear form potentially on success? Depends on UX preference
    // setEmail('');
    // setPassword('');
  };

  if (authLoading) {
    // Simple loading indicator for auth status check
    return (
      <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
        Loading User...
      </div>
    );
  }

  if (user) {
    // User is logged in
    return (
      <div className="flex items-center space-x-2 p-2">
        <span
          className="text-sm text-gray-700 dark:text-gray-300 truncate"
          title={user.email}
        >
          {user.email}
        </span>
        <button
          onClick={signOutUser}
          className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded transition"
          title="Sign Out"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // User is logged out - Show Sign In / Sign Up Form
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">
        {isSigningUp ? 'Create Account' : 'Sign In'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
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
    </div>
  );
}
