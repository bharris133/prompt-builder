// src/app/components/TemplateManagementModal.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect } from 'react'; // Removed useCallback as it's not used directly here
import { usePrompt } from '../hooks/usePrompt';
import { ListedTemplate } from '../context/PromptContext';

interface TemplateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03L11.5 11.364V2.75z" />
    <path d="M4 14.75A.75.75 0 004.75 14h10.5a.75.75 0 000-1.5H4.75A.75.75 0 004 14.75z" />
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

export function TemplateManagementModal({
  isOpen,
  onClose,
}: TemplateManagementModalProps) {
  const {
    savedTemplateList,
    isLoadingSavedTemplates,
    // fetchUserTemplates, // Not called directly, list is from context
    handleRenameTemplate,
    handleDeleteTemplate,
    setSelectedTemplateToLoad, // Context setter that also loads
  } = usePrompt();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<ListedTemplate | null>(
    null
  );
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setSearchTerm('');
      setEditingTemplate(null);
      setNewName('');
    }
  }, [isOpen]);

  const filteredTemplates = savedTemplateList.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startRename = (template: ListedTemplate) => {
    setEditingTemplate(template);
    setNewName(template.name);
  };

  const cancelRename = () => {
    setEditingTemplate(null);
    setNewName('');
  };

  const submitRename = async () => {
    if (
      editingTemplate &&
      newName.trim() &&
      newName.trim() !== editingTemplate.name
    ) {
      await handleRenameTemplate(editingTemplate.id, newName.trim());
      // List will refresh via context's fetchUserTemplates call
    }
    cancelRename();
  };

  const loadTemplateAndClose = (templateId: string) => {
    setSelectedTemplateToLoad(templateId); // Triggers load via context
    onClose();
  };

  const deleteTemplate = async (templateId: string) => {
    const templateToDelete = savedTemplateList.find((t) => t.id === templateId);
    if (
      templateToDelete &&
      window.confirm(
        `Are you sure you want to delete template: "${templateToDelete.name}"?`
      )
    ) {
      await handleDeleteTemplate(templateId);
      // List will refresh via context
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm dark:bg-opacity-75"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl mx-4 h-[75vh] max-h-[600px] flex flex-col"
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
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search templates by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
          />
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
          {isLoadingSavedTemplates && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Loading templates...
            </p>
          )}
          {!isLoadingSavedTemplates && filteredTemplates.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No templates found or match your search.
            </p>
          )}
          {!isLoadingSavedTemplates &&
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center hover:shadow-md dark:hover:bg-gray-700 transition-shadow"
              >
                {editingTemplate?.id === template.id ? (
                  <div className="flex-grow flex items-center space-x-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      autoFocus
                      className="flex-grow p-1 border border-indigo-500 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-600"
                    />
                    <button
                      onClick={submitRename}
                      className="text-xs py-1 px-2 bg-green-500 hover:bg-green-600 text-white rounded"
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
                    className="flex-grow cursor-pointer group"
                    onClick={() => loadTemplateAndClose(template.id)}
                  >
                    <p
                      className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate"
                      title={template.name}
                    >
                      {template.name}
                    </p>
                    {template.updatedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated:{' '}
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex space-x-1 flex-shrink-0 ml-3">
                  {editingTemplate?.id !== template.id && (
                    <button
                      onClick={() => loadTemplateAndClose(template.id)}
                      title="Load Template"
                      className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
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
                    className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                  >
                    {editingTemplate?.id === template.id ? (
                      <CancelIcon />
                    ) : (
                      <EditIcon />
                    )}
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    title="Delete Template"
                    className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
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
