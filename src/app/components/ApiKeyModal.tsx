// src/app/components/ApiKeyModal.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrompt } from '../hooks/usePrompt'; // Import usePrompt
import { ApiKeyValidationStatus } from '../context/PromptContext'; // Import status type

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Remove currentApiKey prop, get it from context instead
    // currentApiKey: string;
    onSave: (newKey: string) => void; // Function to call when saving (setUserApiKey)
}

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
    // Get context values needed here
    const {
        userApiKey, // Get current key from context
        validateUserApiKey,
        apiKeyValidationStatus,
        apiKeyValidationError,
    } = usePrompt();

    // Local state for the input field only
    const [apiKeyInput, setApiKeyInput] = useState('');

    // Sync local input state with context key when modal opens or context key changes
    useEffect(() => {
        if (isOpen) {
            setApiKeyInput(userApiKey); // Initialize with current key from context
        }
    }, [isOpen, userApiKey]);

    const handleValidation = () => {
        validateUserApiKey(apiKeyInput); // Call context validation function
    };

    const handleSaveClick = () => {
        // Optionally only allow save if key is validated? Or let user save anyway?
        // if (apiKeyValidationStatus !== 'valid') {
        //     alert("Please validate the key before saving.");
        //     return;
        // }
        onSave(apiKeyInput); // Pass the input value to the save function
        onClose(); // Close the modal
    };

    // Handle Escape key press
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);
    useEffect(() => { 
        if (isOpen) { document.addEventListener('keydown', handleKeyDown); }
        else { document.removeEventListener('keydown', handleKeyDown); }
        return () => { document.removeEventListener('keydown', handleKeyDown); }; 
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    // Determine button/input states based on validation status
    const isValidating = apiKeyValidationStatus === 'validating';
    const isValid = apiKeyValidationStatus === 'valid';
    const isInvalid = apiKeyValidationStatus === 'invalid';
    // Allow save even if not validated or invalid for now
    const canSave = !isValidating;


    return (
        // Overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose} >
            {/* Modal Container */}
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative" onClick={(e) => e.stopPropagation()} >
                 <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold" aria-label="Close"> × </button>
                 <h2 className="text-xl font-semibold text-gray-800 mb-4"> Enter API Key (User Mode) </h2>
                {/* Security Warning */}
                <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm p-3 rounded mb-4">
                    <p className="font-semibold">Security Notice:</p>
                    <ul className="list-disc list-inside mt-1">
                        <li>Your API key will be stored temporarily in your browser's memory <strong className='underline'>for this session only</strong>.</li>
                        <li>It will be sent directly from your browser to the AI provider (e.g., OpenAI).</li>
                        <li>It will <strong className='underline'>never</strong> be sent to or stored on our servers when using this mode.</li>
                        <li>Be cautious about entering secret keys into any web application. Close the browser tab/window to clear the key from memory.</li>
                    </ul>
                </div>

                 {/* Input Field & Validation Button */}
                 <div className="mb-1"> {/* Reduced bottom margin */}
                     <label htmlFor="apiKeyInputModal" className="block text-sm font-medium text-gray-700 mb-1"> Your OpenAI API Key: </label>
                     <div className="flex items-center space-x-2">
                         <input
                             type="password" id="apiKeyInputModal" value={apiKeyInput}
                             onChange={(e) => setApiKeyInput(e.target.value)}
                             placeholder="sk-..."
                             className="flex-grow p-2 border border-gray-300 rounded shadow-sm text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70"
                             disabled={isValidating} // Disable input while validating
                         />
                         <button
                             onClick={handleValidation}
                             className="py-2 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition disabled:opacity-50"
                             disabled={isValidating || !apiKeyInput.trim()} // Disable if validating or input empty
                             title="Check if the entered key is valid with the selected provider"
                         >
                             {isValidating ? 'Validating...' : 'Validate'}
                         </button>
                     </div>
                 </div>

                {/* Validation Feedback Area */}
                 <div className="text-xs min-h-[18px] mb-4 pl-1"> {/* Added min-height */}
                     {isValidating && ( <span className="text-gray-500">Checking key...</span> )}
                     {isInvalid && apiKeyValidationError && ( <span className="text-red-600">❌{apiKeyValidationError}</span> )}
                     {isValid && ( <span className="text-green-600 font-medium">✅ Key appears valid!</span> )}
                 </div>


                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                     <button onClick={onClose} disabled={isValidating}
                        className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition duration-150 ease-in-out text-sm disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleSaveClick} disabled={!canSave || !apiKeyInput.trim()}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition duration-150 ease-in-out text-sm disabled:opacity-50"
                        title={!apiKeyInput.trim() ? "Enter an API key first" : "Save key for this session"}
                    >
                         Save Key (for Session)
                    </button>
                </div>
            </div>
        </div>
    );
}