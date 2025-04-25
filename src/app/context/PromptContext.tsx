// src/app/context/PromptContext.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, {
    createContext,
    useState,
    useRef,
    useEffect,
    useCallback,
    ReactNode,
    ChangeEvent,
    useMemo, // Keep useMemo for generatedPrompt
} from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

// --- Type Definitions ---
export interface PromptComponentData {
    id: number;
    type: string;
    content: string;
}
export interface PromptSettings {
    provider: string;
    model: string;
}
export interface SavedPromptEntry {
    name: string;
    components: PromptComponentData[];
    settings: PromptSettings;
    savedAt: string;
}
interface SavedPrompts {
    [promptName: string]: SavedPromptEntry;
}
export interface SavedTemplateEntry {
    name: string;
    components: PromptComponentData[];
    savedAt: string;
}
interface SavedTemplates {
    [templateName: string]: SavedTemplateEntry;
}
export type RefinementStrategy = 'userKey' | 'managedKey';
export type ApiKeyValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

// --- Context Type Definition ---
interface PromptContextType {
    // Core Prompt State
    components: PromptComponentData[];
    promptName: string;
    generatedPrompt: string;
    // Saving/Loading State (Prompts)
    savedPromptNames: string[];
    selectedPromptToLoad: string;
    // Saving/Loading State (Templates)
    savedTemplateNames: string[];
    // Refinement State
    refinementStrategy: RefinementStrategy;
    userApiKey: string;
    selectedProvider: string;
    selectedModel: string;
    isLoadingRefinement: boolean;
    refinedPromptResult: string | null;
    refinementError: string | null;
    // API Key Modal State
    isApiKeyModalOpen: boolean;
    // API Key Validation State
    apiKeyValidationStatus: ApiKeyValidationStatus;
    apiKeyValidationError: string | null;
    // Available Models State
    availableModelsList: string[];
    isLoadingModels: boolean;
    // Variable State
    detectedVariables: string[];
    variableValues: { [key: string]: string };
    // --- NEW: Add state for template selection ---
    selectedTemplateToLoad: string;    
    // --- NEW: Add setter for template selection ---
    setSelectedTemplateToLoad: (templateName: string) => void;
    // Core Handlers
    addComponent: (type: string) => void;
    handleContentSave: (id: number, newContent: string) => void;
    handleDeleteComponent: (id: number) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    setPromptNameDirectly: (name: string) => void;
    // Save/Load Handlers (Prompts)
    handleSavePrompt: () => void;
    handleClearCanvas: () => void;
    handleLoadPrompt: (event: ChangeEvent<HTMLSelectElement>) => void;
    handleDeleteSavedPrompt: () => void;
    // Save/Load Handlers (Templates)
    handleSaveAsTemplate: (templateName: string) => boolean;
    handleLoadTemplate: (templateName: string) => void;
    handleDeleteTemplate: (templateName: string) => void;
    // Refinement Handlers & Setters
    setRefinementStrategy: (strategy: RefinementStrategy) => void;
    setUserApiKey: (apiKey: string) => void;
    setSelectedProvider: (provider: string) => void;
    setSelectedModel: (model: string) => void;
    handleRefinePrompt: () => Promise<void>;
    // Modal Setter
    setIsApiKeyModalOpen: (isOpen: boolean) => void;
    // Validation Handler
    validateUserApiKey: (keyToValidate: string) => Promise<boolean>;
    // Variable Setter
    updateVariableValue: (variableName: string, value: string) => void;
    // Load Refined Handler
    loadRefinedPromptToCanvas: () => void;
}

// Create the context
export const PromptContext = createContext<PromptContextType | null>(null);

// LocalStorage Keys
const SAVED_PROMPTS_KEY = 'promptBuilderSavedPrompts';
const SAVED_TEMPLATES_KEY = 'promptBuilderTemplates';

// --- Provider Component ---
interface PromptProviderProps { children: ReactNode; }

export function PromptProvider({ children }: PromptProviderProps) {
    // --- State ---
    const [components, setComponents] = useState<PromptComponentData[]>([]);
    const [promptName, setPromptName] = useState<string>('');
    const nextId = useRef<number>(0);
    const [savedPromptNames, setSavedPromptNames] = useState<string[]>([]);
    const [selectedPromptToLoad, setSelectedPromptToLoad] = useState<string>('');
    const [savedTemplateNames, setSavedTemplateNames] = useState<string[]>([]);
    // --- NEW: State for template selection ---
    const [selectedTemplateToLoad, setSelectedTemplateToLoadInternal] = useState<string>("");
    const [refinementStrategy, setRefinementStrategyInternal] = useState<RefinementStrategy>('userKey');
    const [userApiKey, setUserApiKeyInternal] = useState<string>('');
    const [selectedProvider, setSelectedProviderInternal] = useState<string>('openai');
    const [selectedModel, setSelectedModelInternal] = useState<string>(''); // Start empty, let fetch populate
    const [isLoadingRefinement, setIsLoadingRefinement] = useState<boolean>(false);
    const [refinedPromptResult, setRefinedPromptResult] = useState<string | null>(null);
    const [refinementError, setRefinementError] = useState<string | null>(null);
    const [isApiKeyModalOpen, setIsApiKeyModalOpenInternal] = useState<boolean>(false);
    const [apiKeyValidationStatus, setApiKeyValidationStatusInternal] = useState<ApiKeyValidationStatus>('idle');
    const [apiKeyValidationError, setApiKeyValidationErrorInternal] = useState<string | null>(null);
    const [availableModelsList, setAvailableModelsList] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
    const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
    const [variableValues, setVariableValues] = useState<{ [key: string]: string }>({});

    // --- Effects ---
    // Load saved prompt & template names on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const promptData = localStorage.getItem(SAVED_PROMPTS_KEY);
            if (promptData) { try { const p = JSON.parse(promptData); if(typeof p === 'object' && p !== null) setSavedPromptNames(Object.keys(p).sort()); } catch (e) { console.error(e); localStorage.removeItem(SAVED_PROMPTS_KEY); }}
            const templateData = localStorage.getItem(SAVED_TEMPLATES_KEY);
            if (templateData) { try { const t = JSON.parse(templateData); if(typeof t === 'object' && t !== null) setSavedTemplateNames(Object.keys(t).sort()); } catch (e) { console.error(e); localStorage.removeItem(SAVED_TEMPLATES_KEY); }}
        }
    }, []);

    // Recalculate nextId when components change
    useEffect(() => {
        const maxId = components.length > 0 ? Math.max(...components.map(c => c.id)) : -1;
        nextId.current = maxId + 1;
    }, [components]);

    // Detect variables when components change
     useEffect(() => {
        const regex = /\{\{(.*?)\}\}/g; let orderedVars: string[] = [];
        components.forEach((component) => { const content = component.content || ''; 
            if (typeof content !== 'string') 
                return; 
            let match; regex.lastIndex = 0; 
            while ((match = regex.exec(content)) !== null) 
                { const varName = match[1]?.trim(); 
                    if (varName && !orderedVars.includes(varName)) 
                        { orderedVars.push(varName); } 
                    if (match.index === regex.lastIndex) { regex.lastIndex++; } } });
        setDetectedVariables(currentDetected => JSON.stringify(currentDetected) !== JSON.stringify(orderedVars) ? orderedVars : currentDetected);
        
        setVariableValues(currentValues => { const newValues: { [key: string]: string } = {}; 
            let changed = false; 

            orderedVars.forEach(varName => { 
                newValues[varName] = currentValues[varName] || ''; 
            }); 

            if (JSON.stringify(Object.keys(newValues).sort()) !== JSON.stringify(Object.keys(currentValues).sort()) || Object.keys(newValues).some(key => newValues[key] !== currentValues[key])) 
                { changed = true; } 
            return changed ? newValues : currentValues; 
        });
    }, [components]);


    // --- Handler: Fetch Available Models ---
    const fetchAvailableModelsInternal = useCallback(async (provider: string, apiKey?: string) => {
        if (!provider) return;
        const keyToUse = refinementStrategy === 'userKey' ? (apiKey || userApiKey) : (refinementStrategy === 'managedKey' ? 'managed' : null);
        if (refinementStrategy === 'userKey' && !keyToUse) { setAvailableModelsList([]); setIsLoadingModels(false); return; }

        setIsLoadingModels(true); setAvailableModelsList([]);
        console.log(`[Models] Fetching for provider: ${provider}`);
        let modelIds: string[] = [];

        try {
            if (provider.toLowerCase() === 'openai') {
                let fetchedData: any;
                if (keyToUse === 'managed') {
                    console.warn("[Models] Managed mode: Using default OpenAI model list. Implement /api/get-models later.");
                    modelIds = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o']; // Default list for now
                } else if (keyToUse) { // Must have user key here
                    const response = await fetch('https://api.openai.com/v1/models', { method: 'GET', headers: { 'Authorization': `Bearer ${keyToUse}` } });
                    fetchedData = await response.json();
                    if (!response.ok) throw new Error(fetchedData?.error?.message || `Failed to list models: ${response.status}`);
                    modelIds = fetchedData?.data?.map((m: any) => m.id).filter((id: string) => id.includes('gpt')).sort() || []; // Simple filter
                    console.log("[Models] Fetched OpenAI models for user key:", modelIds);
                }
            } else { console.warn(`[Models] Fetching for provider '${provider}' not implemented.`); modelIds = []; }
            setAvailableModelsList(modelIds);
            // Auto-select model
            setSelectedModelInternal(currentModel => { const pref = currentModel || (provider === 'openai' ? 'gpt-3.5-turbo' : ''); return modelIds.includes(pref) ? pref : (modelIds[0] || ''); });
        } catch (error: any) { console.error(`[Models] Fetch failed:`, error); setAvailableModelsList([]); setSelectedModelInternal(''); }
        finally { setIsLoadingModels(false); }
    }, [refinementStrategy, userApiKey]); // Dependencies that determine *if* and *how* to fetch

    // --- Effect to Trigger Model Fetch ---
    useEffect(() => {
         console.log("[Effect] Checking if models need fetching...", { selectedProvider, refinementStrategy, userApiKey });
         fetchAvailableModelsInternal(selectedProvider);
    }, [selectedProvider, refinementStrategy, userApiKey, fetchAvailableModelsInternal]); // Fetch whenever these change

    // --- Calculate Generated Prompt (with variable substitution) ---
    const generatedPrompt = useMemo(() => {
        let combinedContent = components
            .map(comp => comp.content?.trim() === "" ? `**${comp.type}:**` : `**${comp.type}:**\n${comp.content}`) // Added safe navigation for content
            .join('\n\n---\n\n');
        Object.entries(variableValues).forEach(([varName, varValue]) => {
            const regex = new RegExp(`\\{\\{\\s*${varName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*\\}\\}`, 'g'); // Escape regex special chars in varName
            combinedContent = combinedContent.replace(regex, varValue || `{{${varName}}}`);
        });
        return combinedContent;
    }, [components, variableValues]);

    // --- Handlers ---
    const clearLoadSelection = useCallback(() => { 
        setSelectedPromptToLoad(''); 
        setSelectedTemplateToLoadInternal(''); // Also clear template selection
    }, []);
    const addComponent = useCallback((type: string) => { const id = nextId.current++; setComponents(p => [...p, { id, type, content: '' }]); clearLoadSelection(); }, [clearLoadSelection]);
    const handleContentSave = useCallback((id: number, content: string) => { setComponents(p => p.map(c => c.id === id ? { ...c, content } : c)); clearLoadSelection(); }, [clearLoadSelection]);
    const handleDeleteComponent = useCallback((id: number) => { if (window.confirm('Delete component?')) { setComponents(p => p.filter(c => c.id !== id)); clearLoadSelection(); }}, [clearLoadSelection]);
    const handleDragEnd = useCallback((event: DragEndEvent) => { const { active, over } = event; if (over && active.id !== over.id) { setComponents(items => { const oldIdx = items.findIndex(i => i.id === active.id); const newIdx = items.findIndex(i => i.id === over.id); return (oldIdx !== -1 && newIdx !== -1) ? arrayMove(items, oldIdx, newIdx) : items; }); clearLoadSelection(); }}, [clearLoadSelection]);
    const setPromptNameDirectly = useCallback((name: string) => { setPromptName(name); }, []);
    
    const handleSavePrompt = useCallback(() => {
        const nameToSave = promptName.trim();
        if (!nameToSave) { alert("Please enter a name for the prompt."); return; }
        
        // Use the *substituted* generatedPrompt as the content
        const substitutedPromptContent = generatedPrompt; // Get from useMemo
        console.log("[Save Prompt] Using substituted content:", substitutedPromptContent); // <-- Log content being saved

        if (!substitutedPromptContent.trim()) { alert("Cannot save an empty generated prompt."); return; }

        if (typeof window === 'undefined') return;

        let savedPrompts: SavedPrompts = {};
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) { 
            try { savedPrompts = JSON.parse(storedData); 
                if (typeof savedPrompts !== 'object' || savedPrompts === null) 
                    savedPrompts = {}; 
                } 
                catch (e) 
                { 
                    console.error("Failed to parse saved prompts:", e); 
                    savedPrompts = {}; 
                } 
            }

        const isOverwriting = !!savedPrompts[nameToSave];
        if (isOverwriting && !window.confirm(`Prompt "${nameToSave}" already exists. Overwrite it?`)) return;

        // --- Create the new entry object ---
        const newEntry: SavedPromptEntry = {
            name: nameToSave,
            // Save as a single 'Context' component (or similar)
            components: [{ id: 0, type: 'Context', content: substitutedPromptContent }],
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
            setSelectedTemplateToLoadInternal(""); // Clear template selection
        } catch (e) { console.error("Save failed", e); alert("Error saving prompt."); }
    }, [generatedPrompt, promptName, savedPromptNames, selectedProvider, selectedModel]);

    
    const handleClearCanvas = useCallback(() => { 
        const doClear = components.length > 0 || !!promptName || !!refinedPromptResult || !!refinementError|| !!variableValues || Object.keys(variableValues).length > 0;
        if (doClear && window.confirm("Clear the canvas and refinement results? Unsaved changes will be lost.")) {
            setComponents([]);
            setPromptName('');
            clearLoadSelection();
            setRefinedPromptResult(null);
            setRefinementError(null);
            setIsLoadingRefinement(false);
            setVariableValues({});
            console.log("[PromptContext] Canvas, variables, and refinement cleared.");
        } else if (!doClear) {
             console.log("[PromptContext] Canvas already clear.");
        } }, [components.length, promptName, refinedPromptResult, refinementError, variableValues, clearLoadSelection]);// Added variableValues
    
    const handleLoadPrompt = useCallback((event: ChangeEvent<HTMLSelectElement>) => { 
        const nameToLoad = event.target.value;
        // Use the direct state setter from context for prompt selection
        setSelectedPromptToLoad(nameToLoad); // Update selection state FIRST

        if (!nameToLoad) { return; } // Handle selecting placeholder

        // Confirmation should maybe just check components/name, refinement clears anyway
        const needsConfirmation = components.length > 0 || !!promptName;
        if (needsConfirmation && !window.confirm(`Loading prompt "${nameToLoad}" will replace current canvas & variables. Proceed?`)) {
            setSelectedPromptToLoad(''); // Revert selection on cancel
            return;
        }
        if (typeof window === 'undefined') return;
        const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (storedData) {
            try {
                const savedPrompts: SavedPrompts = JSON.parse(storedData);
                const entryToLoad  = savedPrompts[nameToLoad];
                // Validate the loaded entry structure (basic check)
                if (entryToLoad?.components?.length > 0 && entryToLoad.settings) { // Check loaded data
                    setComponents(entryToLoad.components); // Load the flattened component(s)
                    setPromptName(entryToLoad.name);
                    setSelectedProviderInternal(entryToLoad.settings.provider);
                    setSelectedModelInternal(entryToLoad.settings.model);
                    // Clear other state
                    setRefinedPromptResult(null); setRefinementError(null); setIsLoadingRefinement(false);
                    setVariableValues({}); // Clear variables when loading a saved prompt instance
                    setSelectedTemplateToLoadInternal(""); // Clear template selection
                    console.log(`Prompt "${nameToLoad}" loaded.`);
                 } else { console.error(`"${nameToLoad}" not found or invalid format in storage.`); alert(`Error finding or loading "${nameToLoad}".`);setSelectedPromptToLoad(''); } // Revert selection on error
            } catch (e) { console.error("Parse fail on load", e); alert("Error loading prompt.");setSelectedPromptToLoad(''); } // Revert selection on error
        } else { alert("No saved prompts found."); setSelectedPromptToLoad(''); } }, 
        [components.length, promptName, selectedPromptToLoad,]); // Added setters as indirect deps
    
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
                    setSelectedPromptToLoad(""); // Reset the prompt dropdown selection
                    alert(`Prompt "${nameToDelete}" deleted.`);
                } catch (e) { console.error("Delete failed", e); alert("Error deleting."); }
            } else { alert(`Error: "${nameToDelete}" not found.`); setSavedPromptNames(Object.keys(savedPrompts).sort()); clearLoadSelection(); } // Resync list if needed
        } }, [selectedPromptToLoad, promptName]);

    // --- Refinement Setters & Handlers ---
    const setRefinementStrategy = useCallback((strategy: RefinementStrategy) => { setRefinementStrategyInternal(strategy); setRefinedPromptResult(null); setRefinementError(null); setApiKeyValidationStatusInternal('idle'); setApiKeyValidationErrorInternal(null); }, []);
    const setUserApiKey = useCallback((apiKey: string) => { setUserApiKeyInternal(apiKey.trim()); setApiKeyValidationStatusInternal('idle'); setApiKeyValidationErrorInternal(null); }, []);
    const setSelectedProvider = useCallback((provider: string) => { setSelectedProviderInternal(provider); setApiKeyValidationStatusInternal('idle'); setApiKeyValidationErrorInternal(null); /* Fetching handled by effect */ }, []);
    const setSelectedModel = useCallback((model: string) => { setSelectedModelInternal(model); }, []);
    const setIsApiKeyModalOpen = useCallback((isOpen: boolean) => { setIsApiKeyModalOpenInternal(isOpen); if (!isOpen) { setApiKeyValidationStatusInternal('idle'); setApiKeyValidationErrorInternal(null); } }, []);
    const validateUserApiKey = useCallback(async (keyToValidate: string): Promise<boolean> => {
        const provider = selectedProvider; const key = keyToValidate.trim(); let isValid = false;
        if (!key) { setApiKeyValidationErrorInternal("API Key empty."); setApiKeyValidationStatusInternal('invalid'); return false; }
        setApiKeyValidationStatusInternal('validating'); setApiKeyValidationErrorInternal(null);
        try {
            if (provider === 'openai') {
                const response = await fetch('https://api.openai.com/v1/models', { method: 'GET', headers: { 'Authorization': `Bearer ${key}` } });
                if (response.ok) { isValid = true; } else { const eData = await response.json(); throw new Error(eData?.error?.message || `Status ${response.status}`); }
            } else { throw new Error(`Validation for ${provider} not supported.`); }
            setApiKeyValidationStatusInternal('valid'); fetchAvailableModelsInternal(provider, key); // Fetch models on success
        } catch (error: any) { setApiKeyValidationStatusInternal('invalid'); if (error.message?.includes('key') || error.message?.includes('401')) { setApiKeyValidationErrorInternal("Invalid API Key."); } else { setApiKeyValidationErrorInternal(error.message || "Validation failed."); } }
        return isValid;
     }, [selectedProvider, fetchAvailableModelsInternal]); // Added dependency

     // --- NEW: Variable Value Setter ---
    const updateVariableValue  = useCallback((variableName: string, value: string) => {
        setVariableValues(prevValues => ({ // <-- Uses the plural setter here
            ...prevValues,
            [variableName]: value,
        }));
    }, []); // No dependencies needed



    const handleRefinePrompt = useCallback(async () => { 
        console.log("[PromptContext] handleRefinePrompt CALLED!");
        if (isLoadingRefinement) { console.log("[PromptContext] Aborting refine: Already loading."); return; }
        setRefinedPromptResult(null); setRefinementError(null); setIsLoadingRefinement(true);
    
        // Use the already calculated generatedPrompt which includes substitutions
        const currentGeneratedPrompt = generatedPrompt;
        // --- *** END CHANGE *** ---
    
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
                    body: JSON.stringify({ model: selectedModel, messages: [ 
                        { role: 'system', 
                            content: `You are an expert prompt engineer assistant. Your SOLE TASK is to refine the user-provided text into a single, cohesive, and effective prompt suitable for a large language model. Combine any provided components (like Instructions, Context, Role, Examples) logically. Focus on clarity, conciseness, and structure. CRITICAL: Output ONLY the refined prompt text itself. Do NOT execute the prompt, do NOT provide explanations, do NOT add introductory or concluding remarks, do NOT add markdown formatting. ONLY output the refined prompt.` }, 
                            { role: 'user', content: currentGeneratedPrompt 

                            } 
                        ], temperature: 0.5, max_tokens: 1000, }),
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
        } }, [ generatedPrompt, isLoadingRefinement, refinementStrategy, userApiKey, selectedProvider, selectedModel, setRefinedPromptResult, setRefinementError, setIsLoadingRefinement ]);

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

        console.log("[PromptContext] Refined prompt loaded to canvas."); }, [refinedPromptResult, promptName, clearLoadSelection]); // Corrected dependencies

    // --- Template Handlers ---
    const handleSaveAsTemplate = useCallback((templateName: string): boolean => {
        const nameToSave = templateName.trim();
        if (!nameToSave) { alert("Please provide a name for the template."); return false; }
        if (components.length === 0) { alert("Cannot save an empty canvas as a template."); return false; }
        if (typeof window === 'undefined') return false;

        let savedTemplates: SavedTemplates = {};
        const storedData = localStorage.getItem(SAVED_TEMPLATES_KEY);
        if (storedData) { try { savedTemplates = JSON.parse(storedData); if (typeof savedTemplates !== 'object' || savedTemplates === null) savedTemplates = {}; } catch (e) { savedTemplates = {}; } }

        const isOverwriting = !!savedTemplates[nameToSave];
        if (isOverwriting && !window.confirm(`A template named "${nameToSave}" already exists. Overwrite it?`)) {
            return false; // User cancelled overwrite
        }

        // Create the new template entry
        const newTemplateEntry: SavedTemplateEntry = {
            name: nameToSave,
            // IMPORTANT: Save a DEEP COPY of components, maybe without IDs or reset later
            // For simplicity now, save with current IDs, but reset on load
            components: JSON.parse(JSON.stringify(components)), // Simple deep copy
            savedAt: new Date().toISOString(),
            // Optionally add default settings here if desired
            // settings: { provider: selectedProvider, model: selectedModel }
        };

        savedTemplates[nameToSave] = newTemplateEntry;

        try {
            localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(savedTemplates));
            alert(`Template "${nameToSave}" saved!`);
            if (!savedTemplateNames.includes(nameToSave)) {
                setSavedTemplateNames(prevNames => [...prevNames, nameToSave].sort());
            }
            // --- NEW: Select the saved template ---
            setSelectedTemplateToLoadInternal(nameToSave);
            setSelectedPromptToLoad(''); // Clear other selection
            return true; // Indicate success
        } catch (e) { console.error("Save template failed", e); alert("Error saving template."); return false; } 
    }, [components, savedTemplateNames]);


    const handleLoadTemplate = useCallback((templateName: string) => { 
        if (!templateName) return; // No template selected
        if (typeof window === 'undefined') return;

        const needsConfirmation = components.length > 0 || !!promptName || !!refinedPromptResult || !!refinementError;
        if (needsConfirmation && !window.confirm(`Loading template "${templateName}" will replace the current canvas content and clear results/name. Proceed?`)) {
            return; // User cancelled
        }

        const storedData = localStorage.getItem(SAVED_TEMPLATES_KEY);
        if (storedData) {
            try {
                const savedTemplates: SavedTemplates = JSON.parse(storedData);
                const templateToLoad = savedTemplates[templateName];

                if (templateToLoad?.components) {
                    // --- Assign NEW Unique IDs ---
                    let currentMaxId = -1; // Start fresh for ID calculation
                    const newComponents = templateToLoad.components.map((comp, index) => {
                        const newId = index; // Simple 0-based index for new IDs
                        currentMaxId = newId; // Keep track of the max ID used
                        return { ...comp, id: newId }; // Create new object with new ID
                    });
                    nextId.current = currentMaxId + 1; // Set the next ID counter
                    // --- End ID Assignment ---

                    setComponents(newComponents); // Load components with new IDs
                    // Clear prompt name and other potentially irrelevant state
                    setPromptName(''); // Clear specific prompt instance name
                    clearLoadSelection(); // Clear saved prompt selection
                    setSelectedTemplateToLoadInternal(templateName); // SET template selection
                    setRefinedPromptResult(null); setRefinementError(null); setIsLoadingRefinement(false);
                    setVariableValues({}); // Clear variables 
                    console.log(`Template "${templateName}" loaded.`);
                    alert(`Template "${templateName}" loaded.`); // User feedback
                } else {
                     console.error(`Template "${templateName}" not found or invalid format.`);
                     alert(`Error finding or loading template "${templateName}".`);
                }
            } catch (e) { console.error("Parse fail on load template", e); alert("Error loading template."); }
        } else { alert("No saved templates found."); } }, 
        [components.length, promptName, refinedPromptResult, refinementError, clearLoadSelection, setVariableValues]); // Added setVariableValues

    const handleDeleteTemplate = useCallback((templateName: string) => { 
         if (!templateName) { alert("Please select a template to delete."); return; }
         if (window.confirm(`Permanently delete the template "${templateName}"?`)) {
             if (typeof window === 'undefined') return;
             let savedTemplates: SavedTemplates = {};
             const storedData = localStorage.getItem(SAVED_TEMPLATES_KEY);
             if (storedData) { try { savedTemplates = JSON.parse(storedData); if (typeof savedTemplates !== 'object' || savedTemplates === null) savedTemplates = {}; } catch (e) { savedTemplates = {}; } }

             if (savedTemplates[templateName]) {
                 delete savedTemplates[templateName];
                 try {
                     localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(savedTemplates));
                     setSavedTemplateNames(prevNames => prevNames.filter(name => name !== templateName));
                     setSelectedTemplateToLoadInternal(""); // Clear template selection
                     alert(`Template "${templateName}" deleted.`);
                 } catch (e) { console.error("Delete template failed", e); alert("Error deleting template."); }
             } else { alert(`Error: Template "${templateName}" not found.`); setSavedTemplateNames(Object.keys(savedTemplates).sort()); } // Resync list
         } }, []);

    // --- NEW: Template Dropdown Setter ---
    const setSelectedTemplateToLoad = useCallback((templateName: string) => {
        setSelectedTemplateToLoadInternal(templateName);
        // Optional: Clear prompt selection when template selection changes?
        // if (templateName) setSelectedPromptToLoad('');
    }, []);

    // --- Value Provided by Context ---
    const value: PromptContextType = {
        // Core
        components, promptName, generatedPrompt,
        // Save/Load Prompts
        savedPromptNames, selectedPromptToLoad,
        // Save/Load Templates
        savedTemplateNames,
        // Refinement
        refinementStrategy, userApiKey, selectedProvider, selectedModel, isLoadingRefinement,
        refinedPromptResult, refinementError,
        // Modal
        isApiKeyModalOpen,
        // Validation
        apiKeyValidationStatus, apiKeyValidationError,
        // Models
        availableModelsList, isLoadingModels,
        // Variables
        detectedVariables, variableValues,
        selectedTemplateToLoad,
        // Core Handlers
        setSelectedTemplateToLoad, addComponent, handleContentSave, handleDeleteComponent, handleDragEnd, setPromptNameDirectly,
        // Save/Load Prompt Handlers
        handleSavePrompt, handleClearCanvas, handleLoadPrompt, handleDeleteSavedPrompt,
        // Save/Load Template Handlers
        handleSaveAsTemplate, handleLoadTemplate, handleDeleteTemplate,
        // Refinement Handlers/Setters
        setRefinementStrategy, setUserApiKey, setSelectedProvider, setSelectedModel, handleRefinePrompt,
        // Modal Setter
        setIsApiKeyModalOpen,
        // Validation Handler
        validateUserApiKey,
        // Variable Setter
        updateVariableValue,
        // Load Refined Handler
        loadRefinedPromptToCanvas,
    };

    return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
}