// src/app/components/Header.tsx
'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt'; // Import the custom hook

export function Header() {
  // Get necessary state and functions from the context
  const {
    promptName,
    components, // Needed to disable buttons correctly
    handleSavePrompt,
    handleClearCanvas,
    setPromptNameDirectly, // Use the specific setter for the input
    handleSaveAsTemplate, // <-- Get new handler
  } = usePrompt();

  const triggerSaveAsTemplate = () => {
    // Use window.prompt for simplicity, replace with modal later if needed
    const templateName = window.prompt(
      'Enter a name for this template:',
      promptName + ' Template'
    ); // Suggest name
    if (templateName) {
      // Check if user entered a name and didn't cancel
      const success = handleSaveAsTemplate(templateName);
      // Optional: Add feedback based on success boolean? Already handled by alert in context.
    }
  };

  return (
    <header className="bg-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center h-auto md:h-16  gap-y-2 py-2 md:py-0">
          {/* App Title */}
          <h1 className="text-2xl font-semibold text-gray-900 flex-shrink-0">
            Prompt Builder
          </h1>

          {/* Save Prompt Section */}
          <div className="flex items-center space-x-2 flex-grow min-w-[250px]">
            <label
              htmlFor="promptNameInput"
              className="text-sm font-medium text-gray-700 flex-shrink-0"
            >
              Prompt Name:
            </label>
            <input
              id="promptNameInput"
              type="text"
              value={promptName}
              onChange={(e) => setPromptNameDirectly(e.target.value)} // Use the specific setter
              placeholder="Enter or load name..."
              className="flex-grow p-2 border border-gray-300 rounded shadow-sm text-sm min-w-[100px] text-gray-900"
            />
            <button
              onClick={handleSavePrompt}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 md:px-4 rounded text-sm transition disabled:opacity-50" // Adjusted padding
              disabled={components.length === 0 || !promptName.trim()} // Disable if no components or name is empty
              title={
                components.length === 0
                  ? 'Add components before saving'
                  : !promptName.trim()
                    ? 'Enter a name to save'
                    : `Save prompt as "${promptName}"`
              }
            >
              Save Prompt
            </button>
          </div>
          {/* Template Save & Clear Section */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* --- NEW: Save as Template Button --- */}
            <button
              onClick={triggerSaveAsTemplate}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 md:px-4 rounded text-sm transition disabled:opacity-50" // Adjusted padding
              disabled={components.length === 0} // Disable if canvas is empty
              title={
                components.length === 0
                  ? 'Add components before saving template'
                  : 'Save current canvas structure as a reusable template'
              }
            >
              Save as Template
            </button>
            {/* --- End Save as Template Button --- */}

            {/* Clear Canvas Button */}
            <button
              onClick={handleClearCanvas}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 md:px-4 rounded text-sm transition disabled:opacity-50"
              disabled={
                components.length === 0 &&
                !promptName.trim() &&
                !promptName /* Also check refinement/vars later */
              } // Disable if canvas and name are empty
              title="Clear the current canvas (does not delete saved prompts)"
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Optional: export default Header;
