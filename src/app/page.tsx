// src/app/page.tsx
'use client';

import React from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { PromptProvider } from './context/PromptContext';
import { usePrompt } from './hooks/usePrompt';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PromptCanvas } from './components/PromptCanvas';
import { GeneratedPromptDisplay } from './components/GeneratedPromptDisplay';
import { RefinementDisplay } from './components/RefinementDisplay'; // <-- Import new component

function PromptBuilderUI() {
    const { handleDragEnd } = usePrompt();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen bg-gray-100">
                <Header />
                <main className="flex-1 flex overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Arrange the three main content panels */}
                        <PromptCanvas />            {/* Top panel */}
                        <GeneratedPromptDisplay />  {/* Middle panel */}
                        <RefinementDisplay />       {/* Bottom panel */}
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