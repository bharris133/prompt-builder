// src/app/page.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React from 'react';
// Import DndKit essentials
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';

// Import AuthModal
import { AuthModal } from './components/AuthModal';

// Import the Context Provider
import { PromptProvider } from './context/PromptContext'; // Verify path

// Import the custom hook (to get handlers needed by DndContext & layout)
import { usePrompt } from './hooks/usePrompt'; // Verify path

// Import the UI Components
import { Header } from './components/Header'; // Verify path
import { Sidebar } from './components/Sidebar'; // Verify path
import { PromptCanvas } from './components/PromptCanvas'; // Verify path
import { GeneratedPromptDisplay } from './components/GeneratedPromptDisplay'; // Verify path
import { RefinementDisplay } from './components/RefinementDisplay'; // Verify path
import { VariableInputs } from './components/VariableInputs'; // Verify path

// Inner component to safely use context hooks
function PromptBuilderUI() {
  // Get only what's needed at this top layout level
  const {
    handleDragEnd,
    isSidebarOpen,

    // --- Get Auth Modal state/handlers ---
    isAuthModalOpen,
    closeAuthModal,
    // We need a way to tell the modal its initial mode if openAuthModal sets it
    // Let's assume openAuthModal in context sets an internal 'authModalMode' state
    // that AuthModal can then read if we decide to pass it down, or modal manages its own.
    // For now, AuthModal will get initialMode from Header.
  } = usePrompt();

  // Sensor setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  return (
    // DndContext wraps the draggable areas
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* Outermost div for screen height and base dark mode background */}
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        {/* Main area allowing sidebar and content */}
        <main className="flex-1 flex overflow-hidden relative">
          {' '}
          {/* Use relative for potential overlays */}
          {/* Sidebar Component (handles its own fixed/static positioning) */}
          <Sidebar />
          {/* Main Content Column (shifts based on sidebar) */}
          <div
            className={`flex-1 overflow-y-auto 
              transition-transform duration-300 ease-in-out ${
                isSidebarOpen
                  ? 'blur-sm md:blur-none pointer-events-none md:pointer-events-auto'
                  : 'pointer-events-auto'
              }`}
          >
            {/* Inner container for padding & content flow */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {' '}
              {/* Adjust max-w & padding */}{' '}
              {/* Sections have their own padding */}
              <PromptCanvas />
              <GeneratedPromptDisplay />
              <RefinementDisplay />
              <VariableInputs />
            </div>
            {/* Optional bottom spacer */}
            {/* <div className="h-6 flex-shrink-0"></div> */}
          </div>
          {/* End Main Content Column */}
        </main>
        {/* Render AuthModal, controlled by context state */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          // initialMode can be passed from where openAuthModal is called if needed,
          // or AuthModal can default. Let Header pass it.
        />
      </div>
    </DndContext>
  );
}

// Default Page Export - Wraps UI with Provider
export default function HomePage() {
  return (
    <PromptProvider>
      <PromptBuilderUI />
    </PromptProvider>
  );
}
