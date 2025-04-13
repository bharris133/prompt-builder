// src/app/components/RefinementDisplay.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React from 'react';
import { usePrompt } from '../hooks/usePrompt';

export function RefinementDisplay() {
    const {
        isLoadingRefinement,
        refinedPromptResult,
        refinementError,
        handleRefinePrompt,
        generatedPrompt, // Needed to disable button AND display as input
        refinementStrategy,
        userApiKey,
    } = usePrompt();

    const handleCopyRefined = () => {
        if (!refinedPromptResult) return;
        navigator.clipboard
            .writeText(refinedPromptResult)
            .then(() => alert('Refined prompt copied!'))
            .catch((err) => { console.error('Failed to copy refined prompt: ', err); alert('Failed to copy.'); });
    };

    const handleCopyOriginal = () => {
        if (!generatedPrompt.trim()) return;
        navigator.clipboard
            .writeText(generatedPrompt)
            .then(() => alert('Original prompt copied!'))
            .catch((err) => { console.error('Failed to copy original prompt: ', err); alert('Failed to copy.'); });
    };


    // Determine if refine button should be disabled
    const isGeneratedPromptEmpty = !generatedPrompt.trim();
    const isUserKeyMissing = refinementStrategy === 'userKey' && !userApiKey;
    const isRefineDisabled = isLoadingRefinement || isGeneratedPromptEmpty || isUserKeyMissing;

    const getRefineButtonTitle = () => {
        if (isLoadingRefinement) return "Refining in progress...";
        if (isGeneratedPromptEmpty) return "Add components to generate a prompt first";
        if (isUserKeyMissing) return "Enter your API Key in settings (User Key mode)";
        return "Refine the generated prompt using the selected AI model";
    }

    return (
        <section className="p-6 pt-4">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800"> AI Refinement </h2>
                <button onClick={handleRefinePrompt} disabled={isRefineDisabled} title={getRefineButtonTitle()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoadingRefinement ? 'Refining...' : 'Refine Prompt'}
                </button>
            </div>

            {/* Display Area for Input/Results/Error/Loading */}
            <div className="border border-gray-200 bg-gray-50 p-4 rounded shadow-sm min-h-[150px] space-y-4"> {/* Added space-y */}

                {/* --- Display Original Prompt Sent --- */}
                {generatedPrompt.trim() && !isLoadingRefinement && (refinedPromptResult || refinementError) && ( // Show original only when there's a result/error
                    <div className="border-b border-gray-200 pb-3">
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="text-sm font-semibold text-gray-600">Original Prompt Sent:</h3>
                             <button onClick={handleCopyOriginal} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded" title="Copy original prompt">
                                 Copy Original
                             </button>
                         </div>
                         <pre className="text-xs whitespace-pre-wrap break-words text-gray-500 bg-white p-2 rounded border border-gray-100 max-h-40 overflow-y-auto">
                             {generatedPrompt}
                         </pre>
                    </div>
                )}
                {/* --- End Original Prompt Display --- */}


                {/* --- Display Loading State --- */}
                {isLoadingRefinement && (
                    <p className="text-gray-500 text-center animate-pulse py-4"> Communicating with AI... </p>
                )}

                {/* --- Display Error --- */}
                {refinementError && !isLoadingRefinement && (
                    <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                        <p className="font-semibold">Error during refinement:</p>
                        <p className="text-sm break-words">{refinementError}</p>
                    </div>
                )}

                 {/* --- Display Refined Result --- */}
                {refinedPromptResult && !isLoadingRefinement && !refinementError && (
                    <div>
                         <div className="flex justify-between items-center mb-1">
                             <h3 className="text-sm font-semibold text-green-700">Refined Prompt Received:</h3>
                             <button onClick={handleCopyRefined} className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded" title="Copy refined prompt">
                                 Copy Refined
                             </button>
                         </div>
                         <pre className="text-sm whitespace-pre-wrap break-words text-gray-800 bg-white p-3 rounded border border-gray-200">
                             {refinedPromptResult}
                         </pre>
                     </div>
                )}

                 {/* --- Display Initial Placeholder --- */}
                 {!isLoadingRefinement && !refinementError && !refinedPromptResult && (
                     <p className="text-gray-400 text-sm text-center pt-4"> Click "Refine Prompt" to get AI suggestions here. </p>
                 )}
            </div>
        </section>
    );
}