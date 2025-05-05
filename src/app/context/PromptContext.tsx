// src/app/context/PromptContext.tsx // COMPLETE FILE REPLACEMENT - FINAL V3 - VERIFIED NO PLACEHOLDERS

'use client';

import React, {
  createContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  ChangeEvent,
  useMemo,
} from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { type QualificationResult } from '../api/qualify-prompt/route'; // Use 'type' import if possible

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
export type ApiKeyValidationStatus =
  | 'idle'
  | 'validating'
  | 'valid'
  | 'invalid';

// --- Context Type Definition ---
interface PromptContextType {
  components: PromptComponentData[];
  promptName: string;
  generatedPrompt: string;
  savedPromptNames: string[];
  selectedPromptToLoad: string;
  savedTemplateNames: string[];
  selectedTemplateToLoad: string;
  refinementStrategy: RefinementStrategy;
  userApiKey: string;
  userAnthropicApiKey: string;
  selectedProvider: string;
  selectedModel: string;
  isLoadingRefinement: boolean;
  refinedPromptResult: string | null;
  refinementError: string | null;
  isApiKeyModalOpen: boolean;
  apiKeyValidationStatus: ApiKeyValidationStatus;
  apiKeyValidationError: string | null;
  availableModelsList: string[];
  isLoadingModels: boolean;
  detectedVariables: string[];
  variableValues: { [key: string]: string };
  isSidebarOpen: boolean;
  addComponent: (type: string) => void;
  handleContentSave: (id: number, newContent: string) => void;
  handleDeleteComponent: (id: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  setPromptNameDirectly: (name: string) => void;
  handleSavePrompt: () => void;
  handleClearCanvas: () => void;
  handleLoadPrompt: (event: ChangeEvent<HTMLSelectElement>) => void;
  handleDeleteSavedPrompt: () => void;
  handleSaveAsTemplate: (templateName: string) => boolean;
  handleLoadTemplate: (templateName: string) => void;
  handleDeleteTemplate: (templateName: string) => void;
  setRefinementStrategy: (strategy: RefinementStrategy) => void;
  setUserApiKey: (apiKey: string) => void;
  setUserAnthropicApiKey: (apiKey: string) => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  handleRefinePrompt: () => Promise<void>;
  setIsApiKeyModalOpen: (isOpen: boolean) => void;
  validateUserApiKey: (keyToValidate: string) => Promise<boolean>;
  updateVariableValue: (variableName: string, value: string) => void;
  loadRefinedPromptToCanvas: () => void;
  setSelectedTemplateToLoad: (templateName: string) => void;
  toggleSidebar: () => void;
}

export const PromptContext = createContext<PromptContextType | null>(null);
const SAVED_PROMPTS_KEY = 'promptBuilderSavedPrompts';
const SAVED_TEMPLATES_KEY = 'promptBuilderTemplates';

interface PromptProviderProps {
  children: ReactNode;
}

export function PromptProvider({ children }: PromptProviderProps) {
  // --- State ---
  const [components, setComponents] = useState<PromptComponentData[]>([]);
  const [promptName, setPromptName] = useState<string>('');
  const nextId = useRef<number>(0);
  const [savedPromptNames, setSavedPromptNames] = useState<string[]>([]);
  const [selectedPromptToLoad, setSelectedPromptToLoadInternal] =
    useState<string>('');
  const [savedTemplateNames, setSavedTemplateNames] = useState<string[]>([]);
  const [selectedTemplateToLoad, setSelectedTemplateToLoadInternal] =
    useState<string>('');
  const [refinementStrategy, setRefinementStrategyInternal] =
    useState<RefinementStrategy>('userKey');
  const [userApiKey, setUserApiKeyInternal] = useState<string>(''); // OpenAI Key state
  const [userAnthropicApiKey, setUserAnthropicApiKeyInternal] =
    useState<string>(''); // Anthropic Key state
  const [selectedProvider, setSelectedProviderInternal] =
    useState<string>('openai');
  const [selectedModel, setSelectedModelInternal] = useState<string>('');
  const [isLoadingRefinement, setIsLoadingRefinement] =
    useState<boolean>(false);
  const [refinedPromptResult, setRefinedPromptResult] = useState<string | null>(
    null
  );
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpenInternal] =
    useState<boolean>(false);
  const [apiKeyValidationStatus, setApiKeyValidationStatusInternal] =
    useState<ApiKeyValidationStatus>('idle');
  const [apiKeyValidationError, setApiKeyValidationErrorInternal] = useState<
    string | null
  >(null);
  const [availableModelsList, setAvailableModelsList] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<{
    [key: string]: string;
  }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar state

  // --- Effects ---
  useEffect(() => {
    // Load names
    if (typeof window !== 'undefined') {
      const promptData = localStorage.getItem(SAVED_PROMPTS_KEY);
      if (promptData) {
        try {
          const p = JSON.parse(promptData);
          if (typeof p === 'object' && p !== null)
            setSavedPromptNames(Object.keys(p).sort());
        } catch (e) {
          console.error('Failed parsing prompts', e);
          localStorage.removeItem(SAVED_PROMPTS_KEY);
        }
      }
      const templateData = localStorage.getItem(SAVED_TEMPLATES_KEY);
      if (templateData) {
        try {
          const t = JSON.parse(templateData);
          if (typeof t === 'object' && t !== null)
            setSavedTemplateNames(Object.keys(t).sort());
        } catch (e) {
          console.error('Failed parsing templates', e);
          localStorage.removeItem(SAVED_TEMPLATES_KEY);
        }
      }
    }
  }, []);
  useEffect(() => {
    const maxId =
      components.length > 0 ? Math.max(...components.map((c) => c.id)) : -1;
    nextId.current = maxId + 1;
  }, [components]); // Recalc nextId
  useEffect(() => {
    // Detect variables
    const regex = /\{\{(.*?)\}\}/g;
    let orderedVars: string[] = [];
    components.forEach((component) => {
      const content = component.content || '';
      if (typeof content !== 'string') return;
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1]?.trim();
        if (varName && !orderedVars.includes(varName)) {
          orderedVars.push(varName);
        }
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    });
    setDetectedVariables((currentDetected) =>
      JSON.stringify(currentDetected) !== JSON.stringify(orderedVars)
        ? orderedVars
        : currentDetected
    );
    setVariableValues((currentValues) => {
      const newValues: { [key: string]: string } = {};
      let changed = false;
      orderedVars.forEach((varName) => {
        newValues[varName] = currentValues[varName] || '';
      });
      if (
        JSON.stringify(Object.keys(newValues).sort()) !==
          JSON.stringify(Object.keys(currentValues).sort()) ||
        Object.keys(newValues).some(
          (key) => newValues[key] !== currentValues[key]
        )
      ) {
        changed = true;
      }
      return changed ? newValues : currentValues;
    });
  }, [components]);

  // --- Fetch Models Logic ---
  // --- Handler: Fetch Available Models (Internal - Now Primarily for Managed Key Strategy) ---
  const fetchAvailableModelsInternal = useCallback(
    async (provider: string) => {
      // This function is now mainly for the managedKey strategy triggered by useEffect,
      // or as a fallback check when switching to userKey without a key.
      console.log(
        `[fetchAvailableModelsInternal] Called for provider: ${provider}, strategy: ${refinementStrategy}`
      );

      if (!provider) return;

      // Handle clearing list if switching to userKey without a corresponding key
      if (refinementStrategy === 'userKey') {
        const keyExists =
          (provider === 'openai' && userApiKey) ||
          (provider === 'anthropic' && userAnthropicApiKey);
        if (!keyExists) {
          console.log(
            '[Models] Clearing models list: userKey mode, no key for provider.'
          );
          setAvailableModelsList([]);
          setSelectedModelInternal('');
          setIsLoadingModels(false); // Ensure loading is off
        }
        // Don't proceed further for userKey here, validation handles the fetch
        return;
      }

      // Proceed only for managedKey
      if (refinementStrategy === 'managedKey') {
        setIsLoadingModels(true);
        setAvailableModelsList([]); // Clear previous list
        console.log(
          `[Models] Fetching MANAGED models for provider: ${provider}`
        );
        let modelIds: string[] = [];

        try {
          const lowerProvider = provider.toLowerCase();
          // Call backend route for managed keys
          const response = await fetch(
            `/api/get-models?provider=${lowerProvider}`
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(
              data.error || `Failed to fetch managed models: ${response.status}`
            );
          }
          modelIds = data.models || [];
          console.log(
            `[Models] Received managed models for ${lowerProvider}: ${modelIds.length} models`
          );

          setAvailableModelsList(modelIds);
          // Auto-select model logic
          setSelectedModelInternal((currentModel) => {
            const defaultModel =
              lowerProvider === 'openai'
                ? 'gpt-4o'
                : lowerProvider === 'anthropic'
                  ? 'claude-3-sonnet-20240229'
                  : '';
            if (currentModel && modelIds.includes(currentModel))
              return currentModel;
            if (defaultModel && modelIds.includes(defaultModel))
              return defaultModel;
            if (modelIds.length > 0) return modelIds[0];
            return '';
          });
        } catch (error: any) {
          console.error(
            `[Models] Fetch managed models failed for ${provider}:`,
            error
          );
          setAvailableModelsList([]); // Clear list on error
          setSelectedModelInternal(''); // Clear selection on error
        } finally {
          setIsLoadingModels(false);
        }
      } else {
        // Fallback case - shouldn't normally be reached
        setIsLoadingModels(false);
      }
      // Dependencies: include keys here so effect re-runs if key is added/removed for userKey check
    },
    [refinementStrategy, selectedProvider, userApiKey, userAnthropicApiKey]
  );

  // --- Effect to Trigger Model Fetch ---
  useEffect(() => {
    fetchAvailableModelsInternal(selectedProvider);
  }, [
    selectedProvider,
    refinementStrategy,
    userApiKey,
    userAnthropicApiKey,
    fetchAvailableModelsInternal,
  ]);

  // --- Calculate Generated Prompt ---
  const generatedPrompt = useMemo(() => {
    let combinedContent = components
      .map((comp) =>
        comp.content?.trim() === ''
          ? `**${comp.type}:**`
          : `**${comp.type}:**\n${comp.content}`
      )
      .join('\n\n---\n\n');
    Object.entries(variableValues).forEach(([varName, varValue]) => {
      const regex = new RegExp(
        `\\{\\{\\s*${varName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*\\}\\}`,
        'g'
      );
      combinedContent = combinedContent.replace(
        regex,
        varValue || `{{${varName}}}`
      );
    });
    return combinedContent;
  }, [components, variableValues]);

  // --- Handlers ---
  const clearLoadSelection = useCallback(() => {
    setSelectedPromptToLoadInternal('');
    setSelectedTemplateToLoadInternal('');
  }, []);
  const addComponent = useCallback(
    (type: string) => {
      const id = nextId.current++;
      setComponents((p) => [...p, { id, type, content: '' }]);
      clearLoadSelection();
    },
    [clearLoadSelection]
  );
  const handleContentSave = useCallback(
    (id: number, content: string) => {
      setComponents((p) => p.map((c) => (c.id === id ? { ...c, content } : c)));
      clearLoadSelection();
    },
    [clearLoadSelection]
  );
  const handleDeleteComponent = useCallback(
    (id: number) => {
      if (window.confirm('Delete component from canvas?')) {
        setComponents((p) => p.filter((c) => c.id !== id));
        clearLoadSelection();
      }
    },
    [clearLoadSelection]
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setComponents((items) => {
          const oldIdx = items.findIndex((i) => i.id === active.id);
          const newIdx = items.findIndex((i) => i.id === over.id);
          return oldIdx !== -1 && newIdx !== -1
            ? arrayMove(items, oldIdx, newIdx)
            : items;
        });
        clearLoadSelection();
      }
    },
    [clearLoadSelection]
  );
  const setPromptNameDirectly = useCallback((name: string) => {
    setPromptName(name);
  }, []);

  const handleSavePrompt = useCallback(() => {
    const nameToSave = promptName.trim();
    if (!nameToSave || !generatedPrompt.trim()) {
      alert(
        !nameToSave ? 'Prompt Name required.' : 'Cannot save empty prompt.'
      );
      return;
    }
    if (typeof window === 'undefined') return;
    let savedPrompts: SavedPrompts = {};
    const data = localStorage.getItem(SAVED_PROMPTS_KEY);
    if (data) {
      try {
        savedPrompts = JSON.parse(data);
        if (typeof savedPrompts !== 'object' || savedPrompts === null)
          savedPrompts = {};
      } catch (e) {
        savedPrompts = {};
      }
    }
    const isOverwriting = !!savedPrompts[nameToSave];
    if (isOverwriting && !window.confirm(`Overwrite "${nameToSave}"?`)) return;
    const newEntry: SavedPromptEntry = {
      name: nameToSave,
      components: [{ id: 0, type: 'Context', content: generatedPrompt }],
      settings: { provider: selectedProvider, model: selectedModel },
      savedAt: new Date().toISOString(),
    };
    savedPrompts[nameToSave] = newEntry;
    try {
      localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
      alert(`Prompt "${nameToSave}" saved!`);
      if (!savedPromptNames.includes(nameToSave)) {
        setSavedPromptNames((p) => [...p, nameToSave].sort());
      }
      setSelectedPromptToLoadInternal(nameToSave);
      setSelectedTemplateToLoadInternal('');
    } catch (e) {
      console.error(e);
      alert('Error saving.');
    }
  }, [
    promptName,
    generatedPrompt,
    selectedProvider,
    selectedModel,
    savedPromptNames,
  ]);

  const handleClearCanvas = useCallback(() => {
    const doClear =
      components.length > 0 ||
      !!promptName ||
      !!refinedPromptResult ||
      !!refinementError ||
      Object.keys(variableValues).length > 0;
    if (doClear && window.confirm('Clear canvas, variables, and results?')) {
      setComponents([]);
      setPromptName('');
      clearLoadSelection();
      setRefinedPromptResult(null);
      setRefinementError(null);
      setIsLoadingRefinement(false);
      setVariableValues({});
    } else if (!doClear) {
      console.log('Canvas already clear.');
    }
  }, [
    components.length,
    promptName,
    refinedPromptResult,
    refinementError,
    variableValues,
    clearLoadSelection,
  ]);

  const handleLoadPrompt = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nameToLoad = event.target.value;
      setSelectedPromptToLoadInternal(nameToLoad);
      if (!nameToLoad) return;
      const needsConf = components.length > 0 || !!promptName;
      if (needsConf && !window.confirm(`Load prompt "${nameToLoad}"?`)) {
        setSelectedPromptToLoadInternal('');
        return;
      }
      if (typeof window === 'undefined') return;
      const data = localStorage.getItem(SAVED_PROMPTS_KEY);
      if (data) {
        try {
          const prompts: SavedPrompts = JSON.parse(data);
          const entry = prompts[nameToLoad];
          if (entry?.components?.length > 0 && entry.settings) {
            setComponents(entry.components);
            setPromptName(entry.name);
            setSelectedProviderInternal(entry.settings.provider);
            setSelectedModelInternal(entry.settings.model);
            setRefinedPromptResult(null);
            setRefinementError(null);
            setIsLoadingRefinement(false);
            setVariableValues({});
            setSelectedTemplateToLoadInternal('');
          } else {
            throw new Error('Invalid format');
          }
        } catch (e) {
          console.error(e);
          alert(`Error loading "${nameToLoad}".`);
          setSelectedPromptToLoadInternal('');
        }
      } else {
        alert('No prompts found.');
        setSelectedPromptToLoadInternal('');
      }
    },
    [components.length, promptName]
  );

  const handleDeleteSavedPrompt = useCallback(() => {
    const nameToDelete = selectedPromptToLoad;
    if (!nameToDelete) {
      alert('Select prompt to delete.');
      return;
    }
    if (window.confirm(`Delete prompt "${nameToDelete}"?`)) {
      if (typeof window === 'undefined') return;
      let prompts: SavedPrompts = {};
      const data = localStorage.getItem(SAVED_PROMPTS_KEY);
      if (data) {
        try {
          prompts = JSON.parse(data);
          if (typeof prompts !== 'object' || prompts === null) prompts = {};
        } catch (e) {
          prompts = {};
        }
      }
      if (prompts[nameToDelete]) {
        delete prompts[nameToDelete];
        try {
          localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(prompts));
          setSavedPromptNames((p) => p.filter((n) => n !== nameToDelete));
          if (promptName === nameToDelete) {
            setComponents([]);
            setPromptName('');
            setRefinedPromptResult(null);
            setRefinementError(null);
            setIsLoadingRefinement(false);
            setVariableValues({});
          }
          setSelectedPromptToLoadInternal('');
          alert(`Prompt "${nameToDelete}" deleted.`);
        } catch (e) {
          console.error(e);
          alert('Error deleting.');
        }
      } else {
        alert(`Error: Prompt "${nameToDelete}" not found.`);
        setSavedPromptNames(Object.keys(prompts).sort());
        setSelectedPromptToLoadInternal('');
      }
    }
  }, [selectedPromptToLoad, promptName]);

  const handleSaveAsTemplate = useCallback(
    (templateName: string): boolean => {
      const nameToSave = templateName.trim();
      if (!nameToSave) {
        alert('Name required.');
        return false;
      }
      if (components.length === 0) {
        alert('Canvas empty.');
        return false;
      }
      if (typeof window === 'undefined') return false;
      let savedTemplates: SavedTemplates = {};
      const data = localStorage.getItem(SAVED_TEMPLATES_KEY);
      if (data) {
        try {
          savedTemplates = JSON.parse(data);
          if (typeof savedTemplates !== 'object' || savedTemplates === null)
            savedTemplates = {};
        } catch (e) {
          savedTemplates = {};
        }
      }
      const isOverwriting = !!savedTemplates[nameToSave];
      if (
        isOverwriting &&
        !window.confirm(`Overwrite template "${nameToSave}"?`)
      )
        return false;
      const newEntry: SavedTemplateEntry = {
        name: nameToSave,
        components: JSON.parse(JSON.stringify(components)),
        savedAt: new Date().toISOString(),
      };
      savedTemplates[nameToSave] = newEntry;
      try {
        localStorage.setItem(
          SAVED_TEMPLATES_KEY,
          JSON.stringify(savedTemplates)
        );
        alert(`Template "${nameToSave}" saved!`);
        if (!savedTemplateNames.includes(nameToSave)) {
          setSavedTemplateNames((p) => [...p, nameToSave].sort());
        }
        setSelectedTemplateToLoadInternal(nameToSave);
        setSelectedPromptToLoadInternal('');
        return true;
      } catch (e) {
        console.error(e);
        alert('Error saving template.');
        return false;
      }
    },
    [components, savedTemplateNames]
  );

  const handleLoadTemplate = useCallback(
    (templateName: string) => {
      if (!templateName) return;
      if (typeof window === 'undefined') return;
      const needsConf =
        components.length > 0 ||
        !!promptName ||
        !!refinedPromptResult ||
        !!refinementError;
      if (needsConf && !window.confirm(`Load template "${templateName}"?`))
        return;
      const data = localStorage.getItem(SAVED_TEMPLATES_KEY);
      if (data) {
        try {
          const templates: SavedTemplates = JSON.parse(data);
          const entry = templates[templateName];
          if (entry?.components) {
            let maxId = -1;
            const newComps = entry.components.map((c, i) => {
              maxId = i;
              return { ...c, id: i };
            });
            nextId.current = maxId + 1;
            setComponents(newComps);
            setPromptName('');
            clearLoadSelection();
            setSelectedTemplateToLoadInternal(templateName);
            setRefinedPromptResult(null);
            setRefinementError(null);
            setIsLoadingRefinement(false);
            setVariableValues({});
            console.log(`Template "${templateName}" loaded.`);
            alert(`Template "${templateName}" loaded.`);
          } else {
            throw new Error('Invalid format');
          }
        } catch (e) {
          console.error(e);
          alert(`Error loading template "${templateName}".`);
        }
      } else {
        alert('No templates found.');
      }
    },
    [
      components.length,
      promptName,
      refinedPromptResult,
      refinementError,
      clearLoadSelection,
      setVariableValues,
    ]
  );

  const handleDeleteTemplate = useCallback((templateName: string) => {
    if (!templateName) {
      alert('Select template to delete.');
      return;
    }
    if (window.confirm(`Delete template "${templateName}"?`)) {
      if (typeof window === 'undefined') return;
      let templates: SavedTemplates = {};
      const data = localStorage.getItem(SAVED_TEMPLATES_KEY);
      if (data) {
        try {
          templates = JSON.parse(data);
          if (typeof templates !== 'object' || templates === null)
            templates = {};
        } catch (e) {
          templates = {};
        }
      }
      if (templates[templateName]) {
        delete templates[templateName];
        try {
          localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(templates));
          setSavedTemplateNames((p) => p.filter((n) => n !== templateName));
          setSelectedTemplateToLoadInternal('');
          alert(`Template "${templateName}" deleted.`);
        } catch (e) {
          console.error(e);
          alert('Error deleting template.');
        }
      } else {
        alert(`Error: Template "${templateName}" not found.`);
        setSavedTemplateNames(Object.keys(templates).sort());
        setSelectedTemplateToLoadInternal('');
      }
    }
  }, []);

  const setRefinementStrategy = useCallback((strategy: RefinementStrategy) => {
    setRefinementStrategyInternal(strategy);
    setRefinedPromptResult(null);
    setRefinementError(null);
    setApiKeyValidationStatusInternal('idle');
    setApiKeyValidationErrorInternal(null);
    if (strategy === 'managedKey') {
      setUserApiKeyInternal('');
      setUserAnthropicApiKeyInternal('');
    }
  }, []);
  const setUserApiKey = useCallback(
    (apiKey: string) => {
      const key = apiKey.trim();
      setUserApiKeyInternal(key);
      setApiKeyValidationStatusInternal('idle');
      setApiKeyValidationErrorInternal(null);
      if (!key && selectedProvider === 'openai') {
        setAvailableModelsList([]);
        setSelectedModelInternal('');
      }
    },
    [selectedProvider]
  );
  const setUserAnthropicApiKey = useCallback(
    (apiKey: string) => {
      const key = apiKey.trim();
      setUserAnthropicApiKeyInternal(key);
      setApiKeyValidationStatusInternal('idle');
      setApiKeyValidationErrorInternal(null);
      if (!key && selectedProvider === 'anthropic') {
        setAvailableModelsList([]);
        setSelectedModelInternal('');
      }
    },
    [selectedProvider]
  );
  const setSelectedProvider = useCallback((provider: string) => {
    setSelectedProviderInternal(provider);
    setApiKeyValidationStatusInternal('idle');
    setApiKeyValidationErrorInternal(null);
  }, []);
  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelInternal(model);
  }, []);
  const setIsApiKeyModalOpen = useCallback((isOpen: boolean) => {
    setIsApiKeyModalOpenInternal(isOpen);
    if (!isOpen) {
      setApiKeyValidationStatusInternal('idle');
      setApiKeyValidationErrorInternal(null);
    }
  }, []);

  // src/app/context/PromptContext.tsx // MODIFY THIS FUNCTION

  // --- Validation Handler (Calls Proxy, Fetches Models on Success) ---
  const validateUserApiKey = useCallback(
    async (keyToValidate: string): Promise<boolean> => {
      const provider = selectedProvider; // Use state for current provider
      const key = keyToValidate.trim();
      let isValid = false;

      if (!key) {
        setApiKeyValidationErrorInternal('API Key cannot be empty.');
        setApiKeyValidationStatusInternal('invalid');
        setAvailableModelsList([]); // Clear models
        setSelectedModelInternal('');
        return false;
      }

      setApiKeyValidationStatusInternal('validating');
      setApiKeyValidationErrorInternal(null);
      setIsLoadingModels(true); // Indicate loading models during validation process
      setAvailableModelsList([]); // Clear previous models
      setSelectedModelInternal(''); // Clear previous selection

      console.log(
        `[Validation] Calling backend proxy /api/validate-key for ${provider}...`
      );

      try {
        // Call the backend proxy route
        const response = await fetch('/api/validate-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey: key }),
        });

        const data = await response.json(); // Expects { isValid: boolean, models?: string[], error?: string }

        if (!response.ok) {
          // Handle potential server errors from the proxy route itself (5xx)
          throw new Error(
            data.error || `Validation proxy failed: ${response.status}`
          );
        }

        // Check the 'isValid' flag from the backend response
        if (data.isValid) {
          console.log(
            `[Validation] Backend reported key VALID for ${provider}. Models received:`,
            data.models
          );
          isValid = true;
          setApiKeyValidationStatusInternal('valid');
          setApiKeyValidationErrorInternal(null);

          // Use models list returned from backend proxy
          const modelIds = Array.isArray(data.models) ? data.models : [];
          setAvailableModelsList(modelIds);

          // Auto-select model logic
          setSelectedModelInternal((currentModel) => {
            // Using currentModel as placeholder, not needed here
            const defaultModel =
              provider === 'openai'
                ? 'gpt-4o'
                : provider === 'anthropic'
                  ? 'claude-3-sonnet-20240229'
                  : '';
            // Use default if available in list, else first, else empty
            if (defaultModel && modelIds.includes(defaultModel))
              return defaultModel;
            if (modelIds.length > 0) return modelIds[0];
            return '';
          });
        } else {
          // Backend reported validation failed
          console.warn(
            `[Validation] Backend reported key INVALID for ${provider}. Error: ${data.error}`
          );
          isValid = false;
          setApiKeyValidationStatusInternal('invalid');
          setApiKeyValidationErrorInternal(data.error || 'Invalid API Key.');
          // Ensure lists are cleared (already done at start of function)
          // setAvailableModelsList([]);
          // setSelectedModelInternal('');
        }
      } catch (error: any) {
        // Catch network errors calling the proxy etc.
        console.error('[Validation] Error calling validation proxy:', error);
        setApiKeyValidationStatusInternal('invalid');
        setAvailableModelsList([]);
        setSelectedModelInternal('');
        setApiKeyValidationErrorInternal(
          error.message?.includes('fetch')
            ? 'Network Error: Cannot reach validation service.'
            : error.message || 'Validation check failed.'
        );
        isValid = false;
      } finally {
        setIsLoadingModels(false); // Stop loading models indicator
      }
      return isValid;
      // Dependency is only selectedProvider, as fetchAvailableModelsInternal is stable
      // and the key comes directly from the argument
    },
    [selectedProvider]
  );

  // ... Ensure fetchAvailableModelsInternal, useEffect trigger, and rest of context are correct ...

  const handleRefinePrompt = useCallback(async () => {
    console.log('[PromptContext] handleRefinePrompt CALLED!');
    if (isLoadingRefinement) {
      console.log('Aborting: Loading');
      return;
    }

    // Reset previous results FIRST
    setRefinedPromptResult(null);
    setRefinementError(null);
    setIsLoadingRefinement(true); // Set loading for the entire process (qualify + refine)

    // 1. Get current generated prompt (with substitutions)
    const currentGeneratedPrompt = generatedPrompt;
    if (!currentGeneratedPrompt.trim()) {
      setRefinementError('Cannot refine empty prompt.');
      setIsLoadingRefinement(false);
      return;
    }

    let promptToSendForRefinement = currentGeneratedPrompt; // Default to original (substituted)
    let refinementStatusMessage = ''; // For UI feedback

    try {
      // --- 2. Qualification Step ---
      console.log('[PromptContext] Calling /api/qualify-prompt...');
      const qualifyResponse = await fetch('/api/qualify-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: currentGeneratedPrompt }),
      });

      const qualificationResult: QualificationResult =
        await qualifyResponse.json();

      if (!qualifyResponse.ok) {
        throw new Error(
          qualificationResult.detail || 'Qualification request failed.'
        );
      }

      console.log('[PromptContext] Qualification result:', qualificationResult);

      // --- 3. Handle Qualification Result ---
      switch (qualificationResult.type) {
        case 'valid_prompt':
          console.log(
            '[PromptContext] Prompt is valid. Proceeding to refinement.'
          );
          refinementStatusMessage = 'Refining prompt...'; // Standard message
          // promptToSendForRefinement remains currentGeneratedPrompt
          break; // Proceed to refinement logic below

        case 'meta_question':
          console.log(
            '[PromptContext] Detected meta question. Rephrasing for refinement.'
          );
          // Option 1: Show message and stop (simpler)
          // setRefinementError("Input seems like a question about prompts. Please provide the prompt content itself or use a template.");
          // setIsLoadingRefinement(false);
          // return;

          // Option 2: Attempt to rephrase and proceed (more complex, might not always work well)
          promptToSendForRefinement = `Refine the following user request into a well-structured prompt: "${currentGeneratedPrompt}"`;
          refinementStatusMessage =
            'Detected meta-question, attempting to generate prompt...';
          break; // Proceed to refinement logic below with the rephrased input

        case 'gibberish':
        case 'too_short':
          console.log(
            `[PromptContext] Qualification failed: ${qualificationResult.type}`
          );
          setRefinementError(
            `Input seems like ${qualificationResult.type}. Please provide a more complete prompt or request.`
          );
          setIsLoadingRefinement(false);
          return; // Stop processing

        case 'error': // Error from the qualification API route itself
          throw new Error(
            qualificationResult.detail || 'Qualification service error.'
          );

        default:
          console.warn(
            '[PromptContext] Unknown qualification type:',
            qualificationResult.type
          );
          // Proceed with original prompt as a fallback? Or error out? Let's proceed cautiously.
          refinementStatusMessage =
            'Refining prompt (qualification uncertain)...';
          break;
      }

      // --- 4. Refinement Step (Only if qualification didn't stop) ---
      console.log('[PromptContext] Proceeding to refinement call...');
      // Update UI potentially? (e.g., show refinementStatusMessage) - maybe later
      // The refinement call uses promptToSendForRefinement

      let responseData: any;
      let refinedText: string | null = null;
      if (refinementStrategy === 'userKey') {
        const key =
          selectedProvider === 'openai'
            ? userApiKey
            : selectedProvider === 'anthropic'
              ? userAnthropicApiKey
              : null;
        if (!key)
          throw new Error(
            `API Key for ${selectedProvider.toUpperCase()} required.`
          );
        if (!selectedModel)
          throw new Error(
            `Select model for ${selectedProvider.toUpperCase()}.`
          );

        console.log(
          `[PromptContext] Calling proxy /api/refine-user for ${selectedProvider} (${selectedModel})`
        );
        const response = await fetch('/api/refine-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptToSendForRefinement,
            provider: selectedProvider,
            model: selectedModel,
            apiKey: key,
          }),
        });
        responseData = await response.json();
        if (!response.ok)
          throw new Error(
            responseData.error || `Proxy failed: ${response.status}`
          );
        refinedText = responseData?.refinedPrompt?.trim();
      } else {
        // managedKey
        if (!selectedModel)
          throw new Error(
            `Select model for ${selectedProvider.toUpperCase()}.`
          );
        console.log(
          `[PromptContext] Calling managed /api/refine for ${selectedProvider} (${selectedModel})`
        );
        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptToSendForRefinement,
            provider: selectedProvider,
            model: selectedModel,
          }),
        });
        responseData = await response.json();
        if (!response.ok)
          throw new Error(
            responseData.error || `Managed request failed: ${response.status}`
          );
        refinedText = responseData?.refinedPrompt?.trim();
      }

      if (!refinedText) {
        throw new Error('No refined content received.');
      }
      setRefinedPromptResult(refinedText);
      console.log('[PromptContext] Refinement successful.');
      setRefinementError(null); // Clear any previous error on success
    } catch (error: any) {
      console.error(
        '[PromptContext] Refinement/Qualification process failed:',
        error
      );
      setRefinementError(error.message || 'An unknown error occurred.'); // Set the final error
      setRefinedPromptResult(null); // Clear any potential partial result
    } finally {
      setIsLoadingRefinement(false); // Turn off loading indicator
      console.log('[PromptContext] Refinement/Qualification finished.');
    }
  }, [
    generatedPrompt,
    isLoadingRefinement,
    refinementStrategy,
    userApiKey,
    userAnthropicApiKey,
    selectedProvider,
    selectedModel,
  ]);
  const loadRefinedPromptToCanvas = useCallback(() => {
    if (!refinedPromptResult) return;
    if (!window.confirm('Replace canvas with refined prompt?')) return;
    const newComponent: PromptComponentData = {
      id: 0,
      type: 'Context',
      content: refinedPromptResult,
    };
    setComponents([newComponent]);
    const originalName = promptName.trim();
    setPromptName(
      originalName ? `${originalName} - Refined` : 'Refined Prompt 1'
    );
    setRefinedPromptResult(null);
    setRefinementError(null);
    setIsLoadingRefinement(false);
    clearLoadSelection();
    setVariableValues({});
    console.log('Refined prompt loaded.');
  }, [refinedPromptResult, promptName, clearLoadSelection, setVariableValues]);
  const updateVariableValue = useCallback(
    (variableName: string, value: string) => {
      setVariableValues((prev) => ({ ...prev, [variableName]: value }));
    },
    []
  );
  const setSelectedTemplateToLoad = useCallback((templateName: string) => {
    setSelectedTemplateToLoadInternal(templateName);
  }, []);
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // --- Value Provided by Context ---
  const value: PromptContextType = {
    components,
    promptName,
    generatedPrompt,
    savedPromptNames,
    selectedPromptToLoad,
    savedTemplateNames,
    selectedTemplateToLoad,
    refinementStrategy,
    userApiKey,
    userAnthropicApiKey,
    selectedProvider,
    selectedModel,
    isLoadingRefinement,
    refinedPromptResult,
    refinementError,
    isApiKeyModalOpen,
    apiKeyValidationStatus,
    apiKeyValidationError,
    availableModelsList,
    isLoadingModels,
    detectedVariables,
    variableValues,
    isSidebarOpen,
    addComponent,
    handleContentSave,
    handleDeleteComponent,
    handleDragEnd,
    setPromptNameDirectly,
    handleSavePrompt,
    handleClearCanvas,
    handleLoadPrompt,
    handleDeleteSavedPrompt,
    handleSaveAsTemplate,
    handleLoadTemplate,
    handleDeleteTemplate,
    setRefinementStrategy,
    setUserApiKey,
    setUserAnthropicApiKey,
    setSelectedProvider,
    setSelectedModel,
    handleRefinePrompt,
    setIsApiKeyModalOpen,
    validateUserApiKey,
    updateVariableValue,
    loadRefinedPromptToCanvas,
    setSelectedTemplateToLoad,
    toggleSidebar,
  };

  return (
    <PromptContext.Provider value={value}>{children}</PromptContext.Provider>
  );
}
