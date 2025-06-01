// src/app/components/SortablePromptComponent.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, ChangeEvent, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PromptComponentData } from '../context/PromptContext'; // Import type from context

// Define style structure with dark variants
interface ComponentStyle {
  bg: string;
  border: string;
  text: string; // Base styles
  button: string;
  saveButton: string;
  cancelButton: string;
  deleteButton: string; // Button styles
  // Maybe add specific dark button text/bg if needed, but relying on base button styles for now
}

interface SortablePromptComponentProps {
  component: PromptComponentData;
  onContentSave: (id: number, newContent: string) => void;
  onDelete: (id: number) => void;
}

// --- Icons ---
const DragHandleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M10 3a.75.75 0 0 1 .75.75V16.25a.75.75 0 0 1-1.5 0V3.75A.75.75 0 0 1 10 3ZM5.75 5.75a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM5 10a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 5 10Zm.75 3.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z"
      clipRule="evenodd"
    />
  </svg>
);
// --- End Icons ---

export function SortablePromptComponent({
  component,
  onContentSave,
  onDelete,
}: SortablePromptComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(component.content);
  useEffect(() => {
    if (!isEditing) setEditText(component.content);
  }, [component.content, isEditing]);
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(event.target.value);
  };
  const handleEditClick = () => {
    setEditText(component.content);
    setIsEditing(true);
  };
  const handleSaveClick = () => {
    onContentSave(component.id, editText);
    setIsEditing(false);
  };
  const handleCancelClick = () => {
    setIsEditing(false);
  };
  const handleDelete = () => {
    if (window.confirm(`Delete this "${component.type}" component?`)) {
      onDelete(component.id);
    }
  };

  // --- UPDATED Component Type Styles with Dark Variants ---
  const typeStyles: { [key: string]: ComponentStyle } = {
    Instruction: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-700/50',
      text: 'text-blue-800 dark:text-blue-200',
      button:
        'bg-blue-100 hover:bg-blue-200 dark:bg-blue-800/50 dark:hover:bg-blue-700/60 text-blue-700 dark:text-blue-200 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 py-1 px-2 rounded text-xs',
    },
    Context: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-700/50',
      text: 'text-green-800 dark:text-green-200',
      button:
        'bg-green-100 hover:bg-green-200 dark:bg-green-800/50 dark:hover:bg-green-700/60 text-green-700 dark:text-green-200 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 py-1 px-2 rounded text-xs',
    },
    Role: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      border: 'border-purple-200 dark:border-purple-700/50',
      text: 'text-purple-800 dark:text-purple-200',
      button:
        'bg-purple-100 hover:bg-purple-200 dark:bg-purple-800/50 dark:hover:bg-purple-700/60 text-purple-700 dark:text-purple-200 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-500 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 py-1 px-2 rounded text-xs',
    },
    'Example Input': {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      border: 'border-yellow-300 dark:border-yellow-700/50',
      text: 'text-yellow-800 dark:text-yellow-200',
      button:
        'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800/50 dark:hover:bg-yellow-700/60 text-yellow-700 dark:text-yellow-200 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 py-1 px-2 rounded text-xs',
    },
    'Example Output': {
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      border: 'border-orange-300 dark:border-orange-700/50',
      text: 'text-orange-800 dark:text-orange-200',
      button:
        'bg-orange-100 hover:bg-orange-200 dark:bg-orange-800/50 dark:hover:bg-orange-700/60 text-orange-700 dark:text-orange-200 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 py-1 px-2 rounded text-xs',
    },
    Tools: {
      bg: 'bg-teal-50 dark:bg-teal-900/30',
      border: 'border-teal-200 dark:border-teal-700/50',
      text: 'text-teal-800 dark:text-teal-200',
      button:
        'bg-teal-100 hover:bg-teal-200 dark:bg-teal-800/50 dark:hover:bg-teal-700/60 text-teal-700 dark:text-teal-200 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 py-1 px-2 rounded text-xs',
    },
    Default: {
      // Ensure Default also matches the interface
      bg: 'bg-gray-50 dark:bg-gray-700/30',
      border: 'border-gray-200 dark:border-gray-600/50',
      text: 'text-gray-800 dark:text-gray-200',
      button:
        'bg-gray-100 hover:bg-gray-200 dark:bg-gray-600/50 dark:hover:bg-gray-500/60 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 py-1 px-2 rounded text-xs',
    },
  };

  const styles = typeStyles[component.type] || typeStyles.Default;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Apply base dark styles here */}
      <div
        className={`${styles.bg} ${styles.border} border p-3 rounded mb-3 shadow-sm dark:shadow-lg relative`}
      >
        {/* Drag Handle dark styles */}
        <div
          {...listeners}
          className="absolute top-2 right-14 p-1 cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 z-20"
          title="Drag to reorder"
        >
          <DragHandleIcon />
        </div>
        {/* Header Row */}
        <div className="flex justify-between items-center mb-2 pr-20">
          {/* Title dark text defined by styles.text */}
          <strong className={`${styles.text} font-medium`}>
            {component.type}:
          </strong>
          <div className="flex space-x-1">
            {/* Buttons use styles from typeStyles */}
            {isEditing ? (
              <>
                {' '}
                <button
                  onClick={handleSaveClick}
                  className={styles.saveButton}
                  title="Save changes"
                >
                  Save
                </button>{' '}
                <button
                  onClick={handleCancelClick}
                  className={styles.cancelButton}
                  title="Cancel editing"
                >
                  Cancel
                </button>{' '}
              </>
            ) : (
              <>
                {' '}
                <button
                  onClick={handleEditClick}
                  className={styles.button}
                  title="Edit this component"
                >
                  Edit
                </button>{' '}
                <button
                  onClick={handleDelete}
                  className={`${styles.deleteButton} ml-1`}
                  title="Delete this component"
                >
                  ×
                </button>{' '}
              </>
            )}
          </div>
        </div>
        {/* Content Area */}
        {isEditing ? (
          <textarea
            value={editText}
            onChange={handleInputChange}
            autoFocus
            // Textarea dark styles
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 resize-y min-h-[80px] text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={3}
            placeholder={`Enter ${component.type} content...`}
          />
        ) : (
          // Paragraph dark styles
          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words min-h-[24px]">
            {component.content || (
              <span className="text-gray-400 dark:text-gray-500 italic">
                Empty {component.type}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
