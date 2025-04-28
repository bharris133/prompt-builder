'use client';
// src/app/components/SortablePromptComponent.tsx
import React, { useState, ChangeEvent, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PromptComponentData } from '../context/PromptContext'; // Import type from context

interface ComponentStyle {
  bg: string;
  border: string;
  text: string;
  button: string;
  saveButton: string;
  cancelButton: string;
  deleteButton: string;
}

// --- Sortable Prompt Component (Minimal Setup) ---
interface SortablePromptComponentProps {
  component: PromptComponentData;
  onContentSave: (id: number, newContent: string) => void;
  onDelete: (id: number) => void;
}

// Add export default if needed, or keep as named export
// export default SortablePromptComponent; // If you prefer default export

// ---Start SortablePromptComponent Function ---
export function SortablePromptComponent({
  component,
  onContentSave,
  onDelete,
}: SortablePromptComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef, // NEED this to register the element
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id }); // Pass the unique ID

  // --- DEFINE AND APPLY STYLE ---
  const style = {
    // Apply transform and transition for smooth dragging animation
    transform: CSS.Transform.toString(transform), // Use CSS utility
    transition, // Apply transition
    // Add opacity effect when dragging (optional visual feedback)
    opacity: isDragging ? 0.5 : 1,
    // Add z-index when dragging to ensure it appears above others
    zIndex: isDragging ? 10 : 'auto',
  };
  // --- END STYLE DEFINITION ---

  // --- Internal Logic (Copy/Paste from original PromptComponent) ---
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(component.content);
  // Reset editText if component content changes externally OR when cancelling edit
  useEffect(() => {
    if (!isEditing) {
      setEditText(component.content);
    }
  }, [component.content, isEditing]);
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(event.target.value);
  };
  const handleEditClick = () => {
    setEditText(component.content);
    setIsEditing(true);
  }; // Load current content on edit start
  const handleSaveClick = () => {
    onContentSave(component.id, editText);
    setIsEditing(false);
  };
  const handleCancelClick = () => {
    setIsEditing(false); /* editText automatically resets via useEffect */
  };
  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete this "${component.type}" component?`
      )
    ) {
      onDelete(component.id);
    }
  };

  // --- Apply typing HERE ---
  const typeStyles: { [key: string]: ComponentStyle } = {
    // Add type annotation
    Instruction: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      button:
        'bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded text-x',
      saveButton:
        'bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs',
    },
    Context: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      button:
        'bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs',
    },
    Role: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      button:
        'bg-purple-100 hover:bg-purple-200 text-purple-700 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs',
    },
    'Example Input': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-800',
      button:
        'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs',
    },
    'Example Output': {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-800',
      button:
        'bg-orange-100 hover:bg-orange-200 text-orange-700 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-orange-500 hover:bg-orange-600 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs',
    },
    // --- NEW: Add Tools Style ---
    Tools: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      button:
        'bg-teal-100 hover:bg-teal-200 text-teal-700 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-teal-500 hover:bg-teal-600 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs',
    },
    // --- End Tools Style ---
    // --- End Full Definitions ---
    Default: {
      // Ensure Default also matches the interface
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      button:
        'bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs',
      saveButton:
        'bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs',
      cancelButton:
        'bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs',
      deleteButton:
        'bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-xs',
    },
  };

  const styles = typeStyles[component.type] || typeStyles.Default;
  // --- End Internal Logic ---
  //console.log(`[${component.id}] Type: ${component.type}, Styles selected:`, styles); //optional: keep for debugging if needed

  return (
    // Apply setNodeRef to the outermost div of the component
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* The rest of the component's JSX structure remains exactly the same as PromptComponent */}
      <div
        className={`${styles.bg} ${styles.border} border p-3 rounded mb-3 shadow-sm relative`}
      >
        {/* --- DRAG HANDLE CODE BLOCK --- */}
        <div
          {...listeners} // Apply listeners ONLY to the handle
          className="absolute top-2 right-14 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 z-20"
          title="Drag to reorder"
        >
          {/* SVG Icon */}
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
        </div>
        {/* --- END DRAG HANDLE CODE BLOCK --- */}

        {/* Header Row */}
        <div className="flex justify-between items-center mb-2 pr-20">
          <strong className={`${styles.text} font-medium`}>
            {component.type}:
          </strong>
          <div className="flex space-x-1">
            {/* Keep original buttons, NO listeners here yet */}
            {isEditing /* Save/Cancel buttons */ ? (
              <>
                <button
                  onClick={handleSaveClick}
                  className={`${styles.saveButton} /* ... */`}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelClick}
                  className={`${styles.cancelButton} /* ... */`}
                >
                  Cancel
                </button>
              </>
            ) : (
              /* Edit/Delete buttons */
              <>
                <button
                  onClick={handleEditClick}
                  className={`${styles.button} /* ... */`}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className={`${styles.deleteButton} /* ... */ml-1`}
                >
                  ×
                </button>
              </>
            )}
          </div>
        </div>
        {/* Content Area */}
        {isEditing ? (
          <textarea
            value={editText}
            onChange={handleInputChange}
            // Add the full className, rows, and placeholder back
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px] text-sm font-mono bg-white text-gray-900"
            rows={3}
            placeholder={`Enter ${component.type} content here...`}
            autoFocus // Automatically focus on the textarea when editing starts
          />
        ) : (
          <p className="text-gray-700 text-sm whitespace-pre-wrap break-words min-h-[24px]">
            {' '}
            {/* Ensure wrapping, add min-height */}
            {component.content || (
              <span className="text-gray-400 italic">
                Empty {component.type}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
} // --- End of SortablePromptComponent ---
