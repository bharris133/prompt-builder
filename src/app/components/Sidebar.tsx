// src/app/components/Sidebar.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { RefinementStrategy } from '../context/PromptContext';
import { ApiKeyModal } from './ApiKeyModal';

// Close Icon for Mobile Sidebar
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);

export function Sidebar() {
  const {
    // Sidebar visibility state + toggle
    isSidebarOpen,
    toggleSidebar, // <-- Use this for close/overlay click
    // Load/Delete Prompts
    savedPromptNames,
    selectedPromptToLoad,
    handleLoadPrompt,
    handleDeleteSavedPrompt,
    // Add Components
    addComponent,
    // Refinement Settings
    refinementStrategy,
    setRefinementStrategy,
    userApiKey,
    setUserApiKey,
    userAnthropicApiKey,
    setUserAnthropicApiKey,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    availableModelsList,
    isLoadingModels,
    // Modal State
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    // Template State/Handlers
    savedTemplateNames,
    selectedTemplateToLoad,
    handleLoadTemplate,
    handleDeleteTemplate,
    setSelectedTemplateToLoad,
  } = usePrompt();

  // Component types definition
  const componentTypes = [
    { name: 'Instruction', color: 'blue' },
    { name: 'Context', color: 'green' },
    { name: 'Role', color: 'purple' },
    { name: 'Example Input', color: 'yellow' },
    { name: 'Example Output', color: 'orange' },
    { name: 'Tools', color: 'teal' },
  ];
  // Button class generation
  const getButtonClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      teal: 'bg-teal-500 hover:bg-teal-600',
    };
    const baseClass =
      'w-full text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out';
    return `${baseClass} ${colorMap[color] || 'bg-gray-500 hover:bg-gray-600'}`;
  };

  // Determine current provider key/setter for modal
  const currentProviderApiKey =
    selectedProvider === 'openai'
      ? userApiKey
      : selectedProvider === 'anthropic'
        ? userAnthropicApiKey
        : '';
  const currentSetUserApiKey =
    selectedProvider === 'openai'
      ? setUserApiKey
      : selectedProvider === 'anthropic'
        ? setUserAnthropicApiKey
        : () => {};

  // Modal open handler
  const handleOpenApiKeyModal = () => {
    setIsApiKeyModalOpen(true);
  };

  // Template select/delete handlers
  const onTemplateSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const name = event.target.value;
    setSelectedTemplateToLoad(name);
    if (name) {
      handleLoadTemplate(name);
    }
  };
  const onDeleteTemplateClicked = () => {
    if (selectedTemplateToLoad) {
      handleDeleteTemplate(selectedTemplateToLoad);
    }
  };

  return (
    <>
      {/* Sidebar Panel */}
      <aside
        className={`w-64 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col
                           fixed inset-y-0 left-0 z-30 md:static md:flex-shrink-0 md:translate-x-0
                           transition-transform duration-300 ease-in-out
                           ${isSidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'} `} // Slide in/out on mobile
      >
        {/* Mobile Close Button */}
        <div className="flex justify-end md:hidden mb-2">
          <button
            onClick={toggleSidebar}
            className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Section 1: Load Saved Prompt */}
        <div className="mb-6 space-y-2 flex-shrink-0">
          <label
            htmlFor="loadPromptSelect"
            className="block text-lg font-semibold text-gray-700 dark:text-gray-200"
          >
            {' '}
            Load Prompt{' '}
          </label>
          <select
            id="loadPromptSelect"
            value={selectedPromptToLoad}
            onChange={handleLoadPrompt}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
            disabled={savedPromptNames.length === 0}
          >
            <option value="">
              {savedPromptNames.length === 0
                ? 'No saved prompts'
                : '-- Select Prompt --'}
            </option>
            {savedPromptNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={handleDeleteSavedPrompt}
            disabled={!selectedPromptToLoad}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedPromptToLoad
                ? `Delete prompt "${selectedPromptToLoad}"`
                : 'Select prompt to delete'
            }
          >
            {' '}
            Delete Selected Prompt{' '}
          </button>
        </div>

        {/* Section 2: Load Template */}
        <div className="mb-6 space-y-2 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <label
            htmlFor="loadTemplateSelect"
            className="block text-lg font-semibold text-gray-700 dark:text-gray-200"
          >
            {' '}
            Load Template{' '}
          </label>
          <select
            id="loadTemplateSelect"
            value={selectedTemplateToLoad}
            onChange={onTemplateSelected}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
            disabled={savedTemplateNames.length === 0}
          >
            <option value="">
              {savedTemplateNames.length === 0
                ? 'No saved templates'
                : '-- Select Template --'}
            </option>
            {savedTemplateNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={onDeleteTemplateClicked}
            disabled={!selectedTemplateToLoad}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedTemplateToLoad
                ? `Delete template "${selectedTemplateToLoad}"`
                : 'Select template to delete'
            }
          >
            {' '}
            Delete Selected Template{' '}
          </button>
        </div>

        {/* Section 3: Add Components */}
        <div className="mb-6 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {' '}
            Add Components{' '}
          </h2>
          {componentTypes.map((type) => (
            <button
              key={type.name}
              onClick={() => addComponent(type.name)}
              className={getButtonClass(type.color)}
              title={`Add ${type.name} component`}
            >
              {' '}
              Add {type.name}{' '}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Section 4: Refinement Settings */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Refinement Settings
          </h2>
          {/* Strategy Selection */}
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Refinement Mode:
            </legend>
            <div className="flex items-center space-x-4">
              <label
                className="flex items-center space-x-1 text-sm cursor-pointer"
                title="Use API key entered here (stored only in browser memory)"
              >
                <input
                  type="radio"
                  name="refinementStrategy"
                  value="userKey"
                  checked={refinementStrategy === 'userKey'}
                  onChange={() => setRefinementStrategy('userKey')}
                  className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Use My Key
                </span>
              </label>
              <label
                className="flex items-center space-x-1 text-sm cursor-pointer"
                title="Use the app's managed service (future subscription feature)"
              >
                <input
                  type="radio"
                  name="refinementStrategy"
                  value="managedKey"
                  checked={refinementStrategy === 'managedKey'}
                  onChange={() => setRefinementStrategy('managedKey')}
                  className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Managed Service
                </span>
              </label>
            </div>
          </fieldset>
          {/* API Key Input Button */}
          {refinementStrategy === 'userKey' && (
            <div>
              <button
                onClick={handleOpenApiKeyModal}
                className={`w-full text-sm py-2 px-3 rounded transition duration-150 ease-in-out ${currentProviderApiKey ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/60 text-green-800 dark:text-green-100 border border-green-300 dark:border-green-700' : 'bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-800/60 text-yellow-800 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700'}`}
              >
                {currentProviderApiKey
                  ? `${selectedProvider.toUpperCase()} Key Set (Edit)`
                  : `Enter ${selectedProvider.toUpperCase()} API Key`}
              </button>
              {!currentProviderApiKey && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  API Key required for {selectedProvider}.
                </p>
              )}
            </div>
          )}
          {/* Provider Selection */}
          <div>
            <label
              htmlFor="providerSelect"
              className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              Provider:
            </label>
            <select
              id="providerSelect"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              title="Select the AI provider for refinement"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          {/* Model Selection */}
          <div>
            <label
              htmlFor="modelSelect"
              className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              Model:
            </label>
            <select
              id="modelSelect"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 disabled:opacity-70 dark:disabled:opacity-60 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              disabled={isLoadingModels || availableModelsList.length === 0}
              title="Select the specific AI model"
            >
              {isLoadingModels ? (
                <option value="">Loading models...</option>
              ) : availableModelsList.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                availableModelsList.map((modelName) => (
                  <option key={modelName} value={modelName}>
                    {modelName}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={currentSetUserApiKey}
        currentApiKeyProp={currentProviderApiKey}
      />
    </>
  );
}
