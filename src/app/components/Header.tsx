// src/app/components/Header.tsx // COMPLETE FILE REPLACEMENT - FINAL

'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const {
    promptName,
    components,
    // Need refinement state to fully check clear button disable logic
    refinedPromptResult,
    refinementError,
    variableValues, // Need variable values for clear button logic
    // Handlers
    handleSavePrompt,
    handleClearCanvas,
    setPromptNameDirectly,
    handleSaveAsTemplate,
  } = usePrompt();

  // Trigger for saving template
  const triggerSaveAsTemplate = () => {
    const templateName = window.prompt(
      'Enter a name for this template:',
      promptName + ' Template'
    );
    if (templateName) {
      handleSaveAsTemplate(templateName);
    }
  };

  // Determine if clear button should be disabled
  const isClearDisabled =
    components.length === 0 &&
    !promptName.trim() &&
    !refinedPromptResult &&
    !refinementError &&
    Object.keys(variableValues).length === 0;

  return (
    // Apply dark mode background and border
    <header className="bg-white dark:bg-gray-800 shadow-md dark:border-b dark:border-gray-700 z-10 flex-shrink-0">
      {/* Ensure header doesn't shrink */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Use flex-wrap for smaller screens */}
        <div className="flex flex-wrap justify-between items-center h-auto md:h-16 gap-y-2 py-2 min-h-[4rem]">
          {/* min-h ensures minimum height */}
          {/* Title */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 mr-2 sm:mr-4">
            Prompt Builder
          </h1>

          {/* Prompt Name & Save Instance Section */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-grow order-3 md:order-2 w-full md:w-auto min-w-0 md:min-w-[300px]">
            {/* Label dark style */}
            <label
              htmlFor="promptNameInput"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 hidden sm:inline"
            >
              Prompt Name:
            </label>
            {/* Input dark styles */}
            <input
              id="promptNameInput"
              type="text"
              value={promptName}
              onChange={(e) => setPromptNameDirectly(e.target.value)}
              placeholder="Enter or load name..."
              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100
               bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600
                dark:focus:border-indigo-600  min-w-[100px]"
            />
            {/* Save Prompt Button */}
            <button
              onClick={handleSavePrompt}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 md:px-4 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
              disabled={components.length === 0 || !promptName.trim()}
              title={
                components.length === 0
                  ? 'Add components first'
                  : !promptName.trim()
                    ? 'Enter prompt name'
                    : `Save prompt "${promptName}"`
              }
            >
              Save Prompt
            </button>
          </div>

          {/* Template Save & Clear Section */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 order-2 md:order-3">
            {/* Save Template Button */}
            <button
              onClick={triggerSaveAsTemplate}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm transition disabled:opacity-50"
              disabled={components.length === 0}
              title={
                components.length === 0
                  ? 'Add components to save template'
                  : 'Save canvas as template'
              }
            >
              {/* Hide text on small screens, show icon only? Optional */}
              <span className="hidden sm:inline">Save as Template</span>
              <span className="sm:hidden">Save Tmplt</span>{' '}
              {/* Example for small */}
            </button>
            {/* Clear Canvas Button */}
            <button
              onClick={handleClearCanvas}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded text-sm transition disabled:opacity-50"
              disabled={isClearDisabled} // Use calculated disabled state
              title={
                isClearDisabled
                  ? 'Canvas is already empty'
                  : 'Clear canvas, variables & results'
              }
            >
              <span className="hidden sm:inline">Clear Canvas</span>
              <span className="sm:hidden">Clear</span> {/* Example for small */}
            </button>
            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
