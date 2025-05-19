// src/app/components/GeneratedPromptDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
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

export function GeneratedPromptDisplay() {
  const { generatedPrompt } = usePrompt();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // Default CLOSED

  useEffect(() => {
    if (copyStatus) {
      const timer = setTimeout(() => setCopyStatus(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);
  const handleCopyGenerated = () => {
    if (!generatedPrompt.trim() || copyStatus) return;
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => setCopyStatus('copied'))
      .catch((err) => {
        console.error(err);
        alert('Copy failed');
      });
  };
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    // Section border
    <section className="p-6 pt-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          {/* Title dark text */}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {' '}
            Generated Prompt{' '}
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
        {/* Conditional Copy Button Area */}
        {isOpen && (
          <div className="relative flex items-center">
            {/* Copied! text dark color */}
            <span
              className={`text-xs text-green-600 dark:text-green-400 mr-2 transition-opacity duration-300 ${copyStatus === 'copied' ? 'opacity-100' : 'opacity-0'}`}
            >
              {' '}
              Copied!{' '}
            </span>
            {/* Copy Button base styles likely okay */}
            <button
              onClick={handleCopyGenerated}
              disabled={!generatedPrompt.trim() || copyStatus === 'copied'}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50"
              title="Copy generated prompt"
            >
              {' '}
              Copy{' '}
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Content Area Wrapper */}
      <div
        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] mt-1' : 'max-h-0'}`}
      >
        {/* Content dark bg/text */}
        {/* --- MODIFIED THIS DIV --- */}
        <div
          className={`bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded shadow relative group mb-1`}
        >
          {' '}
          {/* Changed light mode bg/text */}
          <pre className="text-sm whitespace-pre-wrap break-words">
            {generatedPrompt || (
              <span className="text-gray-500 dark:text-gray-400 italic">
                {' '}
                No components added yet.{' '}
              </span>
            )}
          </pre>
        </div>
        {/* --- END MODIFICATION --- */}
      </div>
    </section>
  );
}
