// src/app/components/Sidebar.tsx // COMPLETE FILE REPLACEMENT - FINAL V3

'use client';

import React from 'react'; // Removed useState as it's no longer needed locally
import { usePrompt } from '../hooks/usePrompt';
// import { RefinementStrategy } from '../context/PromptContext'; // Not directly used here
import { ApiKeyModal } from './ApiKeyModal';
import { AuthDisplay } from './AuthDisplay';

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
    // Sidebar visibility
    isSidebarOpen,
    toggleSidebar,
    // Prompts (from DB)
    savedPromptList,
    isLoadingSavedPrompts,
    selectedPromptToLoad,
    setSelectedPromptToLoad,
    handleDeleteSavedPrompt,
    // Templates (from DB - assuming context was updated)
    savedTemplateList,
    isLoadingSavedTemplates,
    selectedTemplateToLoad,
    setSelectedTemplateToLoad,
    handleDeleteTemplate,
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
    // Modal
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
  } = usePrompt();

  // --- Component types definition (Should be present) ---
  const componentTypes = [
    { name: 'Instruction', color: 'blue' },
    { name: 'Context', color: 'green' },
    { name: 'Role', color: 'purple' },
    { name: 'Example Input', color: 'yellow' },
    { name: 'Example Output', color: 'orange' },
    { name: 'Tools', color: 'teal' },
  ];

  // --- Button class generation (Should be present) ---
  const getButtonClass = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500',
      green:
        'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500',
      purple:
        'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-500',
      yellow:
        'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500',
      orange:
        'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500',
      teal: 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500',
    };
    const baseClass =
      'w-full text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out';
    return `${baseClass} ${colorMap[color] || 'bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500'}`;
  };
  // --- End button class generation ---

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
        : () => {
            console.error('No API key setter for provider:', selectedProvider);
          };
  const handleOpenApiKeyModal = () => {
    setIsApiKeyModalOpen(true);
  };

  // Template select/delete handlers (using context setters with ID)
  const onTemplateSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value; // Value is template.id
    setSelectedTemplateToLoad(templateId); // Call context setter with ID
  };
  const onDeleteTemplateClicked = () => {
    if (selectedTemplateToLoad) {
      // selectedTemplateToLoad is the ID from context
      handleDeleteTemplate(selectedTemplateToLoad); // Call context handler with ID
    }
  };

  // Prompt select/delete handlers (using context setters with ID)
  const onPromptSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const promptId = event.target.value; // Value is prompt.id
    setSelectedPromptToLoad(promptId); // Call context setter with ID
  };
  const onDeletePromptClicked = () => {
    if (selectedPromptToLoad) {
      // selectedPromptToLoad is the ID from context
      handleDeleteSavedPrompt(selectedPromptToLoad); // Call context handler with ID
    }
  };

  return (
    <>
      <aside
        className={`w-64 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col fixed inset-y-0 left-0 z-30 md:static md:flex-shrink-0 md:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'} `}
      >
        {/* Mobile Close Button */}
        <div className="flex justify-end md:hidden mb-2">
          {' '}
          <button
            onClick={toggleSidebar}
            className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>{' '}
        </div>
        {/* Load Saved Prompt Section */}
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
            onChange={onPromptSelected}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white
             dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500
              focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
            disabled={isLoadingSavedPrompts || savedPromptList.length === 0}
          >
            <option value="">
              {isLoadingSavedPrompts
                ? 'Loading...'
                : savedPromptList.length === 0
                  ? 'No prompts'
                  : '-- Select --'}
            </option>
            {/* Maps over list of {id, name} objects */}
            {savedPromptList.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}
          </select>
          <button
            onClick={onDeletePromptClicked}
            disabled={!selectedPromptToLoad}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedPromptToLoad
                ? `Delete selected prompt`
                : 'Select prompt to delete'
            }
          >
            {' '}
            Delete Selected Prompt{' '}
          </button>
        </div>
        {/* Load Template Section */}
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
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white
             dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500
              focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
            disabled={isLoadingSavedTemplates || savedTemplateList.length === 0}
          >
            <option value="">
              {isLoadingSavedTemplates
                ? 'Loading...'
                : savedTemplateList.length === 0
                  ? 'No templates'
                  : '-- Select --'}
            </option>
            {/* Maps over list of {id, name} objects */}
            {savedTemplateList.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={onDeleteTemplateClicked}
            disabled={!selectedTemplateToLoad}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedTemplateToLoad
                ? `Delete selected template`
                : 'Select template to delete'
            }
          >
            {' '}
            Delete Selected Template{' '}
          </button>
        </div>
        {/* Add Components Section */}
        <div className="mb-6 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {' '}
            Add Components{' '}
          </h2>
          {/* Correctly uses getButtonClass */}
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
        <div className="flex-grow"></div> {/* Spacer */}
        {/* Refinement Settings Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Refinement Settings
          </h2>
          {/* Full settings controls */}
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
          {refinementStrategy === 'userKey' && (
            <div>
              {' '}
              <button
                onClick={handleOpenApiKeyModal}
                className={`w-full text-sm py-2 px-3 rounded transition duration-150 ease-in-out ${currentProviderApiKey ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/60 text-green-800 dark:text-green-100 border border-green-300 dark:border-green-700' : 'bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-800/60 text-yellow-800 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700'}`}
              >
                {currentProviderApiKey
                  ? `${selectedProvider.toUpperCase()} Key Set (Edit)`
                  : `Enter ${selectedProvider.toUpperCase()} API Key`}
              </button>{' '}
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
        {/* --- END REFINEMENT SETTINGS SECTION --- */}
        <AuthDisplay /> {/* Auth display */}
      </aside>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={currentSetUserApiKey}
        currentApiKeyProp={currentProviderApiKey}
      />
    </>
  );
}
