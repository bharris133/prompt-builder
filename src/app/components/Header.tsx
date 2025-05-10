// src/app/components/Header.tsx // COMPLETE FILE REPLACEMENT - DEFINITIVELY FINAL

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdownMenu } from './UserDropdownMenu'; // Assuming this file is created

// Icons
const MenuIcon = () => (
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
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);
const UserIcon = () => (
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
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

export function Header() {
  const {
    user,
    authLoading,
    openAuthModal,
    toggleSidebar,
    promptName,
    components,
    refinedPromptResult,
    refinementError,
    variableValues,
    handleSavePrompt,
    handleClearCanvas,
    setPromptNameDirectly,
    handleSaveAsTemplate,
    // Note: signOutUser and setIsApiKeyModalOpen are used by UserDropdownMenu via context
  } = usePrompt();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Logic for Save as Template
  const triggerSaveAsTemplate = () => {
    const currentNameSuggestion = promptName
      ? `${promptName} Template`
      : 'My Template';
    const templateName = window.prompt(
      'Enter a name for this template:',
      currentNameSuggestion
    );
    if (templateName && templateName.trim() !== '') {
      handleSaveAsTemplate(templateName.trim());
    }
  };

  // Logic for Clear Canvas disabled state
  const isClearDisabled =
    components.length === 0 &&
    !promptName.trim() &&
    !refinedPromptResult &&
    !refinementError &&
    Object.keys(variableValues).length === 0;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md dark:border-b dark:border-gray-700 z-20 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-y-2 py-2 min-h-[4rem] relative">
          <div className="flex items-center space-x-2 flex-shrink-0 mr-2 sm:mr-4 order-1">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Prompt Builder
            </h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-grow order-last md:order-2 w-full md:w-auto min-w-0 md:min-w-[300px]">
            <label
              htmlFor="promptNameInput"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 hidden sm:inline"
            >
              Prompt Name:
            </label>
            <input
              id="promptNameInput"
              type="text"
              value={promptName}
              onChange={(e) => setPromptNameDirectly(e.target.value)}
              placeholder="Enter or load name..."
              title="Enter name for saving or loading prompts"
              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 min-w-[100px]"
            />
            <button
              onClick={handleSavePrompt}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
              disabled={components.length === 0 || !promptName.trim()}
              title={
                components.length === 0
                  ? 'Add components first'
                  : !promptName.trim()
                    ? 'Enter prompt name to save'
                    : `Save prompt "${promptName}"`
              }
            >
              Save Prompt
            </button>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 order-2 md:order-last">
            <button
              onClick={triggerSaveAsTemplate}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
              disabled={components.length === 0}
              title={
                components.length === 0
                  ? 'Add components to save template'
                  : 'Save canvas as template'
              }
            >
              <span className="hidden sm:inline">Save as Template</span>
              <span className="sm:hidden">Template</span>
            </button>
            <button
              onClick={handleClearCanvas}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded text-sm transition duration-150 ease-in-out flex-shrink-0 disabled:opacity-50"
              disabled={isClearDisabled}
              title={
                isClearDisabled
                  ? 'Canvas is already empty'
                  : 'Clear canvas, variables & results'
              }
            >
              <span className="hidden sm:inline">Clear Canvas</span>
              <span className="sm:hidden">Clear</span>
            </button>
            <ThemeToggle />

            {/* Auth Display Logic */}
            <div className="relative">
              {authLoading ? (
                <div className="p-2 text-sm text-gray-400 dark:text-gray-500 animate-pulse">
                  ...
                </div>
              ) : user ? (
                <>
                  <button
                    onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                    id="user-menu-button"
                    className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
                    aria-label="User menu"
                    aria-haspopup="true"
                    aria-expanded={isUserDropdownOpen}
                  >
                    <UserIcon />
                  </button>
                  <UserDropdownMenu
                    isOpen={isUserDropdownOpen}
                    onClose={() => setIsUserDropdownOpen(false)}
                  />
                </>
              ) : (
                <button
                  onClick={() => openAuthModal('signIn')}
                  className="ml-2 py-2 px-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
