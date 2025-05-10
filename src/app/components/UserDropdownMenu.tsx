// src/app/components/UserDropdownMenu.tsx // COMPLETE NEW FILE
'use client';

import React, { useEffect, useRef } from 'react';
import { usePrompt } from '../hooks/usePrompt'; // Assuming all needed functions are in usePrompt

interface UserDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void; // Function to close the dropdown
}

export function UserDropdownMenu({ isOpen, onClose }: UserDropdownMenuProps) {
  const { user, signOutUser, setIsApiKeyModalOpen } = usePrompt();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose(); // Call the passed onClose function
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) {
    // Also check if user exists, though isOpen should handle it
    return null;
  }

  const handleSignOut = () => {
    signOutUser();
    onClose(); // Close dropdown after initiating sign out
  };

  const openApiKeyManagement = () => {
    setIsApiKeyModalOpen(true); // Use context function to open API Key modal
    onClose(); // Close user dropdown
  };

  return (
    <div
      ref={dropdownRef} // Attach ref here
      className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none z-30"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button" // This ID should be on the button that opens this dropdown
      tabIndex={-1}
    >
      <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
        <p className="font-medium text-gray-900 dark:text-white">
          Signed in as
        </p>
        <p className="truncate" title={user.email || ''}>
          {user.email || 'User'}
        </p>
      </div>
      <div role="none" className="py-1">
        <button
          onClick={openApiKeyManagement}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
          role="menuitem"
          tabIndex={-1}
        >
          Manage API Keys
        </button>
        {/* Placeholder for future settings link */}
        {/* <button
                    // onClick={() => { console.log('Settings clicked'); onClose(); }}
                    disabled // Placeholder
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                    role="menuitem"
                    tabIndex={-1}
                >
                    App Settings (soon)
                </button> */}
      </div>
      <div
        role="none"
        className="py-1 border-t border-gray-200 dark:border-gray-600"
      >
        <button
          onClick={handleSignOut}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
          role="menuitem"
          tabIndex={-1}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
