// src/app/components/Sidebar.tsx
'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt'; // Import the custom hook

export function Sidebar() {
    // Get necessary state and functions from the context
    const {
        savedPromptNames,
        selectedPromptToLoad,
        handleLoadPrompt,
        handleDeleteSavedPrompt,
        addComponent,
    } = usePrompt();

    const componentTypes = [
        { name: 'Instruction', color: 'blue' },
        { name: 'Context', color: 'green' },
        { name: 'Role', color: 'purple' },
        { name: 'Example Input', color: 'yellow' },
        { name: 'Example Output', color: 'orange' },
        { name: 'Tools', color: 'teal' }, // Add Tools here
    ];

    // Dynamically generate button classes based on color
    const getButtonClass = (color: string) => {
        // Mapping from simple color name to Tailwind classes
        const colorMap: { [key: string]: string } = {
             blue: 'bg-blue-500 hover:bg-blue-600',
             green: 'bg-green-500 hover:bg-green-600',
             purple: 'bg-purple-500 hover:bg-purple-600',
             yellow: 'bg-yellow-500 hover:bg-yellow-600',
             orange: 'bg-orange-500 hover:bg-orange-600',
             teal: 'bg-teal-500 hover:bg-teal-600',
        };
        const baseClass = "w-full text-white font-bold py-2 px-4 rounded mb-2 transition duration-150 ease-in-out";
        return `${baseClass} ${colorMap[color] || 'bg-gray-500 hover:bg-gray-600'}`; // Fallback to gray
    }


    return (
        <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            {/* Load/Delete Section */}
            <div className="mb-6 space-y-2">
                <label
                    htmlFor="loadPromptSelect"
                    className="block text-lg font-semibold text-gray-700"
                >
                    Load Prompt
                </label>
                <select
                    id="loadPromptSelect"
                    value={selectedPromptToLoad}
                    onChange={handleLoadPrompt} // Use handler from context
                    className="w-full p-2 border border-gray-300 rounded bg-white shadow-sm text-sm text-gray-900"
                    disabled={savedPromptNames.length === 0}
                >
                    <option value="">
                        {savedPromptNames.length === 0
                            ? 'No saved prompts'
                            : '-- Select --'}
                    </option>
                    {savedPromptNames.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleDeleteSavedPrompt} // Use handler from context
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPromptToLoad}
                    title={
                        selectedPromptToLoad
                            ? `Delete the selected prompt "${selectedPromptToLoad}"`
                            : 'Select a prompt to delete'
                    }
                >
                    Delete Selected Prompt
                </button>
            </div>

            {/* Add Components Section */}
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Add Components
            </h2>
            {/* Map over component types to create buttons */}
            {componentTypes.map((type) => (
                 <button
                    key={type.name}
                    onClick={() => addComponent(type.name)} // Use handler from context
                    className={getButtonClass(type.color)}
                >
                   Add {type.name}
                </button>
            ))}
        </aside>
    );
}

// Optional: export default Sidebar;