// src/app/components/RefinementDisplay.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect } from 'react';
import { usePrompt } from '../hooks/usePrompt';

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

function formatErrorMessage(rawError: string | null): string | null {
  if (!rawError) return null;
  if (rawError.includes('Incorrect API key'))
    return 'Invalid API Key: Please check the key.';
  if (rawError.includes('rate limit'))
    return 'Rate Limit Exceeded: Please wait and try again.';
  if (rawError.includes('Failed to fetch') || rawError.includes('NetworkError'))
    return 'Network Error: Could not connect.';
  if (rawError.includes('status 500'))
    return 'Server Error: Refinement service failed.';
  if (rawError.includes('status 400'))
    return 'Invalid Request: Problem with prompt format.';
  if (rawError.includes('No content received'))
    return 'Empty Response from AI.';
  return `An unexpected error occurred: ${rawError.substring(0, 100)}${rawError.length > 100 ? '...' : ''}`; // Truncate long errors
}

export function RefinementDisplay() {
  const {
    isLoadingRefinement,
    refinedPromptResult,
    refinementError,
    handleRefinePrompt,
    generatedPrompt,
    refinementStrategy,
    userApiKey, // OpenAI Key
    userAnthropicApiKey, // Anthropic Key
    selectedProvider, // Need provider to check correct key
    loadRefinedPromptToCanvas,
  } = usePrompt();
  const [isOpen, setIsOpen] = useState(false); // Default CLOSED
  const [copyStatus, setCopyStatus] = useState<'original' | 'refined' | null>(
    null
  );

  useEffect(() => {
    if (copyStatus) {
      const timer = setTimeout(() => setCopyStatus(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);
  const handleCopyRefined = () => {
    if (!refinedPromptResult || copyStatus) return;
    navigator.clipboard
      .writeText(refinedPromptResult)
      .then(() => setCopyStatus('refined'))
      .catch((err) => alert('Copy failed'));
  };
  const handleCopyOriginal = () => {
    if (!generatedPrompt.trim() || copyStatus) return;
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => setCopyStatus('original'))
      .catch((err) => alert('Copy failed'));
  };
  const toggleOpen = () => setIsOpen(!isOpen);

  const isGeneratedPromptEmpty = !generatedPrompt.trim();

  const isUserKeyMissing =
    refinementStrategy === 'userKey' &&
    ((selectedProvider === 'openai' && !userApiKey) ||
      (selectedProvider === 'anthropic' && !userAnthropicApiKey));

  const isRefineDisabled =
    isLoadingRefinement || isGeneratedPromptEmpty || isUserKeyMissing;

  const getRefineButtonTitle = () => {
    if (isLoadingRefinement) return 'Refining...';
    if (isGeneratedPromptEmpty) return 'Generate prompt first';
    if (isUserKeyMissing)
      return 'Enter your ${selectedProvider.toUpperCase()} API Key in settings';
    return 'Refine the generated prompt';
  };
  const displayError = formatErrorMessage(refinementError);

  // Must return a single root element
  return (
    <section className="p-6 pt-4 border-b border-gray-200 flex-shrink-0">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-800">
            {' '}
            AI Refinement{' '}
          </h2>
          <button
            onClick={toggleOpen}
            title={isOpen ? 'Collapse' : 'Expand'}
            className="text-gray-400 hover:text-gray-600 p-1"
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
          className={`border border-gray-200 bg-gray-50 p-4 rounded shadow-sm min-h-[150px] space-y-4 mb-1`}
        >
          {/* Original Prompt Display */}
          {generatedPrompt.trim() &&
            !isLoadingRefinement &&
            (refinedPromptResult || refinementError) && (
              <div className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Original:
                  </h3>
                  <div className="relative flex items-center">
                    <span
                      className={`text-xs text-green-600 mr-2 transition-opacity duration-300 ${copyStatus === 'original' ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {' '}
                      Copied!{' '}
                    </span>
                    <button
                      onClick={handleCopyOriginal}
                      disabled={copyStatus === 'original'}
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded disabled:opacity-50"
                    >
                      {' '}
                      Copy Original{' '}
                    </button>
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap break-words text-gray-500 bg-white p-2 rounded border border-gray-100 max-h-40 overflow-y-auto">
                  {generatedPrompt}
                </pre>
              </div>
            )}
          {/* Loading State */}
          {isLoadingRefinement && (
            <p className="text-gray-500 text-center animate-pulse py-4">
              {' '}
              Communicating with AI...{' '}
            </p>
          )}
          {/* Error Display */}
          {displayError && !isLoadingRefinement && (
            <div className="text-red-700 bg-red-100 border border-red-300 p-3 rounded">
              <p className="font-semibold text-sm">Refinement Error:</p>
              <p className="text-sm break-words">{displayError}</p>
            </div>
          )}
          {/* Refined Result Display */}
          {refinedPromptResult && !isLoadingRefinement && !refinementError && (
            <div>
              <div className="flex justify-between items-center mb-1 gap-2">
                <h3 className="text-sm font-semibold text-green-700">
                  Refined:
                </h3>
                <div className="relative flex items-center space-x-2">
                  <span
                    className={`text-xs text-green-600 transition-opacity duration-300 ${copyStatus === 'refined' ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {' '}
                    Copied!{' '}
                  </span>
                  <button
                    onClick={loadRefinedPromptToCanvas}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded"
                    title="Replace canvas content with this refined prompt"
                  >
                    {' '}
                    Load to Canvas{' '}
                  </button>
                  <button
                    onClick={handleCopyRefined}
                    disabled={copyStatus === 'refined'}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded disabled:opacity-50"
                    title="Copy refined prompt"
                  >
                    {' '}
                    Copy Refined{' '}
                  </button>
                </div>
              </div>
              <pre className="text-sm whitespace-pre-wrap break-words text-gray-800 bg-white p-3 rounded border border-gray-200">
                {refinedPromptResult}
              </pre>
            </div>
          )}
          {/* Initial Placeholder */}
          {!isLoadingRefinement && !refinementError && !refinedPromptResult && (
            <p className="text-gray-400 text-sm text-center pt-4">
              {' '}
              Click "Refine Prompt" to get AI suggestions here.{' '}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
