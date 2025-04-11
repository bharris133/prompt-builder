// src/app/components/PromptCanvas.tsx
'use client';

import React from 'react';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePrompt } from '../hooks/usePrompt'; // Import the custom hook
import { SortablePromptComponent } from './SortablePromptComponent'; // Import the component itself

export function PromptCanvas() {
    // Get components array and handlers needed by SortablePromptComponent
    const { components, handleContentSave, handleDeleteComponent, promptName, selectedPromptToLoad } = usePrompt();

    // Create an array of just the IDs for SortableContext
    const componentIds = components.map((c) => c.id);

    return (
        <section className="flex-1 p-6 overflow-y-auto">
             {/* Updated title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                 Prompt Canvas{' '}
                 {promptName && (
                    <span className="text-base font-normal text-gray-500">
                         - ({selectedPromptToLoad === promptName ? 'Loaded' : 'Editing'}): {promptName}
                    </span>
                 )}
            </h2>
            <div className="bg-white p-4 rounded shadow min-h-[200px]">
                {/* DndKit Sortable Context */}
                <SortableContext
                    items={componentIds} // Pass the array of IDs
                    strategy={verticalListSortingStrategy} // Specify sorting strategy
                >
                    {/* Conditional Rendering */}
                    {components.length === 0 ? (
                        <p className="text-gray-500 text-center py-10">
                            Add components using the sidebar, or load a saved
                            prompt.
                        </p>
                    ) : (
                        // Map over components and render SortablePromptComponent for each
                        components.map((component) => (
                            <SortablePromptComponent
                                key={component.id}
                                component={component}
                                // Pass down the handlers from the context
                                onContentSave={handleContentSave}
                                onDelete={handleDeleteComponent}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </section>
    );
}

// Optional: export default PromptCanvas;