// src/app/components/RefinementDisplay.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt';

export function RefinementDisplay() {
    const {
        isLoadingRefinement,
        refinedPromptResult,
        refinementError,
        handleRefinePrompt, // Ensure this is correctly retrieved
        generatedPrompt,
        refinementStrategy,
        userApiKey,
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
    const isGeneratedPromptEmpty = !generatedPrompt.trim();
    const isUserKeyMissing = refinementStrategy === 'userKey' && !userApiKey;
    const isRefineDisabled =
        isLoadingRefinement || isGeneratedPromptEmpty || isUserKeyMissing;

    // *** Add console log for debugging ***
    console.log('[RefinementDisplay] Button State:', {
        isLoadingRefinement,
        isGeneratedPromptEmpty,
        refinementStrategy,
        isUserKeyMissing,
        isRefineDisabled, // Final calculated value
    });

    const getRefineButtonTitle = () => {
        if (isLoadingRefinement) return "Refining in progress...";
        if (isGeneratedPromptEmpty) return "Add components to generate a prompt first";
        if (isUserKeyMissing) return "Enter your API Key in settings (User Key mode)";
        return "Refine the generated prompt using the selected AI model";
    }

    return (
        <section className="p-6 pt-4">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                    AI Refinement
                </h2>
                <button
                    onClick={handleRefinePrompt} // Verify this handler is correctly passed
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isRefineDisabled} // Check the console log value for this
                    title={getRefineButtonTitle()}
                >
                    {isLoadingRefinement ? 'Refining...' : 'Refine Prompt'}
                </button>
            </div>

            {/* Display Area for Results/Error/Loading */}
            <div className="border border-gray-200 bg-gray-50 p-4 rounded shadow-sm min-h-[100px]">
                {/* ... (Conditional rendering for loading, error, result unchanged) ... */}
                {isLoadingRefinement && ( <p>...</p> )}
                {refinementError && !isLoadingRefinement && ( <div>...</div> )}
                {refinedPromptResult && !isLoadingRefinement && !refinementError && ( <div>...</div> )}
                {!isLoadingRefinement && !refinementError && !refinedPromptResult && ( <p>...</p> )}
            </div>
        </section>
    );
}