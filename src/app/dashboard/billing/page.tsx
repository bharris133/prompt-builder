// src/app/dashboard/billing/page.tsx // COMPLETE NEW FILE

'use client';

import React, { useEffect, useState, Suspense } from 'react'; // Added Suspense
import { useRouter, useSearchParams } from 'next/navigation'; // For App Router
import Link from 'next/link';
import { usePrompt } from '@/app/hooks/usePrompt'; // Adjust path if needed

// Inner component to handle Suspense for useSearchParams
function BillingStatusChecker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUserPrompts, fetchUserTemplates, fetchUserSettings } =
    usePrompt(); // Get data fetchers from context

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState(
    'Verifying your subscription, please wait...'
  );
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setMessage('Missing checkout session ID. Cannot verify subscription.');
      console.warn('Billing page: No session_id found in URL.');
      return;
    }

    const verifySession = async () => {
      try {
        // OPTIONAL BUT RECOMMENDED: Verify session with your backend
        // This backend route would call Stripe to get session status
        const response = await fetch(
          `/api/stripe-session-status?session_id=${sessionId}`
        );
        const data = await response.json();
        if (!response.ok || !data.success || data.payment_status !== 'paid') {
          throw new Error(data.error || 'Subscription could not be confirmed.');
        }
        // For now, assume redirect means success if webhook runs fast enough
        // The webhook is the primary source of truth for updating the DB.
        // This page mainly confirms the redirect and triggers a UI refresh.

        console.log(
          'Billing page: Checkout session presumed successful (by redirect). ID:',
          sessionId
        );
        setMessage(
          'Subscription activated! Refreshing your account details...'
        );
        setStatus('success');

        // Re-fetch user data to update plan status in context
        // This will make the UI (e.g., header) reflect the new subscription
        await fetchUserSettings(); // Fetches settings & subscription status
        await fetchUserPrompts(); // Re-fetch prompts if access changes
        await fetchUserTemplates(); // Re-fetch templates

        // Redirect to a more suitable page after a delay, or provide a button
        setTimeout(() => {
          router.push('/'); // Redirect to homepage or dashboard
        }, 3000); // Redirect after 3 seconds
      } catch (err: any) {
        console.error('Billing page error:', err);
        setStatus('error');
        setMessage('There was an issue confirming your subscription.');
        setErrorDetail(err.message);
      }
    };

    verifySession();
  }, [
    searchParams,
    router,
    fetchUserPrompts,
    fetchUserTemplates,
    fetchUserSettings,
  ]); // Add context fetchers to deps

  if (status === 'loading') {
    return (
      <div className="text-center p-10">
        <p className="text-lg dark:text-gray-300">{message}</p>
        {/* Add a spinner icon here later */}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
          Subscription Error
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-1">{message}</p>
        {errorDetail && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Details: {errorDetail}
          </p>
        )}
        <Link href="/pricing" legacyBehavior>
          <a className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Return to Pricing
          </a>
        </Link>
        <span className="mx-2 dark:text-gray-500">|</span>
        <Link href="/" legacyBehavior>
          <a className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Go to Homepage
          </a>
        </Link>
      </div>
    );
  }

  // Success state
  return (
    <div className="text-center p-10">
      <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
        Subscription Confirmed!
      </h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You will be redirected shortly...
      </p>
      <Link href="/" legacyBehavior>
        <a className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Go to Homepage Now
        </a>
      </Link>
    </div>
  );
}

// Wrap with Suspense because useSearchParams() needs it when page is statically rendered
export default function BillingPage() {
  return (
    // This page uses usePrompt, so PromptProvider must be in a higher layout (RootLayout)
    <Suspense
      fallback={
        <div className="text-center p-10 dark:text-gray-300">
          Loading billing information...
        </div>
      }
    >
      <BillingStatusChecker />
    </Suspense>
  );
}
