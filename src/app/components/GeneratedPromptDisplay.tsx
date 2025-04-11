// src/app/components/GeneratedPromptDisplay.tsx
'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt'; // Import the custom hook

export function GeneratedPromptDisplay() {
    const { generatedPrompt } = usePrompt(); // Get the pre-formatted prompt string

    const handleCopy = () => {
        if (!generatedPrompt.trim()) return; // Don't copy if empty
        navigator.clipboard
            .writeText(generatedPrompt)
            .then(() => {
                // Optional: Show temporary feedback like "Copied!"
                console.log('Prompt copied to clipboard');
                alert('Prompt copied to clipboard!'); // Simple alert feedback
            })
            .catch((err) => {
                console.error('Failed to copy prompt: ', err);
                alert('Failed to copy prompt.');
            });
    };

    return (
        <section className="p-6 pt-0">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800">
                    Generated Prompt
                </h2>
                <button
                    onClick={handleCopy}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!generatedPrompt.trim()} // Disable if prompt is empty
                    title="Copy prompt to clipboard"
                >
                    Copy
                </button>
            </div>
            <div className="bg-gray-800 text-white p-4 rounded shadow overflow-auto max-h-60 relative group">
                <pre className="text-sm whitespace-pre-wrap break-words">
                    {generatedPrompt || (
                        <span className="text-gray-400 italic">
                            No components added yet.
                        </span>
                    )}
                </pre>
            </div>
        </section>
    );
}

// Optional: export default GeneratedPromptDisplay;