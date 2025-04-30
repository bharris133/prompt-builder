// src/app/components/VariableInputs.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState } from 'react';
import { usePrompt } from '../hooks/usePrompt';

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

export function VariableInputs() {
  const { detectedVariables, variableValues, updateVariableValue } =
    usePrompt(); // Use correct handler name
  const [isOpen, setIsOpen] = useState(false); // Default CLOSED
  const toggleOpen = () => setIsOpen(!isOpen);

  if (detectedVariables.length === 0) {
    return null;
  }

  return (
    // No border needed if it's the last section visually
    <section className="p-6 pt-4 flex-shrink-0">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          {/* Title dark text */}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {' '}
            Variables ({detectedVariables.length})
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
        <div></div>
      </div>

      {/* Collapsible Content Area Wrapper */}
      <div
        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] mt-1' : 'max-h-0'}`}
      >
        {/* Content dark bg/border */}
        <div
          className={`bg-white dark:bg-gray-800/50 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700 space-y-3 mb-1 max-h-[450px] overflow-y-auto`}
        >
          {detectedVariables.map((varName) => (
            <div key={varName}>
              {/* Label dark text */}
              <label
                htmlFor={`variable-input-${varName}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {varName
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                :
              </label>
              {/* Input dark styles */}
              <input
                type="text"
                id={`variable-input-${varName}`}
                value={variableValues[varName] || ''}
                onChange={(e) => updateVariableValue(varName, e.target.value)} // Use updateVariableValue
                placeholder={`Enter value for {{${varName}}}...`}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
              />
            </div>
          ))}
          {/* Helper text dark style & sticky dark bg */}
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 sticky bottom-0 bg-white dark:bg-gray-800/50 pb-1 -mb-1">
            {' '}
            {/* Adjusted sticky bg/padding */}
            Values entered here replace <code>{`{{placeholders}}`}</code> in the
            generated prompt.
          </p>
        </div>
      </div>
    </section>
  );
}
