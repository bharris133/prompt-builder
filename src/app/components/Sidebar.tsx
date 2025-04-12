// src/app/components/Sidebar.tsx // COMPLETE FILE REPLACEMENT (Final Version)

'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { RefinementStrategy } from '../context/PromptContext';
import { ApiKeyModal } from './ApiKeyModal'; // Import the modal component

export function Sidebar() {
    const {
        // Load/Delete state/handlers
        savedPromptNames,
        selectedPromptToLoad,
        handleLoadPrompt,
        handleDeleteSavedPrompt,
        // Add component handler
        addComponent,
        // Refinement state/handlers
        refinementStrategy,
        setRefinementStrategy,
        userApiKey,
        setUserApiKey,
        selectedProvider,
        setSelectedProvider,
        selectedModel,
        setSelectedModel,
        // Modal state/handlers
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
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
        const baseClass = "w-full text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out";
        return `${baseClass} ${colorMap[color] || 'bg-gray-500 hover:bg-gray-600'}`;
    }

    // Available models definition
    const availableModels: { [provider: string]: string[] } = {
        openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
        // anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'], // Example
    };
    const currentModels = availableModels[selectedProvider] || [selectedModel]; // Fallback

    // Modal open handler
    const handleOpenApiKeyModal = () => {
        setIsApiKeyModalOpen(true);
    };

    return (
        <> {/* Fragment needed for Sidebar + Modal */}
            <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto flex-shrink-0 flex flex-col">

                {/* --- Section 1: Load/Delete --- */}
                <div className="mb-6 space-y-2 flex-shrink-0">
                   <label htmlFor="loadPromptSelect" className="block text-lg font-semibold text-gray-700"> Load Prompt </label>
                   <select
                       id="loadPromptSelect"
                       value={selectedPromptToLoad}
                       onChange={handleLoadPrompt}
                       className="w-full p-2 border border-gray-300 rounded bg-white shadow-sm text-sm text-gray-900"
                       disabled={savedPromptNames.length === 0}
                   >
                       <option value="">{savedPromptNames.length === 0 ? 'No saved prompts' : '-- Select --'}</option>
                       {savedPromptNames.map(name => (<option key={name} value={name}>{name}</option>))}
                    </select>
                    <button
                       onClick={handleDeleteSavedPrompt}
                       className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                       disabled={!selectedPromptToLoad}
                       title={ selectedPromptToLoad ? `Delete the selected prompt "${selectedPromptToLoad}"` : 'Select a prompt to delete'}
                    >
                        Delete Selected Prompt
                    </button>
                </div>

                {/* --- Section 2: Add Components --- */}
                 <div className="mb-6 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4"> Add Components </h2>
                    {componentTypes.map((type) => (
                        <button key={type.name} onClick={() => addComponent(type.name)} className={getButtonClass(type.color)}> Add {type.name} </button>
                    ))}
                 </div>

                 {/* Spacer element */}
                 <div className="flex-grow"></div>

                 {/* --- Section 3: Refinement Settings --- */}
                 <div className="pt-4 border-t border-gray-200 space-y-3 flex-shrink-0">
                      <h2 className="text-lg font-semibold text-gray-700">Refinement Settings</h2>

                      {/* Strategy Selection */}
                      <fieldset className="space-y-1">
                          <legend className="text-sm font-medium text-gray-600">Refinement Mode:</legend>
                          <div className="flex items-center space-x-4">
                              {/* Label 1 */}
                              <label className="flex items-center space-x-1 text-sm cursor-pointer">
                                  <input
                                      type="radio" name="refinementStrategy" value="userKey"
                                      checked={refinementStrategy === 'userKey'}
                                      onChange={() => setRefinementStrategy('userKey')}
                                      className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                                  />
                                  <span className="text-gray-900 font-medium">Use My Key</span>
                              </label>
                              {/* Label 2 */}
                              <label className="flex items-center space-x-1 text-sm cursor-pointer">
                                  <input
                                      type="radio" name="refinementStrategy" value="managedKey"
                                      checked={refinementStrategy === 'managedKey'}
                                      onChange={() => setRefinementStrategy('managedKey')}
                                      className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                                  />
                                  <span className="text-gray-900 font-medium">Managed Service</span>
                              </label>
                          </div>
                      </fieldset>

                     {/* API Key Input Button */}
                     {refinementStrategy === 'userKey' && (
                         <div>
                             <button
                                 onClick={handleOpenApiKeyModal}
                                 className={`w-full text-sm py-2 px-3 rounded transition duration-150 ease-in-out ${
                                     userApiKey
                                         ? 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-300'
                                         : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300'
                                 }`}
                             >
                                 {userApiKey ? 'API Key Set (Edit)' : 'Enter Your API Key'}
                             </button>
                             {!userApiKey && (
                                 <p className="text-xs text-red-600 mt-1">API Key required for refinement in this mode.</p>
                             )}
                         </div>
                     )}

                     {/* Provider Selection */}
                     <div>
                         <label htmlFor="providerSelect" className="block text-sm font-medium text-gray-600 mb-1">Provider:</label>
                         <select
                             id="providerSelect"
                             value={selectedProvider}
                             onChange={(e) => setSelectedProvider(e.target.value)}
                             className="w-full p-2 border border-gray-300 rounded bg-white shadow-sm text-sm text-gray-900"
                         >
                             <option value="openai">OpenAI</option>
                             {/* <option value="anthropic" disabled>Anthropic (Soon)</option> */}
                         </select>
                     </div>

                      {/* Model Selection */}
                      <div>
                         <label htmlFor="modelSelect" className="block text-sm font-medium text-gray-600 mb-1">Model:</label>
                         <select
                             id="modelSelect"
                             value={selectedModel}
                             onChange={(e) => setSelectedModel(e.target.value)}
                             className="w-full p-2 border border-gray-300 rounded bg-white shadow-sm text-sm text-gray-900"
                             disabled={!currentModels.length}
                         >
                             {currentModels.length === 0 ? (
                                 <option value="">No models available</option>
                             ) : (
                                 currentModels.map(modelName => (
                                     <option key={modelName} value={modelName}>{modelName}</option>
                                 ))
                             )}
                         </select>
                     </div>
                 </div> {/* End Refinement Settings Div */}
            </aside>

            {/* Render the Modal */}
            <ApiKeyModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                currentApiKey={userApiKey}
                onSave={setUserApiKey}
            />
        </>
    );
}