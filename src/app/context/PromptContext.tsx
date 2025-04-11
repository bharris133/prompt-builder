// src/app/context/PromptContext.tsx
'use client';

import React, {
    createContext,
    useState,
    useRef,
    useEffect,
    useCallback,
    ReactNode,
    ChangeEvent,
} from 'react';

import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core'; // Import DragEndEvent type

// --- Type Definitions ---
export interface PromptComponentData {
    id: number;
    type: string;
    content: string;
}

interface SavedPrompts {
    [promptName: string]: PromptComponentData[];
}

// Define the shape of the context value
interface PromptContextType {
    // State
    components: PromptComponentData[];
    promptName: string;
    savedPromptNames: string[];
    selectedPromptToLoad: string;
    generatedPrompt: string; // Add generated prompt here

    // State Setters/Manipulators (exposed selectively if needed, or via handlers)
    // setPromptName: React.Dispatch<React.SetStateAction<string>>; // Expose if direct setting needed

    // Handlers
    addComponent: (type: string) => void;
    handleContentSave: (id: number, newContent: string) => void;
    handleDeleteComponent: (id: number) => void;
    handleSavePrompt: () => void;
    handleClearCanvas: () => void;
    handleLoadPrompt: (event: ChangeEvent<HTMLSelectElement>) => void;
    handleDeleteSavedPrompt: () => void;
    handleDragEnd: (event: DragEndEvent) => void; // Use imported type
    setPromptNameDirectly: (name: string) => void; // Specific setter for input binding
}

// Create the context with a default value (can be null or undefined, checked in usePrompt)
export const PromptContext = createContext<PromptContextType | null>(null);

// LocalStorage Key
const SAVED_PROMPTS_KEY = 'promptBuilderSavedPrompts';

// --- Provider Component ---
interface PromptProviderProps {
    children: ReactNode;
}

export function PromptProvider({ children }: PromptProviderProps) {
    // --- All State from HomePage goes here ---
    const [components, setComponents] = useState<PromptComponentData[]>([]);
    const [promptName, setPromptName] = useState<string>('');
    const [savedPromptNames, setSavedPromptNames] = useState<string[]>([]);
    const [selectedPromptToLoad, setSelectedPromptToLoad] = useState<string>('');
    const nextId = useRef<number>(0);

    // --- Effects ---
    // Load saved names on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (storedData) {
                try {
                    const savedPrompts: SavedPrompts = JSON.parse(storedData);
                    setSavedPromptNames(Object.keys(savedPrompts).sort());
                } catch (e) { console.error("...", e); localStorage.removeItem(SAVED_PROMPTS_KEY); }
            }
        }
    }, []);

    // Recalculate nextId
    useEffect(() => {
        const maxId = components.length > 0 ? Math.max(...components.map(c => c.id)) : -1;
        nextId.current = maxId + 1;
    }, [components]);

    // --- Handlers (using useCallback for stability) ---
    const clearLoadSelection = useCallback(() => {
        setSelectedPromptToLoad('');
    }, []);

    const addComponent = useCallback((type: string) => {
        const newId = nextId.current;
        nextId.current += 1;
        const newComponent: PromptComponentData = { id: newId, type, content: '' };
        setComponents(prev => [...prev, newComponent]);
        clearLoadSelection();
    }, [clearLoadSelection]);

    const handleContentSave = useCallback((id: number, newContent: string) => {
        setComponents(prev => prev.map(comp => comp.id === id ? { ...comp, content: newContent } : comp));
        clearLoadSelection();
    }, [clearLoadSelection]);

    const handleDeleteComponent = useCallback((id: number) => {
        if (window.confirm(`Delete this component from the canvas?`)) {
            setComponents(prev => prev.filter(comp => comp.id !== id));
            clearLoadSelection();
        }
    }, [clearLoadSelection]);

    const handleSavePrompt = useCallback(() => {
        const nameToSave = promptName.trim();
        if (!nameToSave) { alert("Please enter a name."); return; }
        if (components.length === 0) { alert("Cannot save empty prompt."); return; }
        if (typeof window === 'undefined') return;

        let savedPrompts: SavedPrompts = {};
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) { try { savedPrompts = JSON.parse(storedData); if (typeof savedPrompts !== 'object' || savedPrompts === null) savedPrompts = {}; } catch (e) { savedPrompts = {}; } }

        const isOverwriting = !!savedPrompts[nameToSave];
        if (isOverwriting && !window.confirm(`Overwrite "${nameToSave}"?`)) return;

        savedPrompts[nameToSave] = components;
        try {
            localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
            alert(`Prompt "${nameToSave}" saved!`);
            if (!savedPromptNames.includes(nameToSave)) {
                setSavedPromptNames(prevNames => [...prevNames, nameToSave].sort());
            }
            setSelectedPromptToLoad(nameToSave); // Sync dropdown
        } catch (e) { console.error("Save failed", e); alert("Error saving."); }
    }, [components, promptName, savedPromptNames]); // Dependencies for save logic

    const handleClearCanvas = useCallback(() => {
        if (components.length > 0 && window.confirm("Clear the canvas?")) {
            setComponents([]);
            setPromptName('');
            clearLoadSelection();
        } else if (components.length === 0) {
            setPromptName('');
            clearLoadSelection();
        }
    }, [components.length, clearLoadSelection]); // Dependency: components.length

    const handleLoadPrompt = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        const nameToLoad = event.target.value;
        if (nameToLoad === selectedPromptToLoad && nameToLoad !== "") return;
        if (!nameToLoad) { setSelectedPromptToLoad(''); return; }

        const needsConfirmation = components.length > 0 && selectedPromptToLoad !== nameToLoad;
        if (needsConfirmation && !window.confirm(`Load "${nameToLoad}"?`)) return;

        if (typeof window === 'undefined') return;
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) {
            try {
                const savedPrompts: SavedPrompts = JSON.parse(storedData);
                const componentsToLoad = savedPrompts[nameToLoad];
                if (componentsToLoad) {
                    setComponents(componentsToLoad);
                    setPromptName(nameToLoad);
                    setSelectedPromptToLoad(nameToLoad);
                    console.log(`Prompt "${nameToLoad}" loaded.`);
                } else { console.error(`"${nameToLoad}" not found.`); alert(`Error finding "${nameToLoad}".`); clearLoadSelection(); }
            } catch (e) { console.error("Parse fail on load", e); alert("Error loading."); clearLoadSelection(); }
        } else { alert("No saved prompts."); clearLoadSelection(); }
    }, [components.length, selectedPromptToLoad, clearLoadSelection]); // Dependencies for load logic

    const handleDeleteSavedPrompt = useCallback(() => {
        const nameToDelete = selectedPromptToLoad;
        if (!nameToDelete) { alert("Select prompt to delete."); return; }

        if (window.confirm(`Delete saved prompt "${nameToDelete}"?`)) {
            if (typeof window === 'undefined') return;
            let savedPrompts: SavedPrompts = {};
            const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (storedData) { try { savedPrompts = JSON.parse(storedData); } catch (e) { savedPrompts = {}; } }

            if (savedPrompts[nameToDelete]) {
                delete savedPrompts[nameToDelete];
                try {
                    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
                    setSavedPromptNames(prevNames => prevNames.filter(name => name !== nameToDelete));
                    if (promptName === nameToDelete) { // Also clear canvas if deleted one was loaded
                       setComponents([]);
                       setPromptName('');
                    }
                    clearLoadSelection(); // Clears dropdown selection regardless
                    alert(`Prompt "${nameToDelete}" deleted.`);
                } catch (e) { console.error("Delete failed", e); alert("Error deleting."); }
            } else { alert(`Error: "${nameToDelete}" not found.`); setSavedPromptNames(Object.keys(savedPrompts).sort()); clearLoadSelection(); }
        }
    }, [selectedPromptToLoad, promptName, clearLoadSelection]); // Dependencies for delete logic

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setComponents((currentItems) => {
                const oldIndex = currentItems.findIndex((item) => item.id === active.id);
                const newIndex = currentItems.findIndex((item) => item.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return currentItems;
                return arrayMove(currentItems, oldIndex, newIndex);
            });
            clearLoadSelection();
        }
    }, [clearLoadSelection]);

    // Specific setter for controlled input
    const setPromptNameDirectly = useCallback((name: string) => {
        setPromptName(name);
    }, []);

    // Calculate generated prompt (memoize if components array gets huge, maybe later)
     const generatedPrompt = components
        .map(comp => comp.content.trim() === ""
            ? `**${comp.type}:**` // No newline if empty - using Option 2 from previous discussion
            : `**${comp.type}:**\n${comp.content}`
        )
        .join('\n\n---\n\n');


    // --- Value Provided by Context ---
    const value: PromptContextType = {
        components,
        promptName,
        savedPromptNames,
        selectedPromptToLoad,
        generatedPrompt, // Include generated prompt
        addComponent,
        handleContentSave,
        handleDeleteComponent,
        handleSavePrompt,
        handleClearCanvas,
        handleLoadPrompt,
        handleDeleteSavedPrompt,
        handleDragEnd,
        setPromptNameDirectly,
    };

    return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
}