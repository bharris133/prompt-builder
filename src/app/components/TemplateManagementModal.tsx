// src/app/components/TemplateManagementModal.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { usePrompt } from '../hooks/usePrompt';
import { ListedTemplate } from '../context/PromptContext';

// Icons (Ensure these are defined or imported - EditIcon, DeleteIcon, LoadIcon, CancelIcon, CloseButtonIcon)
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

interface TemplateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateManagementModal({
  isOpen,
  onClose,
}: TemplateManagementModalProps) {
  const {
    savedTemplateList, // Use this for templates
    isLoadingSavedTemplates,
    fetchUserTemplates, // Use this to refresh
    handleDeleteTemplate,
    handleRenameTemplate, // Use this for renaming
    setSelectedTemplateToLoad, // Context setter which also loads
  } = usePrompt();

  const [searchTerm, setSearchTerm] = useState('');
  // Note: Templates don't have categories in our current DB schema.
  // If we add categories to templates later, we'd add a category filter here.
  const [editingTemplate, setEditingTemplate] = useState<ListedTemplate | null>(
    null
  );
  const [newName, setNewName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null); // For inline rename errors
  const [hasFetchedOnceOnOpen, setHasFetchedOnceOnOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setEditingTemplate(null);
      setNewName('');
      setRenameError(null);
      setHasFetchedOnceOnOpen(false);
    } else {
      if (
        savedTemplateList.length === 0 &&
        !isLoadingSavedTemplates &&
        !hasFetchedOnceOnOpen
      ) {
        fetchUserTemplates();
        setHasFetchedOnceOnOpen(true);
      }
    }
  }, [
    isOpen,
    fetchUserTemplates,
    isLoadingSavedTemplates,
    hasFetchedOnceOnOpen,
    savedTemplateList.length,
  ]);

  const filteredTemplates = useMemo(
    () =>
      savedTemplateList.filter((template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [savedTemplateList, searchTerm]
  );

  const startRename = (template: ListedTemplate) => {
    setEditingTemplate(template);
    setNewName(template.name);
    setRenameError(null);
  };
  const cancelRename = () => {
    setEditingTemplate(null);
    setNewName('');
    setRenameError(null);
  };

  const submitRename = async () => {
    if (!editingTemplate) return;
    setRenameError(null);

    const trimmedNewName = newName.trim();
    const nameToSend =
      trimmedNewName === '' ? editingTemplate.name : trimmedNewName;

    if (!nameToSend) {
      setRenameError('Template name cannot be empty.');
      const nameInputEl = document.getElementById(
        `rename-template-name-${editingTemplate.id}`
      ) as HTMLInputElement | null;
      nameInputEl?.focus();
      return;
    }
    if (nameToSend === editingTemplate.name) {
      cancelRename();
      return;
    } // No change

    // For templates, handleRenameTemplate only takes id and newName
    const result = await handleRenameTemplate(editingTemplate.id, nameToSend);

    if (result.success) {
      cancelRename();
    } else {
      setRenameError(result.error || 'Failed to rename template.');
      const nameInputEl = document.getElementById(
        `rename-template-name-${editingTemplate.id}`
      ) as HTMLInputElement | null;
      if (nameInputEl) {
        nameInputEl.focus();
        nameInputEl.select();
      }
    }
  };

  const loadTemplateAndClose = (templateId: string) => {
    setSelectedTemplateToLoad(templateId);
    onClose();
  };
  const deleteTemplate = async (templateId: string) => {
    const t = savedTemplateList.find((tpl) => tpl.id === templateId);
    if (t && window.confirm(`Delete template: "${t.name}"?`)) {
      await handleDeleteTemplate(templateId);
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
            Manage My Templates
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full"
            aria-label="Close modal"
          >
            <CloseButtonIcon />
          </button>
        </div>

        <div className="mb-4">
          {' '}
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search templates by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex-grow overflow-y-auto pr-1 sm:pr-2 space-y-2">
          {' '}
          {/* Template List */}
          {isLoadingSavedTemplates && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Loading templates...
            </p>
          )}
          {!isLoadingSavedTemplates && filteredTemplates.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No templates found.
            </p>
          )}
          {!isLoadingSavedTemplates &&
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/40 flex flex-col sm:flex-row sm:justify-between sm:items-start hover:shadow-md dark:hover:bg-gray-700/70 transition-shadow"
              >
                {editingTemplate?.id === template.id ? (
                  <div className="flex-grow flex flex-col space-y-2 w-full mb-2 sm:mb-0 sm:mr-2">
                    <div>
                      {' '}
                      {/* Name input and error */}
                      <input
                        id={`rename-template-name-${editingTemplate.id}`}
                        type="text"
                        value={newName}
                        onChange={(e) => {
                          setNewName(e.target.value);
                          setRenameError(null);
                        }}
                        placeholder="New template name"
                        className={`w-full p-1.5 border rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-600 focus:ring-1 ${renameError ? 'border-red-500 dark:border-red-400 focus:ring-red-500' : 'border-indigo-500 dark:border-indigo-400 focus:ring-indigo-500'}`}
                      />
                      {renameError && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1 pl-1">
                          {renameError}
                        </p>
                      )}
                    </div>
                    {/* Templates do not have categories in our current schema, so no category input here */}
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
                    onClick={() => loadTemplateAndClose(template.id)}
                  >
                    <p
                      className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate"
                      title={template.name}
                    >
                      {template.name}
                    </p>
                    {/* Templates don't have categories displayed here currently */}
                    {template.updatedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated:{' '}
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex space-x-0.5 sm:space-x-1 flex-shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                  {' '}
                  {/* Action Buttons */}
                  {editingTemplate?.id !== template.id && (
                    <button
                      onClick={() => loadTemplateAndClose(template.id)}
                      title="Load Template"
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <LoadIcon />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      editingTemplate?.id === template.id
                        ? cancelRename()
                        : startRename(template)
                    }
                    title={
                      editingTemplate?.id === template.id
                        ? 'Cancel Rename'
                        : 'Rename Template'
                    }
                    className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                  >
                    {' '}
                    {editingTemplate?.id === template.id ? (
                      <CancelIcon />
                    ) : (
                      <EditIcon />
                    )}{' '}
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    title="Delete Template"
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
