// src/app/components/ApiKeyModal.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentApiKey: string; // Pass the current key to pre-fill
    onSave: (newKey: string) => void; // Function to call when saving
}

export function ApiKeyModal({ isOpen, onClose, currentApiKey, onSave }: ApiKeyModalProps) {
    const [apiKeyInput, setApiKeyInput] = useState(currentApiKey);
    // *** NEW state for save feedback ***
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Update internal state if the prop changes
    useEffect(() => {
        setApiKeyInput(currentApiKey);
    }, [currentApiKey]);

    // Reset input and status when modal opens
    useEffect(() => {
        if (isOpen) {
            setApiKeyInput(currentApiKey);
            setSaveStatus('idle'); // Reset status on open
        }
    }, [isOpen, currentApiKey]);


    const handleSaveClick = () => {
        setSaveStatus('saving');
        onSave(apiKeyInput); // Pass the input value to the save function (updates context state)
        // Simulate save confirmation and close
        setSaveStatus('saved');
        setTimeout(() => {
            setSaveStatus('idle'); // Reset status
            onClose(); // Close the modal after a short delay
        }, 1000); // Close after 1 second
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
                 {/* Input Field */}
                 <div className="mb-5">
                     <label htmlFor="apiKeyInputModal" className="block text-sm font-medium text-gray-700 mb-1"> Your OpenAI API Key: </label>
                     <input
                         type="password" id="apiKeyInputModal" value={apiKeyInput}
                         onChange={(e) => setApiKeyInput(e.target.value)}
                         placeholder="sk-..."
                         className="w-full p-2 border border-gray-300 rounded shadow-sm text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                         disabled={saveStatus === 'saving' || saveStatus === 'saved'} // Disable input during/after save
                     />
                 </div>

                {/* Action Buttons & Feedback */}
                <div className="flex justify-between items-center"> {/* Changed layout slightly */}
                    {/* Feedback Area */}
                    <div className="text-sm h-5"> {/* Fixed height to prevent layout shift */}
                        {saveStatus === 'saved' && (
                            <span className="text-green-600 font-medium">Key saved for session!</span>
                        )}
                         {saveStatus === 'saving' && (
                            <span className="text-gray-500">Saving...</span>
                        )}
                    </div>

                     {/* Buttons */}
                    <div className="flex space-x-3">
                         <button onClick={onClose} disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition duration-150 ease-in-out text-sm disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={handleSaveClick} disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition duration-150 ease-in-out text-sm disabled:opacity-50">
                            {saveStatus === 'saving' ? 'Saving...' : 'Save Key (for Session)'}
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
}