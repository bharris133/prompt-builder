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
    } = usePrompt();

    return (
        <header className="bg-white shadow-md z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 space-x-4">
                    {/* App Title */}
                    <h1 className="text-2xl font-semibold text-gray-900 flex-shrink-0">
                        Prompt Builder
                    </h1>

                    {/* Save Prompt Section */}
                    <div className="flex items-center space-x-2 flex-grow min-w-0">
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
                            className="flex-grow p-2 border border-gray-300 rounded shadow-sm text-sm min-w-[150px] text-gray-900"
                        />
                        <button
                            onClick={handleSavePrompt}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
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

                    {/* Clear Canvas Button */}
                    <button
                        onClick={handleClearCanvas}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
                        disabled={components.length === 0 && !promptName.trim()} // Disable if canvas and name are empty
                        title="Clear the current canvas (does not delete saved prompts)"
                    >
                        Clear Canvas
                    </button>
                </div>
            </div>
        </header>
    );
}

// Optional: export default Header;