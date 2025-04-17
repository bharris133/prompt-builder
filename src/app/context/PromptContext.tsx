// src/app/context/PromptContext.tsx 

'use client';

import React, {
    createContext,
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
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

// --- NEW: Define structure for saved settings ---
export interface PromptSettings {
    provider: string;
    model: string;
    // Add other settings later if needed (e.g., temperature)
}

// --- NEW: Define structure for a single saved prompt entry ---
export interface SavedPromptEntry {
    name: string; // Also store name here for easier iteration if needed
    components: PromptComponentData[];
    settings: PromptSettings;
    savedAt: string; // Add a timestamp
}

interface SavedPrompts {
    [promptName: string]: SavedPromptEntry;
}

export type RefinementStrategy = 'userKey' | 'managedKey';

// --- Validation Status Type ---
export type ApiKeyValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

// --- NEW: Type for variable values ---
export interface VariableValues {
    [key: string]: string; // Map variable name (string) to its value (string)
}



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
    // --- Variable State ---
    detectedVariables: string[]; // Array of unique variable names found
    variableValues: VariableValues; // Object holding current values    
    // --- API Key Validation State ---
    apiKeyValidationStatus: ApiKeyValidationStatus;
    apiKeyValidationError: string | null;
    // --- NEW: Validation Handler ---
    validateUserApiKey: (keyToValidate: string) => Promise<boolean>; // Returns true if valid, false otherwise
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
     // --- handler for loading refined prompt to canvas ---
    loadRefinedPromptToCanvas: () => void;
    // Modal Setter
    setIsApiKeyModalOpen: (isOpen: boolean) => void;
    // --- NEW: Variable Setter ---
    setVariableValue: (variableName: string, value: string) => void;
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

    // --- NEW: API Key Validation State ---
    const [apiKeyValidationStatus, setApiKeyValidationStatusInternal] = useState<ApiKeyValidationStatus>('idle');
    const [apiKeyValidationError, setApiKeyValidationErrorInternal] = useState<string | null>(null);

    // --- NEW: Variable State ---
    const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
    const [variableValues, setVariableValues] = useState<VariableValues>({});    

    // --- Effects ---
    useEffect(() => { // Load saved names
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (storedData) {
                try {
                    const savedPrompts: SavedPrompts = JSON.parse(storedData);
                    if (typeof savedPrompts === 'object' && savedPrompts !== null) {
                        setSavedPromptNames(Object.keys(savedPrompts).sort());
                    } else { localStorage.removeItem(SAVED_PROMPTS_KEY); }
                } catch (e) { console.error("Failed to parse saved prompts:", e); localStorage.removeItem(SAVED_PROMPTS_KEY); }
            }
        }
    }, []);
    useEffect(() => { // Recalculate nextId
        const maxId = components.length > 0 ? Math.max(...components.map(c => c.id)) : -1;
        nextId.current = maxId + 1;
    }, [components]);

    // --- NEW: Effect to Detect Variables ---
    useEffect(() => {
        const regex = /\{\{(.*?)\}\}/g; // Regex to find {{variable_name}}
        let allVars = new Set<string>(); // Use a Set to automatically handle uniqueness

        components.forEach(component => {
            let match;
            // Find all matches in the current component's content
            while ((match = regex.exec(component.content)) !== null) {
                // match[1] contains the text inside the braces
                const varName = match[1].trim();
                if (varName) { // Ensure it's not empty braces {{ }}
                    allVars.add(varName);
                }
            }
        });

        const sortedVars = Array.from(allVars).sort();
        setDetectedVariables(sortedVars);
        console.log("[PromptContext] Detected variables:", sortedVars);

        // Optional: Clean up variableValues state - remove entries for variables that no longer exist
        setVariableValues(currentValues => {
            const newValues: VariableValues = {};
            sortedVars.forEach(varName => {
                newValues[varName] = currentValues[varName] || ''; // Keep existing value or default to empty
            });
            return newValues;
        });

    }, [components]); // Re-run whenever components change


    // --- Handlers (useCallback) ---
    const clearLoadSelection = useCallback(() => { setSelectedPromptToLoad(''); }, []);
    const addComponent = useCallback((type: string) => { const id = nextId.current++; setComponents(p => [...p, { id, type, content: '' }]); clearLoadSelection(); }, [clearLoadSelection]);
    const handleContentSave = useCallback((id: number, content: string) => { setComponents(p => p.map(c => c.id === id ? { ...c, content } : c)); clearLoadSelection(); }, [clearLoadSelection]);
    const handleDeleteComponent = useCallback((id: number) => { if (window.confirm('Delete component from canvas?')) { setComponents(p => p.filter(c => c.id !== id)); clearLoadSelection(); }}, [clearLoadSelection]);
    const handleDragEnd = useCallback((event: DragEndEvent) => { const { active, over } = event; if (over && active.id !== over.id) { setComponents(items => { const oldIdx = items.findIndex(i => i.id === active.id); const newIdx = items.findIndex(i => i.id === over.id); return (oldIdx !== -1 && newIdx !== -1) ? arrayMove(items, oldIdx, newIdx) : items; }); clearLoadSelection(); }}, [clearLoadSelection]);
    const setPromptNameDirectly = useCallback((name: string) => { setPromptName(name); }, []);

    // --- Handlers with Full Logic - DEFINITELY COMPLETE ---
    const handleSavePrompt = useCallback(() => {
        const nameToSave = promptName.trim();
        if (!nameToSave) { alert("Please enter a name for the prompt."); return; }
        if (components.length === 0) { alert("Cannot save an empty prompt."); return; }
        if (typeof window === 'undefined') return;

        let savedPrompts: SavedPrompts = {};
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) { try { savedPrompts = JSON.parse(storedData); if (typeof savedPrompts !== 'object' || savedPrompts === null) savedPrompts = {}; } catch (e) { console.error("Failed to parse saved prompts:", e); savedPrompts = {}; } }

        const isOverwriting = !!savedPrompts[nameToSave];
        if (isOverwriting && !window.confirm(`Prompt "${nameToSave}" already exists. Overwrite it?`)) return;

        // --- Create the new entry object ---
        const newEntry: SavedPromptEntry = {
            name: nameToSave,
            components: components, // Current components
            settings: {
                provider: selectedProvider, // Current selected provider
                model: selectedModel,       // Current selected model
            },
            savedAt: new Date().toISOString(), // Add timestamp
        };
        // --- End new entry object ---

        savedPrompts[nameToSave] =  newEntry; // Save the whole entry object

        try {
            localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
            alert(`Prompt "${nameToSave}" saved!`);
            if (!savedPromptNames.includes(nameToSave)) {
                setSavedPromptNames(prevNames => [...prevNames, nameToSave].sort());
            }
            setSelectedPromptToLoad(nameToSave); // Sync dropdown
        } catch (e) { console.error("Save failed", e); alert("Error saving prompt."); }
    }, [components, promptName, savedPromptNames, selectedProvider, selectedModel]); // Dependencies- Added settings dependencies

    const handleClearCanvas = useCallback(() => {
        const doClear = components.length > 0 || !!promptName || !!refinedPromptResult || !!refinementError;
        if (doClear && window.confirm("Clear the canvas and refinement results? Unsaved prompt changes will be lost.")) {
            setComponents([]);
            setPromptName('');
            clearLoadSelection();
            setRefinedPromptResult(null);
            setRefinementError(null);
            setIsLoadingRefinement(false);
            console.log("[PromptContext] Canvas and refinement cleared.");
        } else if (!doClear) {
             console.log("[PromptContext] Canvas already clear.");
        }
    }, [components.length, promptName, refinedPromptResult, refinementError, clearLoadSelection]); // Dependencies

    const handleLoadPrompt = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        const nameToLoad = event.target.value;
        if (nameToLoad === selectedPromptToLoad && nameToLoad !== "") return;
        if (!nameToLoad) { setSelectedPromptToLoad(''); return; } // Handle selecting placeholder
        const needsConfirmation = components.length > 0 || !!promptName || !!refinedPromptResult || !!refinementError; // Check if anything might be overwritten
        if (needsConfirmation && !window.confirm(`Loading "${nameToLoad}" will replace the current canvas content and refinement results. Proceed?`)) return;
        if (typeof window === 'undefined') return;
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) {
            try {
                const savedPrompts: SavedPrompts = JSON.parse(storedData);
                const entryToLoad  = savedPrompts[nameToLoad];
                // Validate the loaded entry structure (basic check)
                if (entryToLoad && entryToLoad.components && entryToLoad.settings) {
                    setComponents(entryToLoad.components);      // Load components
                    setPromptName(entryToLoad.name);            // Load name (syncs input field)
                    setSelectedPromptToLoad(entryToLoad.name);  // Sync dropdown

                    // --- Load Settings ---
                    setSelectedProviderInternal(entryToLoad.settings.provider);
                    setSelectedModelInternal(entryToLoad.settings.model);
                    // --- End Load Settings -
                    // Clear refinement state when loading new prompt
                    setRefinedPromptResult(null);
                    setRefinementError(null);
                    setIsLoadingRefinement(false);
                    console.log(`Prompt "${nameToLoad}" loaded with settings.`);
                } else { console.error(`"${nameToLoad}" not found or invalid format in storage.`); alert(`Error finding or loading "${nameToLoad}".`); clearLoadSelection(); }
            } catch (e) { console.error("Parse fail on load", e); alert("Error loading prompt."); clearLoadSelection(); }
        } else { alert("No saved prompts found."); clearLoadSelection(); }
    }, [components.length, promptName, refinedPromptResult, refinementError, selectedPromptToLoad, clearLoadSelection]); // Dependencies

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
                    // Clear canvas and refinement if the deleted prompt was the one loaded
                    if (promptName === nameToDelete) {
                         setComponents([]);
                         setPromptName('');
                         setRefinedPromptResult(null);
                         setRefinementError(null);
                         setIsLoadingRefinement(false);
                    }
                    clearLoadSelection(); // Always clear dropdown selection
                    alert(`Prompt "${nameToDelete}" deleted.`);
                } catch (e) { console.error("Delete failed", e); alert("Error deleting."); }
            } else { alert(`Error: "${nameToDelete}" not found.`); setSavedPromptNames(Object.keys(savedPrompts).sort()); clearLoadSelection(); } // Resync list if needed
        }
    }, [selectedPromptToLoad, promptName, clearLoadSelection]); // Dependencies

    // --- Refinement Setters ---
    const setRefinementStrategy = useCallback((strategy: RefinementStrategy) => { setRefinementStrategyInternal(strategy); setRefinedPromptResult(null); setRefinementError(null); // Reset validation status when strategy changes
        setApiKeyValidationStatusInternal('idle'); setApiKeyValidationErrorInternal(null); }, []);
    const setUserApiKey = useCallback((apiKey: string) => { setUserApiKeyInternal(apiKey.trim());// Reset validation status when key changes *before* saving
        setApiKeyValidationStatusInternal('idle');
        setApiKeyValidationErrorInternal(null);}, []);
    const setSelectedProvider = useCallback((provider: string) => { setSelectedProviderInternal(provider);         // Reset validation status when key changes *before* saving
        setApiKeyValidationStatusInternal('idle');
        setApiKeyValidationErrorInternal(null); }, []);
    const setSelectedModel = useCallback((model: string) => { setSelectedModelInternal(model); }, []);
    const setIsApiKeyModalOpen = useCallback((isOpen: boolean) => { setIsApiKeyModalOpenInternal(isOpen); 
        // Reset validation status when modal is closed
        if (!isOpen) {
            setApiKeyValidationStatusInternal('idle');
            setApiKeyValidationErrorInternal(null);
        }
    }, []);

    
    // --- Refinement Handler ---
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

    // --- *** NEW: Handler to Load Refined Prompt to Canvas *** ---
    const loadRefinedPromptToCanvas = useCallback(() => {
        if (!refinedPromptResult) {
            console.warn("Attempted to load refined prompt to canvas, but no result exists.");
            return; // Do nothing if there's no refined prompt
        }

        if (!window.confirm("Replace current canvas content with the refined prompt?")) {
            return; // User cancelled
        }

        // Create a single new component containing the refined prompt
        // We'll use 'Context' type for now, could be a dedicated type later
        const newComponent: PromptComponentData = {
            id: 0, // Start with ID 0 for the new canvas content
            type: 'Context', // Or 'Refined Prompt', 'Instruction' etc.
            content: refinedPromptResult,
        };

        // Update the canvas components
        setComponents([newComponent]);

        // Suggest a new name in the header input
        const originalName = promptName.trim();
        const suggestedName = originalName ? `${originalName} - Refined` : "Refined Prompt 1";
        setPromptName(suggestedName); // Use the direct state setter

        // Clear the refinement display area
        setRefinedPromptResult(null);
        setRefinementError(null);
        setIsLoadingRefinement(false); // Just in case

        // Clear saved prompt selection as canvas content has changed
        clearLoadSelection();

        console.log("[PromptContext] Refined prompt loaded to canvas.");

    }, [refinedPromptResult, promptName, clearLoadSelection]); // Dependencies

        // --- *** NEW: API Key Validation Handler *** ---
    const validateUserApiKey = useCallback(async (keyToValidate: string): Promise<boolean> => {
        const provider = selectedProvider; // Use currently selected provider
        const key = keyToValidate.trim();

        if (!key) {
            setApiKeyValidationErrorInternal("API Key cannot be empty.");
            setApiKeyValidationStatusInternal('invalid');
            return false;
        }

        setApiKeyValidationStatusInternal('validating');
        setApiKeyValidationErrorInternal(null);
        console.log(`[PromptContext] Validating API Key for provider: ${provider}`);

        try {
            let isValid = false;
            if (provider === 'openai') {
                // Use the 'List Models' endpoint as a lightweight validation check
                const response = await fetch('https://api.openai.com/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${key}`
                    }
                });

                if (response.ok) {
                    // Even if the response body isn't what we expect, a 200 OK means the key is accepted
                    console.log("[PromptContext] OpenAI Key validation successful (List Models status OK).");
                    isValid = true;
                } else {
                    // Handle specific errors (e.g., 401 Unauthorized)
                    const errorData = await response.json();
                    const errorMsg = errorData?.error?.message || `Validation failed with status ${response.status}`;
                    console.error("[PromptContext] OpenAI Key validation failed:", errorMsg);
                    throw new Error(errorMsg); // Throw to be caught below
                }

            } else {
                // Placeholder for other providers
                console.warn(`[PromptContext] Validation logic for provider '${provider}' not implemented.`);
                throw new Error(`Validation for ${provider} is not supported yet.`);
            }

            // Update state on success
            setApiKeyValidationStatusInternal('valid');
            setApiKeyValidationErrorInternal(null); // Clear any previous error
            return true;

        } catch (error: any) {
            console.error("[PromptContext] API Key validation caught error:", error);
            setApiKeyValidationStatusInternal('invalid');
            // Provide a slightly friendlier message for common auth errors
            if (error.message && (error.message.includes('Incorrect API key') || error.message.includes('401'))) {
                 setApiKeyValidationErrorInternal("Invalid API Key provided.");
            } else {
                 setApiKeyValidationErrorInternal(error.message || "Validation request failed.");
            }
            return false;
        } finally {
            // If status is still 'validating' after try/catch (shouldn't happen often), reset
            // Note: This doesn't work perfectly because state updates are async.
            // We rely on setting 'valid' or 'invalid' explicitly within try/catch.
            // If needed, could add a check here based on the returned boolean.
             if (apiKeyValidationStatus === 'validating') {
                 // This check might be unreliable due to state update timing.
                 // setApiKeyValidationStatusInternal('idle'); // Or 'invalid' as a fallback
             }
        }

    }, [selectedProvider, apiKeyValidationStatus]); // Dependencies

    // --- NEW: Variable Value Setter ---
    const setVariableValue = useCallback((variableName: string, value: string) => {
        setVariableValues(prevValues => ({
            ...prevValues,
            [variableName]: value,
        }));
    }, []); // No dependencies needed
    


    // --- Calculate generated prompt ---
    // *** UPDATED LOGIC FOR VARIABLE SUBSTITUTION ***
    const generatedPrompt = useMemo(() => {
        console.log("[PromptContext] Recalculating generatedPrompt with values:", variableValues);
        // 1. Combine content first
        let combinedContent = components
            .map(comp => comp.content.trim() === "" ? `**${comp.type}:**` : `**${comp.type}:**\n${comp.content}`)
            .join('\n\n---\n\n');

        // 2. Substitute variables
        // Iterate through the *current* values map
        Object.entries(variableValues).forEach(([varName, varValue]) => {
            // Create regex for {{varName}} - escape special characters in varName if necessary (basic example)
            // Using global flag 'g' to replace all occurrences
            const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
            combinedContent = combinedContent.replace(regex, varValue || `{{${varName}}}`); // Replace with value, or keep original if value is empty/undefined
        });

        return combinedContent;
    }, [components, variableValues]); // Recalculate when components OR variable values change

    // --- Value Provided by Context ---
    const value: PromptContextType = {
        components, promptName, generatedPrompt, savedPromptNames, selectedPromptToLoad,
        refinementStrategy, userApiKey, selectedProvider, selectedModel, isLoadingRefinement,
        refinedPromptResult, refinementError, isApiKeyModalOpen, apiKeyValidationStatus, detectedVariables,
        variableValues,apiKeyValidationError, addComponent, handleContentSave, handleDeleteComponent, handleDragEnd, 
        setPromptNameDirectly, handleSavePrompt,handleClearCanvas, handleLoadPrompt, handleDeleteSavedPrompt, setRefinementStrategy,
        setUserApiKey, setSelectedProvider, setSelectedModel, handleRefinePrompt, setIsApiKeyModalOpen,
        loadRefinedPromptToCanvas,validateUserApiKey,setVariableValue,        
    };

    return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
}