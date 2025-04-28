// src/app/components/GeneratedPromptDisplay.tsx // COMPLETE FILE REPLACEMENT

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

  // Must return a single root element
  return (
    <section className="p-6 pt-4 border-b border-gray-200 flex-shrink-0">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-800">
            {' '}
            Generated Prompt{' '}
          </h2>
          <button
            onClick={toggleOpen}
            title={isOpen ? 'Collapse' : 'Expand'}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {isOpen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        </div>
        {/* Conditional Copy Button Area */}
        {isOpen && (
          <div className="relative flex items-center">
            <span
              className={`text-xs text-green-600 mr-2 transition-opacity duration-300 ${copyStatus === 'copied' ? 'opacity-100' : 'opacity-0'}`}
            >
              {' '}
              Copied!{' '}
            </span>
            <button
              onClick={handleCopyGenerated}
              disabled={!generatedPrompt.trim() || copyStatus === 'copied'}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50"
              title="Copy generated prompt"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Content Area Wrapper */}
      <div
        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] mt-1' : 'max-h-0'}`}
      >
        {/* Content */}
        <div
          className={`bg-gray-800 text-white p-4 rounded shadow relative group mb-1`}
        >
          <pre className="text-sm whitespace-pre-wrap break-words">
            {generatedPrompt || (
              <span className="text-gray-400 italic">
                {' '}
                No components added yet.{' '}
              </span>
            )}
          </pre>
        </div>
      </div>
    </section>
  );
}
