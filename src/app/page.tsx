// src/app/page.tsx
'use client';

import React from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { PromptProvider } from './context/PromptContext';
import { usePrompt } from './hooks/usePrompt';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PromptCanvas } from './components/PromptCanvas';
import { GeneratedPromptDisplay } from './components/GeneratedPromptDisplay';
import { RefinementDisplay } from './components/RefinementDisplay'; // <-- Import new component
import { VariableInputs } from './components/VariableInputs'; // <-- Import new component

function PromptBuilderUI() {
  const { handleDragEnd } = usePrompt();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <main className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Arrange the three main content panels */}
            <div className="flex-grow p-0">
              {/* Allow grow, remove padding from here */}
              {/* Each section already has p-6, so parent padding isn't needed */}
              {/* flex-shrink-0 on each section prevents squashing */}
              <PromptCanvas /> {/* Top panel */}
              <GeneratedPromptDisplay /> {/* Middle panel */}
              <RefinementDisplay /> {/* Bottom panel */}
              <VariableInputs />
            </div>
            {/* Optional: Small fixed padding at the very bottom INSIDE the scrollable area */}
            {/* <div className="p-4 flex-shrink-0"></div> */}
          </div>
        </main>
      </div>
    </DndContext>
  );
}

export default function HomePage() {
  return (
    <PromptProvider>
      <PromptBuilderUI />
    </PromptProvider>
  );
}
