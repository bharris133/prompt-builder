// src/app/components/PromptManagementModal.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { usePrompt } from '../hooks/usePrompt';
import { ListedPrompt } from '../context/PromptContext';

// Icons
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
  </svg>
);
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1H8.75zM10 4.888c-.081.01-.16.023-.238.038h.475c-.078-.015-.157-.028-.237-.038zM7.25 6.082V16.25h5.5V6.082H7.25z"
      clipRule="evenodd"
    />
  </svg>
);
const LoadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const CancelIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);
const CloseButtonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);

interface PromptManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromptManagementModal({
  isOpen,
  onClose,
}: PromptManagementModalProps) {
  const {
    savedPromptList,
    isLoadingSavedPrompts,
    fetchUserPrompts,
    handleDeleteSavedPrompt,
    handleRenamePrompt,
    setSelectedPromptToLoad,
  } = usePrompt();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('All');
  const [editingPrompt, setEditingPrompt] = useState<ListedPrompt | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [renameError, setRenameError] = useState<string | null>(null); // For inline rename errors
  const [hasFetchedOnceOnOpen, setHasFetchedOnceOnOpen] = useState(false);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    savedPromptList.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats).sort()];
  }, [savedPromptList]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedCategoryFilter('All');
      setEditingPrompt(null);
      setNewName('');
      setNewCategory('');
      setRenameError(null);
      setHasFetchedOnceOnOpen(false);
    } else {
      // Fetch only if modal is just opened AND (list is empty OR we always want a refresh)
      // For now, let's refresh if it hasn't fetched for this modal opening yet
      if (!isLoadingSavedPrompts && !hasFetchedOnceOnOpen) {
        console.log(
          '[PromptManagementModal] Modal opened, calling fetchUserPrompts.'
        );
        fetchUserPrompts();
        setHasFetchedOnceOnOpen(true);
      }
    }
  }, [isOpen, fetchUserPrompts, isLoadingSavedPrompts, hasFetchedOnceOnOpen]); // Dependencies for opening logic

  const filteredPrompts = useMemo(
    () =>
      savedPromptList.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (selectedCategoryFilter === 'All' ||
            p.category === selectedCategoryFilter)
      ),
    [savedPromptList, searchTerm, selectedCategoryFilter]
  );

  const startRename = (prompt: ListedPrompt) => {
    setEditingPrompt(prompt);
    setNewName(prompt.name);
    setNewCategory(prompt.category || '');
    setRenameError(null);
  };
  const cancelRename = () => {
    setEditingPrompt(null);
    setNewName('');
    setNewCategory('');
    setRenameError(null);
  };

  // --- CORRECTED submitRename ---
  const submitRename = async () => {
    if (!editingPrompt) return;
    setRenameError(null); // Clear previous error

    const trimmedNewName = newName.trim();
    const categoryToSave =
      newCategory.trim() === '' ? null : newCategory.trim();
    // Use original name if trimmedNewName is empty, only if user actually changed the name input to blank
    const nameToSend =
      trimmedNewName === '' && newName !== editingPrompt.name
        ? ''
        : trimmedNewName || editingPrompt.name;

    const nameChanged = nameToSend !== editingPrompt.name;
    const categoryChanged = categoryToSave !== (editingPrompt.category || null);

    if (!nameChanged && !categoryChanged) {
      cancelRename(); // No changes made
      return;
    }

    if (!nameToSend) {
      // Check if the final name to send is empty
      setRenameError('Prompt name cannot be empty.');
      const nameInputEl = document.getElementById(
        `rename-prompt-name-${editingPrompt.id}`
      ) as HTMLInputElement | null;
      nameInputEl?.focus();
      return;
    }

    const result = await handleRenamePrompt(
      editingPrompt.id,
      nameToSend,
      categoryToSave
    );

    if (result.success) {
      cancelRename();
    } else {
      setRenameError(result.error || 'Failed to rename prompt.');
      const nameInputEl = document.getElementById(
        `rename-prompt-name-${editingPrompt.id}`
      ) as HTMLInputElement | null;
      if (nameInputEl) {
        nameInputEl.focus();
        nameInputEl.select();
      }
    }
  };
  // --- END CORRECTED submitRename ---

  const loadPromptAndClose = (promptId: string) => {
    setSelectedPromptToLoad(promptId);
    onClose();
  };
  const deletePrompt = async (promptId: string) => {
    const p = savedPromptList.find((pr) => pr.id === promptId);
    if (p && window.confirm(`Delete: "${p.name}"?`)) {
      await handleDeleteSavedPrompt(promptId);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm dark:bg-opacity-75"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xl mx-4 h-[70vh] max-h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Manage My Prompts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full"
            aria-label="Close modal"
          >
            <CloseButtonIcon />
          </button>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px] sm:min-w-[180px]"
            title="Filter by category"
          >
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat || 'Uncategorized'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-grow overflow-y-auto pr-1 sm:pr-2 space-y-2">
          {isLoadingSavedPrompts && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Loading prompts...
            </p>
          )}
          {!isLoadingSavedPrompts && filteredPrompts.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No prompts found.
            </p>
          )}
          {!isLoadingSavedPrompts &&
            filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/40 flex flex-col sm:flex-row sm:justify-between sm:items-start hover:shadow-md dark:hover:bg-gray-700/70 transition-shadow"
              >
                {editingPrompt?.id === prompt.id ? (
                  <div className="flex-grow flex flex-col space-y-2 w-full mb-2 sm:mb-0 sm:mr-2">
                    <div>
                      {' '}
                      {/* Container for name input and its error */}
                      <input
                        id={`rename-prompt-name-${editingPrompt.id}`}
                        type="text"
                        value={newName}
                        onChange={(e) => {
                          setNewName(e.target.value);
                          setRenameError(null);
                        }}
                        placeholder="New prompt name"
                        className={`w-full p-1.5 border rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-600 focus:ring-1 ${renameError ? 'border-red-500 dark:border-red-400 focus:ring-red-500' : 'border-indigo-500 dark:border-indigo-400 focus:ring-indigo-500'}`}
                      />
                      {renameError && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1 pl-1">
                          {renameError}
                        </p>
                      )}
                    </div>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category (optional)"
                      className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-600 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end space-x-2 mt-1">
                      <button
                        onClick={submitRename}
                        className="text-xs py-1 px-3 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelRename}
                        className="text-xs py-1 px-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-500 dark:hover:bg-gray-400 text-gray-700 dark:text-gray-200 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex-grow cursor-pointer group mb-2 sm:mb-0 min-w-0"
                    onClick={() => loadPromptAndClose(prompt.id)}
                  >
                    <p
                      className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate"
                      title={prompt.name}
                    >
                      {prompt.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Category:{' '}
                      {prompt.category || (
                        <span className="italic">Uncategorized</span>
                      )}
                    </p>
                    {prompt.updatedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated:{' '}
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex space-x-0.5 sm:space-x-1 flex-shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                  {editingPrompt?.id !== prompt.id && (
                    <button
                      onClick={() => loadPromptAndClose(prompt.id)}
                      title="Load Prompt"
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
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
                    className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                  >
                    {' '}
                    {editingPrompt?.id === prompt.id ? (
                      <CancelIcon />
                    ) : (
                      <EditIcon />
                    )}{' '}
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    title="Delete Prompt"
                    className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
          {' '}
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition duration-150 ease-in-out text-sm"
          >
            Close
          </button>{' '}
        </div>
      </div>
    </div>
  );
}
