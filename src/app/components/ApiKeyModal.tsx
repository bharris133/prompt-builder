// src/app/components/ApiKeyModal.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { ApiKeyValidationStatus } from '../context/PromptContext';

// --- Simple SVG Spinner Component ---
const SpinnerIcon = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
// --- End Spinner ---

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newKey: string) => void;
  currentApiKeyProp: string;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
  currentApiKeyProp,
}: ApiKeyModalProps) {
  const {
    validateUserApiKey,
    apiKeyValidationStatus,
    apiKeyValidationError,
    selectedProvider,
    // --- Need setter to reset status on input change ---
    // Let's add a dedicated reset function in context later if needed,
    // for now, we'll handle it locally on input change maybe?
    // OR - we modify setUserApiKey in context to reset validation status
    // Let's assume context's setUserApiKey already resets validation status 'idle'
    // We also need the raw setter from context for the onSave prop now
    // Let's get the specific setter based on provider from context instead of passing onSave
    setUserApiKey, // OpenAI setter
    setUserAnthropicApiKey, // Anthropic setter
  } = usePrompt();

  const [apiKeyInput, setApiKeyInput] = useState('');

  // Sync local input state with the prop from context
  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(currentApiKeyProp || '');
      // Validation status reset is handled by setIsApiKeyModalOpen(false) in context
    }
  }, [isOpen, currentApiKeyProp]);

  const handleValidation = () => {
    validateUserApiKey(apiKeyInput); // Trigger validation
  };

  // --- UPDATED Save Handler ---
  const handleSaveClick = () => {
    // Determine which setter to call based on provider
    const saveFunc =
      selectedProvider === 'openai'
        ? setUserApiKey
        : selectedProvider === 'anthropic'
          ? setUserAnthropicApiKey
          : null;
    if (saveFunc) {
      saveFunc(apiKeyInput); // Call the correct context setter
    } else {
      console.error('Cannot save key: Unknown provider selected');
      // Optionally show an error to the user
    }
    onClose(); // Close the modal
  };

  // Handle Escape key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose]
  );
  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    else document.removeEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Determine states
  const isValidating = apiKeyValidationStatus === 'validating';
  const isValid = apiKeyValidationStatus === 'valid';
  const isInvalid = apiKeyValidationStatus === 'invalid';
  // Allow save regardless of validation status for now, but not while validating
  const canSave = !isValidating;
  const placeholderText =
    selectedProvider === 'openai'
      ? 'sk-...'
      : selectedProvider === 'anthropic'
        ? 'sk-ant-...'
        : 'Enter API Key...';

  // --- NEW: Handler for input change to reset validation status visually ---
  // Note: The actual status reset for logic happens in context's setUserApiKey
  // This local reset is just for immediate UI feedback if needed, but might be redundant
  // Let's rely on context logic - when user types, they will likely Save, which calls
  // setUserApiKey/setUserAnthropicApiKey which resets status in context. So no local change needed here.
  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     setApiKeyInput(e.target.value);
  //     // If user types after validation, reset visual status?
  //     // if (apiKeyValidationStatus === 'valid' || apiKeyValidationStatus === 'invalid') {
  //     //     // Need a way to call context reset here, or manage locally
  //     // }
  // };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold"
          aria-label="Close"
        >
          {' '}
          ×{' '}
        </button>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {' '}
          Enter {selectedProvider.toUpperCase()} API Key{' '}
        </h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-200 text-sm p-3 rounded mb-4">
          <p className="font-semibold">Security Notice:</p>
          <ul className="list-disc list-inside mt-1">
            <li>
              Your key is stored temporarily in your browsers memory{' '}
              <strong className="underline">this session only</strong>.
            </li>
            <li>
              Used directly for 'Use My Key' mode or validation with your
              selected provider.
            </li>
            <li>
              <strong className="underline">Never sent</strong> to our servers
              in 'Use My Key' mode.
            </li>
            <li>Close browser/tab to clear key from memory.</li>
          </ul>
        </div>

        {/* Input Field & Validation Button */}
        <div className="mb-1">
          <label
            htmlFor="apiKeyInputModal"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {' '}
            Your {selectedProvider.toUpperCase()} Key:{' '}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="password"
              id="apiKeyInputModal"
              value={apiKeyInput}
              // Use standard onChange, context setter handles reset
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={placeholderText}
              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 disabled:opacity-70"
              disabled={isValidating}
            />
            {/* --- UPDATED Validate Button --- */}
            <button
              onClick={handleValidation}
              className={`py-2 px-3 rounded text-sm transition text-white flex items-center justify-center ${isValidating || !apiKeyInput.trim() ? 'bg-gray-400 dark:bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
              disabled={isValidating || !apiKeyInput.trim()}
              title="Check key validity"
            >
              {isValidating ? <SpinnerIcon /> : null}
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
            {/* --- End Validate Button Update --- */}
          </div>
        </div>
        {/* Validation Feedback Area */}
        <div className="text-xs min-h-[18px] mb-4 pl-1">
          {/* No need to show "Checking key..." text if spinner is shown */}
          {/* {isValidating && ( <span className="text-gray-500 dark:text-gray-400">Checking key...</span> )} */}
          {isInvalid && apiKeyValidationError && (
            <span className="text-red-600 dark:text-red-400">
              <span className="font-bold mr-1">❌</span> {apiKeyValidationError}
            </span>
          )}
          {isValid && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              <span className="font-bold mr-1">✅</span> Key appears valid!
            </span>
          )}
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isValidating}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition duration-150 ease-in-out text-sm disabled:opacity-50"
          >
            {' '}
            Cancel{' '}
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!canSave || !apiKeyInput.trim()}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition duration-150 ease-in-out text-sm disabled:opacity-50"
            title={
              !apiKeyInput.trim()
                ? 'Enter an API key first'
                : 'Save key for this session'
            }
          >
            {' '}
            Save Key (for Session){' '}
          </button>
        </div>
      </div>
    </div>
  );
}
