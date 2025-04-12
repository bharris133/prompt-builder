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
import { DragEndEvent } from '@dnd-kit/core';

// --- Type Definitions ---
export interface PromptComponentData {
    id: number;
    type: string;
    content: string;
}

interface SavedPrompts {
    [promptName: string]: PromptComponentData[];
}

export type RefinementStrategy = 'userKey' | 'managedKey';

// Define the shape of the context value
interface PromptContextType {
    // Core Prompt State
    components: PromptComponentData[];
    promptName: string;
    generatedPrompt: string;
    // Saving/Loading State
    savedPromptNames: string[];
    selectedPromptToLoad: string;
    // Refinement State
    refinementStrategy: RefinementStrategy;
    userApiKey: string;
    selectedProvider: string;
    selectedModel: string;
    isLoadingRefinement: boolean;
    refinedPromptResult: string | null;
    refinementError: string | null;
    // Modal State
    isApiKeyModalOpen: boolean;
    // Core Handlers
    addComponent: (type: string) => void;
    handleContentSave: (id: number, newContent: string) => void;
    handleDeleteComponent: (id: number) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    setPromptNameDirectly: (name: string) => void;
    // Save/Load Handlers
    handleSavePrompt: () => void;
    handleClearCanvas: () => void;
    handleLoadPrompt: (event: ChangeEvent<HTMLSelectElement>) => void;
    handleDeleteSavedPrompt: () => void;
    // Refinement Handlers & Setters
    setRefinementStrategy: (strategy: RefinementStrategy) => void;
    setUserApiKey: (apiKey: string) => void;
    setSelectedProvider: (provider: string) => void;
    setSelectedModel: (model: string) => void;
    handleRefinePrompt: () => Promise<void>;
    // Modal Setter
    setIsApiKeyModalOpen: (isOpen: boolean) => void;
}

// Create the context
export const PromptContext = createContext<PromptContextType | null>(null);

// LocalStorage Key for saving prompts
const SAVED_PROMPTS_KEY = 'promptBuilderSavedPrompts';

// --- Provider Component ---
interface PromptProviderProps {
    children: ReactNode;
}

export function PromptProvider({ children }: PromptProviderProps) {
    // Core State
    const [components, setComponents] = useState<PromptComponentData[]>([]);
    const [promptName, setPromptName] = useState<string>('');
    const nextId = useRef<number>(0);
    // Saving/Loading State
    const [savedPromptNames, setSavedPromptNames] = useState<string[]>([]);
    const [selectedPromptToLoad, setSelectedPromptToLoad] = useState<string>('');
    // Refinement State
    const [refinementStrategy, setRefinementStrategyInternal] = useState<RefinementStrategy>('userKey');
    const [userApiKey, setUserApiKeyInternal] = useState<string>('');
    const [selectedProvider, setSelectedProviderInternal] = useState<string>('openai');
    const [selectedModel, setSelectedModelInternal] = useState<string>('gpt-3.5-turbo');
    const [isLoadingRefinement, setIsLoadingRefinement] = useState<boolean>(false);
    const [refinedPromptResult, setRefinedPromptResult] = useState<string | null>(null);
    const [refinementError, setRefinementError] = useState<string | null>(null);
    // Modal State
    const [isApiKeyModalOpen, setIsApiKeyModalOpenInternal] = useState<boolean>(false);

    // --- Effects ---
    useEffect(() => { // Load saved names
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (storedData) { try { const p = JSON.parse(storedData); setSavedPromptNames(Object.keys(p).sort()); } catch (e) { console.error(e); localStorage.removeItem(SAVED_PROMPTS_KEY); }}
        }
    }, []);
    useEffect(() => { // Recalculate nextId
        const maxId = components.length > 0 ? Math.max(...components.map(c => c.id)) : -1;
        nextId.current = maxId + 1;
    }, [components]);

    // --- Handlers (useCallback) ---
    const clearLoadSelection = useCallback(() => { setSelectedPromptToLoad(''); }, []);

    // *** CORRECTED IMPLEMENTATIONS ***
    const addComponent = useCallback((type: string) => {
        const newId = nextId.current;
        nextId.current += 1;
        const newComponent: PromptComponentData = { id: newId, type, content: '' };
        setComponents(prev => [...prev, newComponent]);
        clearLoadSelection();
    }, [clearLoadSelection]); // Dependency added

    const handleContentSave = useCallback((id: number, newContent: string) => {
        setComponents(prev => prev.map(comp => comp.id === id ? { ...comp, content: newContent } : comp));
        clearLoadSelection();
    }, [clearLoadSelection]); // Dependency added

    const handleDeleteComponent = useCallback((id: number) => {
        if (window.confirm(`Delete this component from the canvas?`)) {
            setComponents(prev => prev.filter(comp => comp.id !== id));
            clearLoadSelection();
        }
    }, [clearLoadSelection]); // Dependency added

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
    }, [clearLoadSelection]); // Dependency added
    // *** END OF CORRECTED IMPLEMENTATIONS ***

    const setPromptNameDirectly = useCallback((name: string) => { setPromptName(name); }, []);

    const handleSavePrompt = useCallback(() => {
        const nameToSave = promptName.trim();
        if (!nameToSave || components.length === 0) { /* alerts */ return; }
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
            if (!savedPromptNames.includes(nameToSave)) { setSavedPromptNames(prevNames => [...prevNames, nameToSave].sort()); }
            setSelectedPromptToLoad(nameToSave);
        } catch (e) { console.error("Save failed", e); alert("Error saving."); }
    }, [components, promptName, savedPromptNames]);

    const handleClearCanvas = useCallback(() => {
        if (components.length > 0 && window.confirm("Clear canvas?")) { setComponents([]); setPromptName(''); clearLoadSelection(); }
        else if (components.length === 0) { setPromptName(''); clearLoadSelection(); }
    }, [components.length, clearLoadSelection]);

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
                if (componentsToLoad) { setComponents(componentsToLoad); setPromptName(nameToLoad); setSelectedPromptToLoad(nameToLoad); console.log(`Prompt "${nameToLoad}" loaded.`); }
                else { console.error(`"${nameToLoad}" not found.`); alert(`Error finding "${nameToLoad}".`); clearLoadSelection(); }
            } catch (e) { console.error("Parse fail on load", e); alert("Error loading."); clearLoadSelection(); }
        } else { alert("No saved prompts."); clearLoadSelection(); }
    }, [components.length, selectedPromptToLoad, clearLoadSelection]);

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
                    if (promptName === nameToDelete) { setComponents([]); setPromptName(''); }
                    clearLoadSelection(); alert(`Prompt "${nameToDelete}" deleted.`);
                } catch (e) { console.error("Delete failed", e); alert("Error deleting."); }
            } else { alert(`Error: "${nameToDelete}" not found.`); setSavedPromptNames(Object.keys(savedPrompts).sort()); clearLoadSelection(); }
        }
    }, [selectedPromptToLoad, promptName, clearLoadSelection]);

    const setRefinementStrategy = useCallback((strategy: RefinementStrategy) => {
        console.log("Setting refinement strategy:", strategy); setRefinementStrategyInternal(strategy);
        setRefinedPromptResult(null); setRefinementError(null);
    }, []);
    const setUserApiKey = useCallback((apiKey: string) => { setUserApiKeyInternal(apiKey.trim()); }, []);
    const setSelectedProvider = useCallback((provider: string) => { setSelectedProviderInternal(provider); }, []);
    const setSelectedModel = useCallback((model: string) => { setSelectedModelInternal(model); }, []);
    const handleRefinePrompt = useCallback(async () => { /* ... refinement logic unchanged ... */ }, [ isLoadingRefinement, components, refinementStrategy, userApiKey, selectedProvider, selectedModel, setRefinedPromptResult, setRefinementError, setIsLoadingRefinement ]);
    const setIsApiKeyModalOpen = useCallback((isOpen: boolean) => { setIsApiKeyModalOpenInternal(isOpen); }, []);

    // --- Calculate generated prompt ---
     const generatedPrompt = components
        .map(comp => comp.content.trim() === "" ? `**${comp.type}:**` : `**${comp.type}:**\n${comp.content}`)
        .join('\n\n---\n\n');

    // --- Value Provided by Context ---
    const value: PromptContextType = {
        components, promptName, generatedPrompt, savedPromptNames, selectedPromptToLoad,
        refinementStrategy, userApiKey, selectedProvider, selectedModel, isLoadingRefinement,
        refinedPromptResult, refinementError, isApiKeyModalOpen, addComponent, handleContentSave,
        handleDeleteComponent, handleDragEnd, setPromptNameDirectly, handleSavePrompt,
        handleClearCanvas, handleLoadPrompt, handleDeleteSavedPrompt, setRefinementStrategy,
        setUserApiKey, setSelectedProvider, setSelectedModel, handleRefinePrompt, setIsApiKeyModalOpen,
    };

    return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
}