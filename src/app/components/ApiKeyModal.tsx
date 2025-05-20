// src/app/components/ApiKeyModal.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { ApiKeyValidationStatus } from '../context/PromptContext';

const SpinnerIcon = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    {' '}
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>{' '}
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>{' '}
  </svg>
);

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newKey: string) => void; // This is setUserApiKey or setUserAnthropicApiKey
  currentApiKeyProp: string; // This is session key: userApiKey or userAnthropicApiKey
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
    // --- Get consent state and flags from context ---
    consentToSaveApiKey,
    setConsentToSaveApiKey,
    isOpenAiKeyLoadedFromDb,
    isAnthropicKeyLoadedFromDb,
  } = usePrompt();

  const [apiKeyInput, setApiKeyInput] = useState('');

  // Determine if a key is already saved in DB for the current provider
  const isKeyCurrentlySavedInDb =
    selectedProvider === 'openai'
      ? isOpenAiKeyLoadedFromDb
      : selectedProvider === 'anthropic'
        ? isAnthropicKeyLoadedFromDb
        : false;

  // Sync local input with prop and set initial checkbox state
  useEffect(() => {
    if (isOpen) {
      // If key is saved in DB, don't prefill input unless currentApiKeyProp (session key) exists.
      // User might want to clear a saved key by saving an empty one.
      // If currentApiKeyProp is set (e.g., after validation but before save), use it.
      // Otherwise, if a key is saved in DB, input is blank to encourage explicit action for saved keys.
      setApiKeyInput(currentApiKeyProp || '');

      // Set initial checkbox state based on whether key is already saved in DB
      setConsentToSaveApiKey(isKeyCurrentlySavedInDb);
    } else {
      // Reset consent when modal is fully closed (via context's setIsApiKeyModalOpen)
    }
  }, [
    isOpen,
    currentApiKeyProp,
    isKeyCurrentlySavedInDb,
    setConsentToSaveApiKey,
  ]);

  const handleValidation = () => validateUserApiKey(apiKeyInput);
  const handleSaveClick = () => {
    // The onSave prop (setUserApiKey/setUserAnthropicApiKey) will
    // check the 'consentToSaveApiKey' from context to decide if it calls saveUserSettings.
    onSave(apiKeyInput);
    onClose();
  };

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

  const isValidating = apiKeyValidationStatus === 'validating';
  const isValid = apiKeyValidationStatus === 'valid';
  const isInvalid = apiKeyValidationStatus === 'invalid';
  const canSave = !isValidating;
  const placeholderText =
    selectedProvider === 'openai'
      ? 'sk-...'
      : selectedProvider === 'anthropic'
        ? 'sk-ant-...'
        : selectedProvider === 'google'
          ? 'AIzaSy...'
          : 'Enter API Key...';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm dark:bg-opacity-75"
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
            <li>Your key is used for "Use My Key" mode or validation.</li>
            <li>
              If "Remember API Key" is checked, your key will be stored{' '}
              <strong className="underline">encrypted</strong> in the database
              for your convenience.
            </li>
            <li>
              Otherwise, it's only kept in browser memory for this session.
            </li>
            <li>Close browser/tab to clear session key from memory.</li>
          </ul>
        </div>

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
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={placeholderText}
              className="flex-grow p-2 border dark:border-gray-600 rounded shadow-sm text-sm dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isValidating}
            />
            <button
              onClick={handleValidation}
              className={`py-2 px-3 rounded text-sm transition text-white flex items-center justify-center ${isValidating || !apiKeyInput.trim() ? 'bg-gray-400 dark:bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
              disabled={isValidating || !apiKeyInput.trim()}
              title="Check key validity"
            >
              {' '}
              {isValidating ? <SpinnerIcon /> : null}{' '}
              {isValidating ? 'Validating...' : 'Validate'}{' '}
            </button>
          </div>
        </div>
        <div className="text-xs min-h-[18px] mb-2 pl-1">
          {' '}
          {/* Validation Feedback */}
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

        {/* --- "Remember Key" Checkbox --- */}
        <div className="mb-4">
          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={consentToSaveApiKey}
              onChange={(e) => {
                console.log(
                  '[ApiKeyModal] Consent checkbox changed to:',
                  e.target.checked
                );
                setConsentToSaveApiKey(e.target.checked);
              }}
              className="form-checkbox h-4 w-4 text-indigo-600 dark:text-indigo-500 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            <span>Remember API Key (stored encrypted)</span>
          </label>
          {isKeyCurrentlySavedInDb &&
            !consentToSaveApiKey &&
            apiKeyInput.trim() === '' && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                A key is currently saved. To remove it from storage: uncheck
                "Remember", leave input blank, and click Save.
              </p>
            )}
          {isKeyCurrentlySavedInDb &&
            consentToSaveApiKey &&
            apiKeyInput.trim() !== '' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Saving will overwrite your previously stored key.
              </p>
            )}
        </div>
        {/* --- END Checkbox --- */}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isValidating}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition text-sm disabled:opacity-50"
          >
            {' '}
            Cancel{' '}
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!canSave}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-sm disabled:opacity-50"
            title={
              !apiKeyInput.trim() && !isKeyCurrentlySavedInDb
                ? 'Enter an API key first'
                : consentToSaveApiKey
                  ? 'Save key to secure storage'
                  : 'Use key for this session only'
            }
          >
            {consentToSaveApiKey
              ? 'Save & Remember Key'
              : 'Use Key for Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
