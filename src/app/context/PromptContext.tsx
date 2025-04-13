// src/app/context/PromptContext.tsx // COMPLETE FILE REPLACEMENT - FINAL ATTEMPT

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
    // *** Corrected Interface ***
    id: number;
    type: string;
    content: string; // Ensure 'content' is defined
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
interface PromptProviderProps { children: ReactNode; }

export function PromptProvider({ children }: PromptProviderProps) {
    // State variables
    const [components, setComponents] = useState<PromptComponentData[]>([]);
    const [promptName, setPromptName] = useState<string>('');
    const nextId = useRef<number>(0);
    const [savedPromptNames, setSavedPromptNames] = useState<string[]>([]);
    const [selectedPromptToLoad, setSelectedPromptToLoad] = useState<string>('');
    const [refinementStrategy, setRefinementStrategyInternal] = useState<RefinementStrategy>('userKey');
    const [userApiKey, setUserApiKeyInternal] = useState<string>('');
    const [selectedProvider, setSelectedProviderInternal] = useState<string>('openai');
    const [selectedModel, setSelectedModelInternal] = useState<string>('gpt-3.5-turbo');
    const [isLoadingRefinement, setIsLoadingRefinement] = useState<boolean>(false);
    const [refinedPromptResult, setRefinedPromptResult] = useState<string | null>(null);
    const [refinementError, setRefinementError] = useState<string | null>(null);
    const [isApiKeyModalOpen, setIsApiKeyModalOpenInternal] = useState<boolean>(false);

    // --- Effects - COMPLETE ---
    useEffect(() => { // Load saved names
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (storedData) {
                try {
                    const savedPrompts: SavedPrompts = JSON.parse(storedData);
                     // Basic validation: Ensure it's an object
                    if (typeof savedPrompts === 'object' && savedPrompts !== null) {
                        setSavedPromptNames(Object.keys(savedPrompts).sort());
                    } else {
                        console.warn("Invalid data found in localStorage for saved prompts, clearing.");
                        localStorage.removeItem(SAVED_PROMPTS_KEY);
                    }
                } catch (e) {
                    console.error("Failed to parse saved prompts, clearing:", e);
                    localStorage.removeItem(SAVED_PROMPTS_KEY);
                }
            }
        }
    }, []);

    useEffect(() => { // Recalculate nextId
        const maxId = components.length > 0 ? Math.max(...components.map(c => c.id)) : -1;
        nextId.current = maxId + 1;
    }, [components]);

    // --- Handlers (useCallback) ---
    const clearLoadSelection = useCallback(() => { setSelectedPromptToLoad(''); }, []);

    const addComponent = useCallback((type: string) => {
        const newId = nextId.current;
        nextId.current += 1;
        const newComponent: PromptComponentData = { id: newId, type, content: '' }; // Uses correct interface
        setComponents(prev => [...prev, newComponent]);
        clearLoadSelection();
    }, [clearLoadSelection]);

    const handleContentSave = useCallback((id: number, newContent: string) => {
        setComponents(prev => prev.map(comp => comp.id === id ? { ...comp, content: newContent } : comp)); // Uses 'content'
        clearLoadSelection();
    }, [clearLoadSelection]);

    const handleDeleteComponent = useCallback((id: number) => {
        if (window.confirm(`Delete this component from the canvas?`)) {
            setComponents(prev => prev.filter(comp => comp.id !== id));
            clearLoadSelection();
        }
    }, [clearLoadSelection]);

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

    const setPromptNameDirectly = useCallback((name: string) => { setPromptName(name); }, []);

    // --- Handlers with Full Logic - COMPLETE ---
    const handleSavePrompt = useCallback(() => {
        const nameToSave = promptName.trim();
        if (!nameToSave) { alert("Please enter a name for the prompt."); return; }
        if (components.length === 0) { alert("Cannot save an empty prompt."); return; }
        if (typeof window === 'undefined') return;

        let savedPrompts: SavedPrompts = {};
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) { try { savedPrompts = JSON.parse(storedData); if (typeof savedPrompts !== 'object' || savedPrompts === null) savedPrompts = {}; } catch (e) { savedPrompts = {}; } }

        const isOverwriting = !!savedPrompts[nameToSave];
        if (isOverwriting && !window.confirm(`Prompt "${nameToSave}" already exists. Overwrite it?`)) return;

        savedPrompts[nameToSave] = components;
        try {
            localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
            alert(`Prompt "${nameToSave}" saved!`);
            if (!savedPromptNames.includes(nameToSave)) {
                setSavedPromptNames(prevNames => [...prevNames, nameToSave].sort());
            }
            setSelectedPromptToLoad(nameToSave);
        } catch (e) { console.error("Save failed", e); alert("Error saving prompt."); }
    }, [components, promptName, savedPromptNames]); // Dependencies

    const handleClearCanvas = useCallback(() => {
        if (components.length > 0 && window.confirm("Clear the canvas? Unsaved changes will be lost.")) {
            setComponents([]); setPromptName(''); clearLoadSelection();
        } else if (components.length === 0) {
            setPromptName(''); clearLoadSelection();
        }
    }, [components.length, clearLoadSelection]); // Dependencies

    const handleLoadPrompt = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        const nameToLoad = event.target.value;
        if (nameToLoad === selectedPromptToLoad && nameToLoad !== "") return;
        if (!nameToLoad) { setSelectedPromptToLoad(''); return; }
        const needsConfirmation = components.length > 0 && selectedPromptToLoad !== nameToLoad;
        if (needsConfirmation && !window.confirm(`Loading "${nameToLoad}" will replace the current canvas content. Proceed?`)) return;
        if (typeof window === 'undefined') return;
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) {
            try {
                const savedPrompts: SavedPrompts = JSON.parse(storedData);
                const componentsToLoad = savedPrompts[nameToLoad];
                if (componentsToLoad && Array.isArray(componentsToLoad)) { // Add validation
                    setComponents(componentsToLoad); setPromptName(nameToLoad); setSelectedPromptToLoad(nameToLoad);
                    console.log(`Prompt "${nameToLoad}" loaded.`);
                } else { console.error(`"${nameToLoad}" not found or invalid format in storage.`); alert(`Error finding or loading "${nameToLoad}".`); clearLoadSelection(); }
            } catch (e) { console.error("Parse fail on load", e); alert("Error loading prompt."); clearLoadSelection(); }
        } else { alert("No saved prompts found."); clearLoadSelection(); }
    }, [components.length, selectedPromptToLoad, clearLoadSelection]); // Dependencies

    const handleDeleteSavedPrompt = useCallback(() => {
        const nameToDelete = selectedPromptToLoad;
        if (!nameToDelete) { alert("Please select a prompt from the dropdown to delete."); return; }
        if (window.confirm(`Are you sure you want to permanently delete the saved prompt "${nameToDelete}"? This cannot be undone.`)) {
            if (typeof window === 'undefined') return;
            let savedPrompts: SavedPrompts = {};
            const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (storedData) { try { savedPrompts = JSON.parse(storedData); if (typeof savedPrompts !== 'object' || savedPrompts === null) savedPrompts = {}; } catch (e) { savedPrompts = {}; } }
            if (savedPrompts[nameToDelete]) {
                delete savedPrompts[nameToDelete];
                try {
                    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
                    setSavedPromptNames(prevNames => prevNames.filter(name => name !== nameToDelete));
                    if (promptName === nameToDelete) { setComponents([]); setPromptName(''); } // Clear canvas if loaded
                    clearLoadSelection(); alert(`Prompt "${nameToDelete}" deleted successfully.`);
                } catch (e) { console.error("Failed to update localStorage after delete", e); alert("Error deleting prompt from storage."); }
            } else { alert(`Error: Prompt "${nameToDelete}" not found in storage.`); setSavedPromptNames(Object.keys(savedPrompts).sort()); clearLoadSelection(); }
        }
    }, [selectedPromptToLoad, promptName, clearLoadSelection]); // Dependencies

    // --- Refinement Setters ---
    const setRefinementStrategy = useCallback((strategy: RefinementStrategy) => {
        console.log("Setting refinement strategy:", strategy); setRefinementStrategyInternal(strategy);
        setRefinedPromptResult(null); setRefinementError(null);
    }, []);
    const setUserApiKey = useCallback((apiKey: string) => { setUserApiKeyInternal(apiKey.trim()); }, []);
    const setSelectedProvider = useCallback((provider: string) => { setSelectedProviderInternal(provider); }, []);
    const setSelectedModel = useCallback((model: string) => { setSelectedModelInternal(model); }, []);
    const setIsApiKeyModalOpen = useCallback((isOpen: boolean) => { setIsApiKeyModalOpenInternal(isOpen); }, []);

    // --- Refinement Handler - COMPLETE ---
    const handleRefinePrompt = useCallback(async () => {
        console.log("[PromptContext] handleRefinePrompt CALLED!");
        if (isLoadingRefinement) { console.log("[PromptContext] Aborting refine: Already loading."); return; }
        setRefinedPromptResult(null); setRefinementError(null); setIsLoadingRefinement(true);

        const currentGeneratedPrompt = components
            .map(comp => comp.content.trim() === "" ? `**${comp.type}:**` : `**${comp.type}:**\n${comp.content}`) // Uses 'content'
            .join('\n\n---\n\n');

        if (!currentGeneratedPrompt.trim()) {
            setRefinementError("Cannot refine an empty prompt."); setIsLoadingRefinement(false);
            console.log("[PromptContext] Aborting refine: Prompt empty."); return;
        }

        try {
            let responseData: any;
            if (refinementStrategy === 'userKey') {
                if (!userApiKey) { throw new Error("API Key is required. Please enter it via the settings."); }
                if (selectedProvider !== 'openai') { throw new Error(`Direct frontend calls for provider '${selectedProvider}' not implemented.`); }
                console.log(`[PromptContext] Refining with user key (OpenAI ${selectedModel})...`);
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userApiKey}` },
                    body: JSON.stringify({ model: selectedModel, messages: [ { role: 'system', content: `You are an expert prompt engineer assistant. The user will provide prompt components (like Instructions, Context, Role, Example Input, Example Output, Tools). Your task is to combine these components into a single, cohesive, and effective prompt suitable for a large language model. Ensure the final prompt clearly incorporates the intent and details from all provided components. Structure the output logically. Output *only* the final combined and refined prompt text, without any explanations or preambles.` }, { role: 'user', content: currentGeneratedPrompt } ], temperature: 0.5, max_tokens: 1000, }),
                });
                responseData = await response.json();
                if (!response.ok) { const errorMsg = responseData?.error?.message || `Request failed with status ${response.status}`; console.error("[PromptContext] OpenAI API Error:", responseData); throw new Error(errorMsg); }
                const refinedText = responseData?.choices?.[0]?.message?.content?.trim();
                if (!refinedText) { console.warn("[PromptContext] No refined text content received from OpenAI response:", responseData); throw new Error('No refined prompt content received from OpenAI.'); }
                setRefinedPromptResult(refinedText);
            } else { // managedKey
                console.log(`[PromptContext] Refining with managed key (/api/refine)... Provider: ${selectedProvider}, Model: ${selectedModel}`);
                const response = await fetch('/api/refine', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: currentGeneratedPrompt, provider: selectedProvider, model: selectedModel }),
                });
                responseData = await response.json();
                if (!response.ok) { console.error("[PromptContext] Backend API Error:", responseData); throw new Error(responseData.error || `Backend request failed with status ${response.status}`); }
                if (!responseData.refinedPrompt) { console.warn("[PromptContext] No refined prompt received from backend:", responseData); throw new Error("Received response from backend did not contain a refined prompt."); }
                setRefinedPromptResult(responseData.refinedPrompt);
            }
            console.log("[PromptContext] Refinement successful.");
        } catch (error: any) {
            console.error("[PromptContext] Refinement failed:", error);
            setRefinementError(error.message || "An unknown error occurred during refinement.");
        } finally {
            setIsLoadingRefinement(false);
            console.log("[PromptContext] Refinement finished.");
        }
    }, [ isLoadingRefinement, components, refinementStrategy, userApiKey, selectedProvider, selectedModel, setRefinedPromptResult, setRefinementError, setIsLoadingRefinement ]); // Dependencies

    // --- Calculate generated prompt ---
    const generatedPrompt = components
        .map(comp => comp.content.trim() === "" ? `**${comp.type}:**` : `**${comp.type}:**\n${comp.content}`) // Uses 'content'
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