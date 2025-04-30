// src/app/components/PromptCanvas.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePrompt } from '../hooks/usePrompt';
import { SortablePromptComponent } from './SortablePromptComponent';

// --- Icons (Paste SVG or import) ---
const CollapseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 15.75 7.5-7.5 7.5 7.5"
    />
  </svg>
);
const ExpandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m19.5 8.25-7.5 7.5-7.5-7.5"
    />
  </svg>
);
// --- End Icons ---

export function PromptCanvas() {
  const {
    components,
    handleContentSave,
    handleDeleteComponent,
    promptName,
    selectedPromptToLoad,
  } = usePrompt();
  const componentIds = components.map((c) => c.id);
  const [isOpen, setIsOpen] = useState(true); // Default OPEN
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    // Section border
    <section className="p-6 pt-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          {/* Title dark text */}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Prompt Canvas{' '}
            {promptName && (
              // Subtitle dark text
              <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                - ({selectedPromptToLoad === promptName ? 'Loaded' : 'Editing'}
                ): {promptName}
              </span>
            )}
          </h2>
          {/* Toggle button dark text */}
          <button
            onClick={toggleOpen}
            title={isOpen ? 'Collapse' : 'Expand'}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            {isOpen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        </div>
        <div>{/* Placeholder */}</div>
      </div>

      {/* Collapsible Content Area Wrapper */}
      <div
        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1500px]' : 'max-h-0'}`}
      >
        {/* Content background */}
        <div
          className={`bg-white dark:bg-gray-800/50 p-4 rounded shadow min-h-[200px] mt-2`}
        >
          {' '}
          {/* Slight dark bg */}
          <SortableContext
            items={componentIds}
            strategy={verticalListSortingStrategy}
          >
            {components.length === 0 ? (
              // Placeholder dark text
              <p className="text-gray-500 dark:text-gray-400 text-center py-10">
                {' '}
                Add components or load a saved prompt.{' '}
              </p>
            ) : (
              // SortablePromptComponent will handle its own dark styles internally
              components.map((component) => (
                <SortablePromptComponent
                  key={component.id}
                  component={component}
                  onContentSave={handleContentSave}
                  onDelete={handleDeleteComponent}
                />
              ))
            )}
          </SortableContext>
        </div>
      </div>
    </section>
  );
}
