// src/app/components/PromptManagementModal.tsx // COMPLETE NEW FILE

'use client';

import React, { useState, useEffect } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { ListedPrompt } from '../context/PromptContext'; // Import type

interface PromptManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icons (can be moved to a shared file later)
const EditIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 12V7.172l1.414-1.414L10 9.172l-1.414 1.414L5 14H3v-2h2z"></path>
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 12V7.172l1.414-1.414L10 9.172l-1.414 1.414L5 14H3v-2h2zM19 19H1V1h18v2h-2V3H3v14h14v-2h2v4z"></path>
  </svg>
); // More complex edit icon
const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const LoadIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export function PromptManagementModal({
  isOpen,
  onClose,
}: PromptManagementModalProps) {
  const {
    savedPromptList,
    isLoadingSavedPrompts,
    fetchUserPrompts, // To refresh list after delete/rename
    handleLoadPrompt, // To load a prompt directly
    handleDeleteSavedPrompt,
    handleRenamePrompt, // We added this to context
    setSelectedPromptToLoad, // To set the selection for sidebar dropdown if needed
  } = usePrompt();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<ListedPrompt | null>(null);
  const [newName, setNewName] = useState('');

  // Fetch prompts when modal opens (if list is empty or to refresh)
  useEffect(() => {
    if (isOpen) {
      // Consider if fetching every time is needed or if context list is sufficient
      // fetchUserPrompts(); // Potentially, or rely on context's existing list
    }
  }, [isOpen, fetchUserPrompts]);

  const filteredPrompts = savedPromptList.filter((prompt) =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startRename = (prompt: ListedPrompt) => {
    setEditingPrompt(prompt);
    setNewName(prompt.name);
  };

  const cancelRename = () => {
    setEditingPrompt(null);
    setNewName('');
  };

  const submitRename = async () => {
    if (
      editingPrompt &&
      newName.trim() &&
      newName.trim() !== editingPrompt.name
    ) {
      const success = await handleRenamePrompt(
        editingPrompt.id,
        newName.trim()
      );
      if (success) {
        // fetchUserPrompts(); // Refresh list from DB
        // The optimistic update in context should handle UI for now
      }
    }
    cancelRename(); // Close rename input
  };

  const loadPrompt = (promptId: string) => {
    setSelectedPromptToLoad(promptId); // This will trigger load via context setter
    onClose(); // Close the management modal
  };

  const deletePrompt = async (promptId: string) => {
    // Confirm before deleting
    const promptToDelete = savedPromptList.find((p) => p.id === promptId);
    if (
      promptToDelete &&
      window.confirm(
        `Are you sure you want to delete prompt: "${promptToDelete.name}"?`
      )
    ) {
      await handleDeleteSavedPrompt(promptId);
      // fetchUserPrompts(); // Context's handleDeleteSavedPrompt should call fetchUserPrompts
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Manage My Prompts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search prompts by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Prompt List - Scrollable Area */}
        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
          {' '}
          {/* Added pr-2 for scrollbar space */}
          {isLoadingSavedPrompts && (
            <p className="text-gray-500 dark:text-gray-400">
              Loading prompts...
            </p>
          )}
          {!isLoadingSavedPrompts && filteredPrompts.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No prompts found or match your search.
            </p>
          )}
          {!isLoadingSavedPrompts &&
            filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center"
              >
                {editingPrompt?.id === prompt.id ? (
                  <div className="flex-grow flex items-center space-x-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                      onBlur={submitRename} // Save on blur
                      autoFocus
                      className="flex-grow p-1 border border-indigo-500 rounded text-sm dark:bg-gray-600 dark:text-gray-100"
                    />
                    <button
                      onClick={submitRename}
                      className="text-xs py-1 px-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelRename}
                      className="text-xs py-1 px-2 bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex-grow cursor-pointer"
                    onClick={() => loadPrompt(prompt.id)}
                  >
                    <p
                      className="font-medium text-gray-800 dark:text-gray-100 truncate"
                      title={prompt.name}
                    >
                      {prompt.name}
                    </p>
                    {prompt.updatedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated:{' '}
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex space-x-2 flex-shrink-0 ml-3">
                  {editingPrompt?.id !== prompt.id && (
                    <button
                      onClick={() => loadPrompt(prompt.id)}
                      title="Load Prompt"
                      className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <LoadIcon />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      editingPrompt?.id === prompt.id
                        ? cancelRename()
                        : startRename(prompt)
                    }
                    title={
                      editingPrompt?.id === prompt.id
                        ? 'Cancel Rename'
                        : 'Rename Prompt'
                    }
                    className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                  >
                    {editingPrompt?.id === prompt.id ? (
                      <span className="text-xs">X</span>
                    ) : (
                      <EditIcon />
                    )}
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    title="Delete Prompt"
                    className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Footer/Close Button */}
        <div className="mt-6 pt-4 border-t dark:border-gray-700 text-right">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition duration-150 ease-in-out text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
