// src/app/components/PromptCanvas.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePrompt } from '../hooks/usePrompt';
import { SortablePromptComponent } from './SortablePromptComponent';

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

  // Must return a single root element
  return (
    <section className="p-6 pt-6 border-b border-gray-200 flex-shrink-0">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-800">
            Prompt Canvas{' '}
            {promptName && (
              <span className="text-base font-normal text-gray-500">
                - ({selectedPromptToLoad === promptName ? 'Loaded' : 'Editing'}
                ): {promptName}
              </span>
            )}
          </h2>
          <button
            onClick={toggleOpen}
            title={isOpen ? 'Collapse' : 'Expand'}
            className="text-gray-400 hover:text-gray-600 p-1"
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
        <div className={`bg-white p-4 rounded shadow min-h-[200px] mt-2`}>
          <SortableContext
            items={componentIds}
            strategy={verticalListSortingStrategy}
          >
            {components.length === 0 ? (
              <p className="text-gray-500 text-center py-10">
                {' '}
                Add components or load a saved prompt.{' '}
              </p>
            ) : (
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
