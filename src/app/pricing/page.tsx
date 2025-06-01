// src/app/pricing/page.tsx // COMPLETE FILE REPLACEMENT (With Free and Trial Plans)

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { usePrompt } from '../hooks/usePrompt'; // Will now work correctly

// Ensure your Stripe Publishable Key is in .env.local and prefixed with NEXT_PUBLIC_
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Define your plans (now with interval selection for Pro, Team, Enterprise)
const plans = [
  {
    name: 'Free',
    priceId: null,
    price: '$0',
    features: [
      'Unlimited Prompts & Templates',
      'Community Library Access',
      'Basic Support',
      'Limited AI Refinements',
    ],
    cta: 'Start Free',
    disabled: true,
    highlight: false,
    intervals: [],
  },
  {
    name: 'Trial',
    priceId: null,
    price: 'Free 14-day Trial',
    features: [
      'All Pro Features',
      '500 Managed AI Refinements',
      'Access to All Providers',
      'No Credit Card Required',
    ],
    cta: 'Start Trial',
    disabled: true,
    highlight: true,
    intervals: [],
  },
  {
    name: 'Individual',
    priceId: {
      monthly: 'price_individual_monthly', // TODO: Replace with real Stripe priceId
      annual: 'price_individual_annual', // TODO: Replace with real Stripe priceId
    },
    price: { monthly: '$7/month', annual: '$70/year' },
    features: [
      'Unlimited Prompts & Templates',
      '250 Managed AI Refinements/month',
      'Access to All Providers (Managed)',
      'Email Support',
    ],
    cta: 'Subscribe',
    disabled: false,
    highlight: false,
    intervals: ['monthly', 'annual'],
  },
  {
    name: 'Pro',
    priceId: {
      monthly: 'price_1RSWT9AXhi6a7FjLWOy8XUrp',
      annual: 'price_1RSWTrAXhi6a7FjLNqisF4xQ',
    },
    price: { monthly: '$10/month', annual: '$99/year' },
    features: [
      'Unlimited Prompts & Templates',
      '500 Managed AI Refinements/month',
      'Access to All Providers (Managed)',
      'Priority Support',
    ],
    cta: 'Subscribe',
    disabled: false,
    highlight: false,
    intervals: ['monthly', 'annual'],
  },
  {
    name: 'Team',
    priceId: { monthly: null, annual: null }, // Placeholder for future
    price: { monthly: 'Contact Us', annual: 'Contact Us' },
    features: [
      'Team Management',
      'Shared Prompt Library',
      'Centralized Billing',
      'Priority Support',
    ],
    cta: 'Contact Sales',
    disabled: true,
    highlight: false,
    intervals: ['monthly', 'annual'],
  },
  {
    name: 'Enterprise',
    priceId: { monthly: null, annual: null }, // Placeholder for future
    price: { monthly: 'Custom', annual: 'Custom' },
    features: [
      'All Team Features',
      'Custom Integrations',
      'Dedicated Support',
      'SLA & Security Review',
    ],
    cta: 'Contact Sales',
    disabled: true,
    highlight: false,
    intervals: ['monthly', 'annual'],
  },
];

// Helper to get price and priceId safely for plans with intervals
function getPlanPrice(plan: any, interval: 'monthly' | 'annual') {
  if (typeof plan.price === 'string') return plan.price;
  return plan.price?.[interval] || '';
}
function getPlanPriceId(plan: any, interval: 'monthly' | 'annual') {
  if (!plan.priceId || typeof plan.priceId === 'string') return plan.priceId;
  return plan.priceId?.[interval] || null;
}

export default function PricingPage() {
  const { user, authLoading, openAuthModal } = usePrompt(); // Get user and auth modal trigger
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntervals, setSelectedIntervals] = useState<{
    [key: string]: 'monthly' | 'annual';
  }>({
    Pro: 'monthly',
    Team: 'monthly',
    Enterprise: 'monthly',
  });

  const handleIntervalChange = (
    planName: string,
    interval: 'monthly' | 'annual'
  ) => {
    setSelectedIntervals((prev) => ({ ...prev, [planName]: interval }));
  };

  const handleSubscribe = async (planName: string) => {
    const plan = plans.find((p) => p.name === planName);
    if (!plan || !plan.priceId) return;
    const interval = selectedIntervals[planName] || 'monthly';
    const priceId = getPlanPriceId(plan, interval);
    if (!user && !authLoading) {
      alert('Please log in or sign up to subscribe.');
      openAuthModal('signIn');
      return;
    }
    if (authLoading) return;
    setIsLoading(priceId);
    setError(null);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const sessionData = await response.json();
      if (!response.ok || !sessionData.sessionId) {
        throw new Error(
          sessionData.error || 'Failed to create checkout session.'
        );
      }
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe.js failed to load.');
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: sessionData.sessionId,
      });
      if (stripeError) {
        setError(stripeError.message || 'Failed to redirect to Stripe.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10">
          Unlock the full potential of prompt engineering with our Pro features.
        </p>
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const interval = selectedIntervals[plan.name] || 'monthly';
            const price = getPlanPrice(plan, interval);
            const priceId = getPlanPriceId(plan, interval);
            const isPro = plan.name === 'Pro';
            const isLoadingForPlan = isPro && isLoading === priceId;
            return (
              <div
                key={plan.name}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col border dark:border-gray-700 hover:shadow-2xl transition-shadow ${plan.highlight ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
                  {plan.name}
                </h2>
                {plan.intervals && plan.intervals.length > 0 && (
                  <div className="flex justify-center mt-4 mb-2 gap-2">
                    {plan.intervals.map((intervalOption) => (
                      <button
                        key={intervalOption}
                        onClick={() =>
                          handleIntervalChange(
                            plan.name,
                            intervalOption as 'monthly' | 'annual'
                          )
                        }
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors
                          ${
                            interval === intervalOption
                              ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                              : 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                          }
                        `}
                      >
                        {intervalOption.charAt(0).toUpperCase() +
                          intervalOption.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white text-center">
                  {price}
                </p>
                <ul role="list" className="mt-6 space-y-4 flex-grow">
                  {plan.features.map((feature: string) => (
                    <li key={feature} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-6 w-6 text-green-500 dark:text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    isPro && !plan.disabled && handleSubscribe(plan.name)
                  }
                  disabled={plan.disabled || authLoading || isLoadingForPlan}
                  className={`mt-8 w-full py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors
                    ${
                      plan.disabled || isLoadingForPlan || authLoading
                        ? 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800'
                    }
                    ${plan.highlight ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
                >
                  {plan.disabled
                    ? plan.cta
                    : isLoadingForPlan
                      ? 'Processing...'
                      : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Back to Prompt Builder
          </button>
        </div>
      </div>
    </div>
  );
}
