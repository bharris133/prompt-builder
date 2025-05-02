// src/app/components/RefinementDisplay.tsx // COMPLETE FILE REPLACEMENT - FINAL

'use client';

import React, { useState, useEffect } from 'react';
import { usePrompt } from '../hooks/usePrompt';

// --- Icons ---
const CollapseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 15.75 7.5-7.5 7.5 7.5"
    />
  </svg>
);
const ExpandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m19.5 8.25-7.5 7.5-7.5-7.5"
    />
  </svg>
);
// --- End Icons ---

// --- Error Formatter ---
function formatErrorMessage(rawError: string | null): string | null {
  if (!rawError) return null;
  console.error('Raw refinement error:', rawError);
  if (
    rawError.includes('Invalid API Key') ||
    rawError.includes('Incorrect API key') ||
    rawError.includes('authentication') ||
    rawError.includes('401')
  ) {
    return 'Invalid API Key: Please check the key entered in settings (User Key mode) or ensure the server key is correct (Managed mode).';
  }
  if (rawError.includes('rate limit') || rawError.includes('429')) {
    return "Rate Limit Exceeded: You've made too many requests. Please wait a moment and try again.";
  }
  if (
    rawError.includes('Failed to fetch') ||
    rawError.includes('NetworkError')
  ) {
    return 'Network Error: Could not connect to the refinement service. Please check your internet connection.';
  }
  if (rawError.includes('status 500') || rawError.includes('server error')) {
    return 'Server Error: The refinement service encountered an internal problem. Please try again later.';
  }
  if (rawError.includes('status 400') || rawError.includes('Invalid request')) {
    return 'Invalid Request: There might be an issue with the prompt format sent for refinement.';
  }
  if (rawError.includes('not found') || rawError.includes('404')) {
    return 'Model Not Found: The selected model may not be accessible with the current API key or provider configuration.';
  }
  if (rawError.includes('No content received')) {
    return 'Empty Response: The AI model did not return any refined content.';
  }
  return `An unexpected error occurred: ${rawError.substring(0, 150)}${rawError.length > 150 ? '...' : ''}`; // Truncate long generic errors
}
// --- End Error Formatter ---

export function RefinementDisplay() {
  const {
    isLoadingRefinement,
    refinedPromptResult,
    refinementError,
    handleRefinePrompt,
    generatedPrompt,
    refinementStrategy,
    userApiKey,
    userAnthropicApiKey, // Need this for disable logic
    selectedProvider, // Need this for disable logic
    selectedModel, // <-- Make sure selectedModel is also here if used in title
    loadRefinedPromptToCanvas,
    // --- ADD THESE ---
    availableModelsList,
    isLoadingModels,
    // --- END ADD ---
  } = usePrompt();

  const [isOpen, setIsOpen] = useState(false); // Default CLOSED
  const [copyStatus, setCopyStatus] = useState<'original' | 'refined' | null>(
    null
  );

  useEffect(() => {
    // Clear copy status timer
    if (copyStatus) {
      const timer = setTimeout(() => setCopyStatus(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const handleCopyRefined = () => {
    // Copy Refined Text
    if (!refinedPromptResult || copyStatus) return;
    navigator.clipboard
      .writeText(refinedPromptResult)
      .then(() => setCopyStatus('refined'))
      .catch((err) => {
        console.error('Failed to copy refined prompt: ', err);
        alert('Failed to copy.');
      });
  };

  const handleCopyOriginal = () => {
    // Copy Original Text
    if (!generatedPrompt.trim() || copyStatus) return;
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => setCopyStatus('original'))
      .catch((err) => {
        console.error('Failed to copy original prompt: ', err);
        alert('Failed to copy.');
      });
  };

  const toggleOpen = () => setIsOpen(!isOpen); // Toggle Accordion

  // --- Refine Button Disable Logic ---
  const isGeneratedPromptEmpty = !generatedPrompt.trim();
  const isUserKeyMissing =
    refinementStrategy === 'userKey' &&
    ((selectedProvider === 'openai' && !userApiKey) ||
      (selectedProvider === 'anthropic' && !userAnthropicApiKey));
  const isRefineDisabled =
    isLoadingRefinement || isGeneratedPromptEmpty || isUserKeyMissing;
  // --- End Disable Logic ---

  // --- Refine Button Tooltip Logic ---
  const getRefineButtonTitle = () => {
    if (isLoadingRefinement) return 'Refining in progress...';
    if (isGeneratedPromptEmpty)
      return 'Add components to generate a prompt first';
    // --- UPDATED LOGIC for User Key Missing ---
    if (isUserKeyMissing) {
      // Check if models are loaded despite missing key state
      // (This implies validation succeeded but save wasn't clicked)
      if (availableModelsList.length > 0 && !isLoadingModels) {
        return `API Key validated but not saved for session. Please Save Key in settings.`;
      } else {
        // Key is missing and models aren't loaded (or failed validation)
        return `Enter and Save your ${selectedProvider.toUpperCase()} API Key in settings to enable refinement.`;
      }
    }
    // --- END UPDATED LOGIC ---
    // 2. Handle Enabled States (Button is NOT disabled)
    // If we reach here, the button is enabled. Provide standard action text.
    // Use the message you had hardcoded previously when enabled.
    return 'Click to create a new prompt that meets best practices.';
  };
  // --- End Tooltip Logic ---

  // Format error for display
  const displayError = formatErrorMessage(refinementError);

  return (
    <section className="p-6 pt-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {' '}
            AI Refinement{' '}
          </h2>
          <button
            onClick={toggleOpen}
            title={isOpen ? 'Collapse Section' : 'Expand Section'}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            {isOpen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        </div>
        <button
          onClick={handleRefinePrompt}
          disabled={isRefineDisabled}
          title={getRefineButtonTitle()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingRefinement ? 'Refining...' : 'Refine Prompt'}
        </button>
      </div>

      {/* Collapsible Content Area Wrapper */}
      <div
        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[600px] mt-1' : 'max-h-0'}`}
      >
        {/* Content */}
        <div
          className={`border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 rounded shadow-sm min-h-[150px] space-y-4 mb-1`}
        >
          {/* Original Prompt Display */}
          {generatedPrompt.trim() &&
            !isLoadingRefinement &&
            (refinedPromptResult || refinementError) && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Original:
                  </h3>
                  <div className="relative flex items-center">
                    <span
                      className={`text-xs text-green-600 dark:text-green-400 mr-2 transition-opacity duration-300 ${copyStatus === 'original' ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {' '}
                      Copied!{' '}
                    </span>
                    <button
                      onClick={handleCopyOriginal}
                      disabled={copyStatus === 'original'}
                      className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded disabled:opacity-50"
                      title="Copy original prompt"
                    >
                      {' '}
                      Copy Original{' '}
                    </button>
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap break-words text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600 max-h-40 overflow-y-auto">
                  {generatedPrompt}
                </pre>
              </div>
            )}

          {/* Loading State */}
          {isLoadingRefinement && (
            <p className="text-gray-500 dark:text-gray-400 text-center animate-pulse py-4">
              {' '}
              Communicating with AI...{' '}
            </p>
          )}

          {/* Error Display */}
          {displayError && !isLoadingRefinement && (
            <div className="text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-3 rounded">
              <p className="font-semibold text-sm">Refinement Error:</p>
              <p className="text-sm break-words">{displayError}</p>
            </div>
          )}

          {/* Refined Result Display */}
          {refinedPromptResult && !isLoadingRefinement && !refinementError && (
            <div>
              <div className="flex justify-between items-center mb-1 gap-2">
                <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Refined:
                </h3>
                <div className="relative flex items-center space-x-2">
                  <span
                    className={`text-xs text-green-600 dark:text-green-400 transition-opacity duration-300 ${copyStatus === 'refined' ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {' '}
                    Copied!{' '}
                  </span>
                  <button
                    onClick={loadRefinedPromptToCanvas}
                    className="text-xs bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 py-1 px-2 rounded"
                    title="Replace canvas content"
                  >
                    {' '}
                    Load to Canvas{' '}
                  </button>
                  <button
                    onClick={handleCopyRefined}
                    disabled={copyStatus === 'refined'}
                    className="text-xs bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-200 py-1 px-2 rounded disabled:opacity-50"
                    title="Copy refined prompt"
                  >
                    {' '}
                    Copy Refined{' '}
                  </button>
                </div>
              </div>
              <pre className="text-sm whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
                {refinedPromptResult}
              </pre>
            </div>
          )}

          {/* Initial Placeholder */}
          {!isLoadingRefinement && !refinementError && !refinedPromptResult && (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center pt-4">
              {' '}
              Click "Refine Prompt" to get AI suggestions here.{' '}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
