// src/app/components/Sidebar.tsx // MODIFY FILE - APPLY DARK MODE

'use client';

import React, { useState } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { RefinementStrategy } from '../context/PromptContext';
import { ApiKeyModal } from './ApiKeyModal';

export function Sidebar() {
  const {
    savedPromptNames,
    selectedPromptToLoad,
    handleLoadPrompt,
    handleDeleteSavedPrompt,
    addComponent,
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
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    savedTemplateNames,
    selectedTemplateToLoad,
    handleLoadTemplate,
    handleDeleteTemplate,
    setSelectedTemplateToLoad,
  } = usePrompt();

  // Local state for template selection removed - using context now

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

  const availableModels: { [provider: string]: string[] } = {}; // Removed hardcoded models logic, context handles list
  const currentModels = availableModelsList; // Use list directly from context

  const handleOpenApiKeyModal = () => {
    setIsApiKeyModalOpen(true);
  };
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
        : () => {
            console.error('No setter for provider:', selectedProvider);
          };

  return (
    <>
      {/* Apply dark mode background and border */}
      <aside className="w-64 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0 flex flex-col">
        {/* --- Section 1: Load Saved Prompt --- */}
        <div className="mb-6 space-y-2 flex-shrink-0">
          {/* Label dark text */}
          <label
            htmlFor="loadPromptSelect"
            className="block text-lg font-semibold text-gray-700 dark:text-gray-200"
          >
            {' '}
            Load Prompt{' '}
          </label>
          {/* Select dark styles */}
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
          {/* Delete Button - Base style likely ok */}
          <button
            onClick={handleDeleteSavedPrompt}
            disabled={!selectedPromptToLoad}
            className="w-full bg-red-500 hover:bg-red-600 text-white ..."
            title="Delete selected prompt"
          >
            {' '}
            Delete Selected Prompt{' '}
          </button>
        </div>

        {/* --- Section 2: Load Template --- */}
        <div className="mb-6 space-y-2 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Label dark text */}
          <label
            htmlFor="loadTemplateSelect"
            className="block text-lg font-semibold text-gray-700 dark:text-gray-200"
          >
            {' '}
            Load Template{' '}
          </label>
          {/* Select dark styles */}
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
          {/* Delete Button - Base style likely ok */}
          <button
            onClick={onDeleteTemplateClicked}
            disabled={!selectedTemplateToLoad}
            className="w-full bg-red-500 hover:bg-red-600 text-white ..."
            title="Delete selected template"
          >
            {' '}
            Delete Selected Template{' '}
          </button>
        </div>

        {/* --- Section 3: Add Components --- */}
        <div className="mb-6 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Label dark text */}
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {' '}
            Add Components{' '}
          </h2>
          {/* Buttons - Base styles likely ok */}
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

        {/* --- Section 4: Refinement Settings --- */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
          {/* Label dark text */}
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Refinement Settings
          </h2>

          {/* Strategy Selection */}
          <fieldset className="space-y-1">
            {/* Label dark text */}
            <legend className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Refinement Mode:
            </legend>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="refinementStrategy"
                  value="userKey"
                  checked={refinementStrategy === 'userKey'}
                  onChange={() => setRefinementStrategy('userKey')}
                  className="form-radio ..."
                  title="Use your own API Key"
                />
                {/* Label dark text */}
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Use My Key
                </span>
              </label>
              <label className="flex items-center space-x-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="refinementStrategy"
                  value="managedKey"
                  checked={refinementStrategy === 'managedKey'}
                  onChange={() => setRefinementStrategy('managedKey')}
                  className="form-radio ..."
                  title="Managed Service(no key required)"
                />
                {/* Label dark text */}
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Managed Service
                </span>
              </label>
            </div>
          </fieldset>

          {/* API Key Input Button */}
          {refinementStrategy === 'userKey' && (
            <div>
              {/* Adjust button background/text/border for dark mode */}
              <button
                onClick={handleOpenApiKeyModal}
                className={`w-full text-sm py-2 px-3 rounded transition ... ${currentProviderApiKey ? 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-100 border border-green-300 dark:border-green-700' : 'bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700'}`}
                title="Enter or edit your API key"
              >
                {currentProviderApiKey
                  ? `${selectedProvider.toUpperCase()} Key Set (Edit)`
                  : `Enter ${selectedProvider.toUpperCase()} API Key`}
              </button>
              {/* Error text dark style */}
              {!currentProviderApiKey && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  API Key required...
                </p>
              )}
            </div>
          )}

          {/* Provider Selection */}
          <div>
            {/* Label dark text */}
            <label
              htmlFor="providerSelect"
              className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              Provider:
            </label>
            {/* Select dark styles */}
            <select
              title="Choose your provider"
              id="providerSelect"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            {/* Label dark text */}
            <label
              htmlFor="modelSelect"
              className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              Model:
            </label>
            {/* Select dark styles */}
            <select
              title="Choose a specific model to run prompts on"
              id="modelSelect"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 disabled:opacity-70 dark:disabled:opacity-60 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              disabled={isLoadingModels || availableModelsList.length === 0}
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

      {/* Modal Rendering (Modal needs its own dark styles internally) */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={currentSetUserApiKey}
        currentApiKeyProp={currentProviderApiKey}
      />
    </>
  );
}
