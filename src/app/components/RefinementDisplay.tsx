// src/app/components/RefinementDisplay.tsx
'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt';

export function RefinementDisplay() {
    const {
        isLoadingRefinement,
        refinedPromptResult,
        refinementError,
        handleRefinePrompt,
        generatedPrompt, // Needed to disable refine button if source is empty
        refinementStrategy, // Needed for disabling logic
        userApiKey,       // Needed for disabling logic
    } = usePrompt();

    const handleCopyRefined = () => {
        if (!refinedPromptResult) return;
        navigator.clipboard
            .writeText(refinedPromptResult)
            .then(() => alert('Refined prompt copied!'))
            .catch((err) => {
                console.error('Failed to copy refined prompt: ', err);
                alert('Failed to copy.');
            });
    };

    // Determine if refine button should be disabled
    const isRefineDisabled =
        isLoadingRefinement ||
        !generatedPrompt.trim() ||
        (refinementStrategy === 'userKey' && !userApiKey);

    const getRefineButtonTitle = () => {
        if (isLoadingRefinement) return "Refining in progress...";
        if (!generatedPrompt.trim()) return "Add components to generate a prompt first";
        if (refinementStrategy === 'userKey' && !userApiKey) return "Enter your API Key in settings";
        return "Refine the generated prompt using the selected AI model";
    }

    return (
        <section className="p-6 pt-4"> {/* Reduced top padding slightly */}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                    AI Refinement
                </h2>
                <button
                    onClick={handleRefinePrompt}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isRefineDisabled}
                    title={getRefineButtonTitle()}
                >
                    {isLoadingRefinement ? 'Refining...' : 'Refine Prompt'}
                </button>
            </div>

            {/* Display Area for Results/Error/Loading */}
            <div className="border border-gray-200 bg-gray-50 p-4 rounded shadow-sm min-h-[100px]">
                {isLoadingRefinement && (
                    <p className="text-gray-500 text-center animate-pulse">
                        Communicating with AI...
                    </p>
                )}

                {refinementError && !isLoadingRefinement && (
                    <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                        <p className="font-semibold">Error during refinement:</p>
                        <p className="text-sm break-words">{refinementError}</p>
                    </div>
                )}

                {refinedPromptResult && !isLoadingRefinement && !refinementError && (
                    <div>
                         <div className="flex justify-end mb-1">
                             <button
                                onClick={handleCopyRefined}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded"
                                title="Copy refined prompt"
                             >
                                 Copy Refined
                             </button>
                         </div>
                         <pre className="text-sm whitespace-pre-wrap break-words text-gray-800">
                             {refinedPromptResult}
                         </pre>
                     </div>
                )}

                 {!isLoadingRefinement && !refinementError && !refinedPromptResult && (
                     <p className="text-gray-400 text-sm text-center pt-4">
                         Click "Refine Prompt" to get AI suggestions here.
                     </p>
                 )}
            </div>
        </section>
    );
}