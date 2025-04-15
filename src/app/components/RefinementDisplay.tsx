// src/app/components/RefinementDisplay.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect } from 'react';
import { usePrompt } from '../hooks/usePrompt';

// --- Helper Function for User-Friendly Errors ---
function formatErrorMessage(rawError: string | null): string | null {
    if (!rawError) return null;

    console.error("Raw refinement error:", rawError); // Log raw error for debugging

    if (rawError.includes('Incorrect API key')) {
        return "Invalid API Key: Please check the key entered in settings (User Key mode) or ensure the server key is correct (Managed mode).";
    }
    if (rawError.includes('rate limit') || rawError.includes('429')) {
        return "Rate Limit Exceeded: You've made too many requests. Please wait a moment and try again.";
    }
    if (rawError.includes('Failed to fetch') || rawError.includes('NetworkError')) {
         return "Network Error: Could not connect to the refinement service. Please check your internet connection.";
    }
    if (rawError.includes('status 500') || rawError.includes('server error')) {
         return "Server Error: The refinement service encountered an internal problem. Please try again later.";
    }
     if (rawError.includes('status 400') || rawError.includes('Invalid request')) {
         return "Invalid Request: There might be an issue with the prompt format sent for refinement.";
     }
     if (rawError.includes('No content received')) {
         return "Empty Response: The AI model did not return any refined content.";
     }
     // Fallback for other errors
    return `An unexpected error occurred: ${rawError}`;
}

export function RefinementDisplay() {
    const {
        isLoadingRefinement,
        refinedPromptResult,
        refinementError,
        handleRefinePrompt,
        generatedPrompt,
        refinementStrategy,
        userApiKey,
        loadRefinedPromptToCanvas,
    } = usePrompt();

    // --- NEW: State for copy feedback ---
    const [copyStatus, setCopyStatus] = useState<'original' | 'refined' | null>(null);

    // --- NEW: Clear copy status after a delay ---
    useEffect(() => {
        if (copyStatus) {
            const timer = setTimeout(() => setCopyStatus(null), 1500); // Clear after 1.5 seconds
            return () => clearTimeout(timer); // Cleanup timer on unmount or if status changes
        }
    }, [copyStatus]);

    const handleCopyRefined = () => {
        if (!refinedPromptResult || copyStatus) return; // Prevent copy if empty or already copying
        navigator.clipboard
            .writeText(refinedPromptResult)
            .then(() => setCopyStatus('refined')) // Set status on success
            .catch((err) => { console.error('Failed to copy refined: ', err); alert('Failed to copy.'); });
    };

    const handleCopyOriginal = () => {
        if (!generatedPrompt.trim() || copyStatus) return;
        navigator.clipboard
            .writeText(generatedPrompt)
            .then(() => setCopyStatus('original')) // Set status on success
            .catch((err) => { console.error('Failed to copy original: ', err); alert('Failed to copy.'); });
    };

    // Button disabling logic (unchanged)
    const isGeneratedPromptEmpty = !generatedPrompt.trim();
    const isUserKeyMissing = refinementStrategy === 'userKey' && !userApiKey;
    const isRefineDisabled = isLoadingRefinement || isGeneratedPromptEmpty || isUserKeyMissing;

    const getRefineButtonTitle = () => {
        if (isLoadingRefinement) return "Refining in progress...";
        if (isGeneratedPromptEmpty) return "Add components to generate a prompt first";
        if (isUserKeyMissing) return "Enter your API Key in settings (User Key mode)";
        return "Refine the generated prompt using the selected AI model";
    };

    // --- NEW: Get formatted error message ---
    const displayError = formatErrorMessage(refinementError);

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

            <div className="border border-gray-200 bg-gray-50 p-4 rounded shadow-sm min-h-[150px] space-y-4">
                {/* Original Prompt Display */}
                {generatedPrompt.trim() && !isLoadingRefinement && (refinedPromptResult || refinementError) && (
                    <div className="border-b border-gray-200 pb-3">
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="text-sm font-semibold text-gray-600">Original Prompt Sent:</h3>
                             <div className='relative flex items-center'> {/* Container for button + message */}
                                <span className={`text-xs text-green-600 mr-2 transition-opacity duration-300 ${copyStatus === 'original' ? 'opacity-100' : 'opacity-0'}`}>
                                    Copied!
                                </span>
                                 <button onClick={handleCopyOriginal} disabled={copyStatus === 'original'}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded disabled:opacity-50" title="Copy original prompt">
                                     Copy Original
                                 </button>
                             </div>
                         </div>
                         <pre className="text-xs whitespace-pre-wrap break-words text-gray-500 bg-white p-2 rounded border border-gray-100 max-h-40 overflow-y-auto">
                             {generatedPrompt}
                         </pre>
                    </div>
                )}

                {/* Loading State */}
                {isLoadingRefinement && (
                    <p className="text-gray-500 text-center animate-pulse py-4"> Communicating with AI... </p>
                )}

                {/* --- UPDATED: Error Display --- */}
                {displayError && !isLoadingRefinement && (
                    <div className="text-red-700 bg-red-100 border border-red-300 p-3 rounded">
                        <p className="font-semibold text-sm">Refinement Error:</p>
                        <p className="text-sm break-words">{displayError}</p> {/* Show formatted error */}
                    </div>
                )}

                {/* Refined Result Display */}
                {refinedPromptResult && !isLoadingRefinement && !refinementError && (
                    <div>
                         <div className="flex justify-between items-center mb-1 gap-2">
                             <h3 className="text-sm font-semibold text-green-700">Refined Prompt Received:</h3>
                              <div className='relative flex items-center'> {/* Container for button + message */}
                                 <span className={`text-xs text-green-600 mr-2 transition-opacity duration-300 ${copyStatus === 'refined' ? 'opacity-100' : 'opacity-0'}`}>
                                     Copied!
                                 </span>
                                 {/* --- Load to Canvas Button --- */}
                                 <button
                                     onClick={loadRefinedPromptToCanvas} // Call handler from context
                                     className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded"
                                     title="Replace canvas content with this refined prompt"
                                 >
                                     Load to Canvas
                                 </button>
                                 {/* --- End Load to Canvas Button --- */}
                                 <button onClick={handleCopyRefined} disabled={copyStatus === 'refined'}
                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded disabled:opacity-50" title="Copy refined prompt">
                                     Copy Refined
                                 </button>
                             </div>
                         </div>
                         <pre className="text-sm whitespace-pre-wrap break-words text-gray-800 bg-white p-3 rounded border border-gray-200">
                             {refinedPromptResult}
                         </pre>
                     </div>
                )}

                 {/* Initial Placeholder */}
                 {!isLoadingRefinement && !refinementError && !refinedPromptResult && (
                     <p className="text-gray-400 text-sm text-center pt-4"> Click "Refine Prompt" to get AI suggestions here. </p>
                 )}
            </div>
        </section>
    );
}