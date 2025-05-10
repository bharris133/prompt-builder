// src/app/components/AuthModal.tsx // COMPLETE NEW FILE
'use client';

import React from 'react';
import { AuthDisplay } from './AuthDisplay'; // Import the form content

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signIn' | 'signUp';
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signIn',
}: AuthModalProps) {
  if (!isOpen) {
    return null;
  }

  const title = initialMode === 'signUp' ? 'Create Account' : 'Sign In';

  return (
    // Overlay
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose} // Close on overlay click
    >
      {/* Modal Container */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 relative" // max-w-sm is good for auth forms
        onClick={(e) => e.stopPropagation()} // Prevent overlay click inside modal
      >
        {/* Close Button (Top Right) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold"
          aria-label="Close Authentication Modal"
        >
          ×
        </button>

        {/* Modal Title */}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
          {title}
        </h2>

        {/* Authentication Form Content */}
        <AuthDisplay
          initialMode={initialMode}
          onAuthSuccess={() => {
            console.log('Auth success from modal, closing modal.');
            onClose(); // Close modal on successful authentication
          }}
        />
      </div>
    </div>
  );
}
