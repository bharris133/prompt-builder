// src/app/components/UserDropdownMenu.tsx // COMPLETE NEW FILE
'use client';

import React, { useEffect, useRef } from 'react';
import { usePrompt } from '../hooks/usePrompt'; // Assuming all needed functions are in usePrompt
import Link from 'next/link'; // Import Next.js Link

interface UserDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void; // Function to close the dropdown
}

export function UserDropdownMenu({ isOpen, onClose }: UserDropdownMenuProps) {
  const {
    user,
    signOutUser,
    setIsApiKeyModalOpen,
    currentUserPlan,
    isSubscriptionActive,
    subscriptionStatus,
  } = usePrompt();
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

  // Handler to open Stripe Customer Portal
  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/create-stripe-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok || !data.url)
        throw new Error(data.error || 'Failed to open portal.');
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Could not open Stripe portal.');
    }
  };

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

  // Helper to format plan label
  function formatPlanLabel(planId: string | null | undefined) {
    if (!planId) return 'Free';
    return planId
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  // Try to get app_plan_id from user.subscription.metadata (Stripe 2025-04-30.basil style)
  let appPlanId: string | null = null;
  if (
    user &&
    (user as any).subscription &&
    (user as any).subscription.metadata &&
    (user as any).subscription.metadata.app_plan_id
  ) {
    appPlanId = (user as any).subscription.metadata.app_plan_id;
  }
  const planLabel = formatPlanLabel(appPlanId || currentUserPlan);
  const statusLabel = subscriptionStatus
    ? subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)
    : isSubscriptionActive
      ? 'Active'
      : 'Inactive';

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 py-2"
    >
      {/* Subscription Info */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Subscription
        </div>
        <div className="font-semibold text-gray-800 dark:text-gray-100">
          {planLabel}
        </div>
        <div
          className={`text-xs mt-0.5 ${statusLabel === 'Active' ? 'text-green-600 dark:text-green-400' : statusLabel === 'Trialing' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {statusLabel}
        </div>
      </div>
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
        <div>
          <Link href="/pricing" legacyBehavior>
            <a className="ml-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Pricing
            </a>
          </Link>
        </div>
        {/* Placeholder for future profile link */}
        {/* <button
                    // onClick={() => { console.log('Profile clicked'); onClose(); }}
                    disabled // Placeholder
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                    role="menuitem"
                    tabIndex={-1}
                >
                    Profile (soon)
                </button> */}
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
        {/* Show Manage Subscription if user has an active or trial subscription */}
        {isSubscriptionActive && (
          <button
            onClick={handleManageSubscription}
            className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded transition"
          >
            Manage Subscription
          </button>
        )}
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
