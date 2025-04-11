// src/app/page.tsx
'use client'; // Essential for context provider and client components

import React from 'react';

// Import DndKit essentials
import {
    DndContext,
    PointerSensor, // Using only pointer sensor for now
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';

// Import the Context Provider
import { PromptProvider } from './context/PromptContext';

// Import the custom hook (to get the drag handler)
import { usePrompt } from './hooks/usePrompt';

// Import the UI Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PromptCanvas } from './components/PromptCanvas';
import { GeneratedPromptDisplay } from './components/GeneratedPromptDisplay';

// This inner component is needed because usePrompt() must be called *inside* PromptProvider
function PromptBuilderUI() {
    // Get the drag handler from the context
    const { handleDragEnd } = usePrompt();

    // Sensor setup (moved here as DndContext needs it)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Add activation constraint to prevent accidental drags
            activationConstraint: {
                distance: 5,
            },
        })
        // Optional: Add KeyboardSensor later if needed
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd} // Use the handler from context
        >
            <div className="flex flex-col h-screen bg-gray-100">
                {/* Render the Header Component */}
                <Header />

                {/* Main Content Area */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Render the Sidebar Component */}
                    <Sidebar />

                    {/* Main Content Column */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Render the PromptCanvas Component */}
                        <PromptCanvas />

                        {/* Render the GeneratedPromptDisplay Component */}
                        <GeneratedPromptDisplay />
                    </div>
                </main>
            </div>
        </DndContext>
    );
}


// The main Page component now just sets up the provider
export default function HomePage() {
    return (
        <PromptProvider> {/* Wrap everything in the Provider */}
            <PromptBuilderUI /> {/* Render the actual UI structure */}
        </PromptProvider>
    );
}