// src/app/components/Header.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { ThemeToggle } from './ThemeToggle';

// Hamburger Icon Component
const MenuIcon = () => (
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
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

export function Header() {
  const {
    promptName,
    components,
    refinedPromptResult,
    refinementError,
    variableValues,
    handleSavePrompt,
    handleClearCanvas,
    setPromptNameDirectly,
    handleSaveAsTemplate,
    toggleSidebar, // Get sidebar toggle function
  } = usePrompt();

  // Handler for save template button
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
    <header className="bg-white dark:bg-gray-800 shadow-md dark:border-b dark:border-gray-700 z-10 flex-shrink-0">
      {/* Adjust padding for different screen sizes */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Allow wrapping, adjust vertical padding and height */}
        <div className="flex flex-wrap justify-between items-center gap-y-2 py-2 min-h-[4rem]">
          {' '}
          {/* Use min-h */}
          {/* Group Title and Hamburger */}
          <div className="flex items-center space-x-2 flex-shrink-0 mr-2 sm:mr-4 order-1">
            {' '}
            {/* Ensure this group comes first visually */}
            {/* Hamburger Button - Visible below md breakpoint */}
            <button
              onClick={toggleSidebar} // Attach handler
              className="md:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>
            {/* Title */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Prompt Builder
            </h1>
          </div>
          {/* End Group */}
          {/* Prompt Name & Save Instance Section */}
          {/* Order changes: Last on small screens, middle on medium+ */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-grow order-3 md:order-2 w-full md:w-auto min-w-0 md:min-w-[300px]">
            <label
              htmlFor="promptNameInput"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 hidden sm:inline"
            >
              Prompt Name:
            </label>
            <input
              id="promptNameInput"
              type="text"
              value={promptName}
              onChange={(e) => setPromptNameDirectly(e.target.value)}
              placeholder="Enter or load name..."
              title="Enter name for saving or loading prompts" // Added tooltip
              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 min-w-[100px]"
            />
            <button
              onClick={handleSavePrompt}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
              disabled={components.length === 0 || !promptName.trim()}
              title={
                components.length === 0
                  ? 'Add components first'
                  : !promptName.trim()
                    ? 'Enter prompt name to save'
                    : `Save prompt "${promptName}"`
              }
            >
              {/* Keep button text consistent for space */}
              Save Prompt
            </button>
          </div>
          {/* Template Save & Clear & Theme Section */}
          {/* Order changes: Middle on small, Last on medium+ */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 order-2 md:order-3">
            <button
              onClick={triggerSaveAsTemplate}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
              disabled={components.length === 0}
              title={
                components.length === 0
                  ? 'Add components to save template'
                  : 'Save canvas as template'
              }
            >
              {/* Responsive Text */}
              <span className="hidden sm:inline">Save as Template</span>
              <span className="sm:hidden">Template</span>
            </button>
            <button
              onClick={handleClearCanvas}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
              disabled={isClearDisabled}
              title={
                isClearDisabled
                  ? 'Canvas is already empty'
                  : 'Clear canvas, variables & results'
              }
            >
              {/* Responsive Text */}
              <span className="hidden sm:inline">Clear Canvas</span>
              <span className="sm:hidden">Clear</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
