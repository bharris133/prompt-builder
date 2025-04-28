// src/app/context/PromptContext.tsx // COMPLETE FILE REPLACEMENT - FINAL (Hopefully!)

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
  const fetchAvailableModelsInternal = useCallback(
    async (provider: string, apiKey?: string) => {
      if (!provider) return;
      const keyToUse =
        refinementStrategy === 'userKey'
          ? apiKey || (provider === 'openai' ? userApiKey : userAnthropicApiKey)
          : refinementStrategy === 'managedKey'
            ? 'managed'
            : null;
      if (refinementStrategy === 'userKey' && !keyToUse) {
        setAvailableModelsList([]);
        setIsLoadingModels(false);
        setSelectedModelInternal('');
        return;
      }
      setIsLoadingModels(true);
      setAvailableModelsList([]);
      let modelIds: string[] = [];
      try {
        const lowerProvider = provider.toLowerCase();
        if (lowerProvider === 'openai') {
          if (keyToUse === 'managed') {
            modelIds = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'];
          } else if (keyToUse) {
            const response = await fetch('https://api.openai.com/v1/models', {
              method: 'GET',
              headers: { Authorization: `Bearer ${keyToUse}` },
            });
            const fetchedData = await response.json();
            if (!response.ok)
              throw new Error(
                fetchedData?.error?.message || `Status ${response.status}`
              );
            modelIds =
              fetchedData?.data
                ?.map((m: any) => m.id)
                .filter(
                  (id: string) =>
                    id.includes('gpt') &&
                    !id.includes('vision') &&
                    !id.includes('embed') &&
                    !id.includes('instruct') &&
                    !id.includes('0314') &&
                    !id.includes('0613')
                )
                .sort() || [];
          }
        } else if (lowerProvider === 'anthropic') {
          if (keyToUse === 'managed') {
            modelIds = [
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307',
            ];
          } else if (keyToUse) {
            console.warn(
              '[Models] User key Anthropic dynamic fetch not implemented. Using defaults.'
            );
            modelIds = [
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307',
            ];
          }
        } else {
          modelIds = [];
        }
        setAvailableModelsList(modelIds);
        setSelectedModelInternal((currentModel) => {
          const defaultModel =
            lowerProvider === 'openai'
              ? 'gpt-4o'
              : lowerProvider === 'anthropic'
                ? 'claude-3-sonnet-20240229'
                : '';
          return modelIds.includes(currentModel)
            ? currentModel
            : modelIds.includes(defaultModel)
              ? defaultModel
              : modelIds[0] || '';
        });
      } catch (error: any) {
        console.error(`Fetch models failed:`, error);
        setAvailableModelsList([]);
        setSelectedModelInternal('');
      } finally {
        setIsLoadingModels(false);
      }
    },
    [refinementStrategy, userApiKey, userAnthropicApiKey]
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
        !nameToSave
          ? 'Prompt Name is required to save.'
          : 'Cannot save an empty generated prompt.'
      );
      return;
    }
    if (typeof window === 'undefined') return;
    let savedPrompts: SavedPrompts = {};
    const storedData = localStorage.getItem(SAVED_PROMPTS_KEY);
    if (storedData) {
      try {
        savedPrompts = JSON.parse(storedData);
        if (typeof savedPrompts !== 'object' || savedPrompts === null)
          savedPrompts = {};
      } catch (e) {
        console.error('Failed parsing saved prompts:', e);
        savedPrompts = {};
      }
    }
    const isOverwriting = !!savedPrompts[nameToSave];
    if (
      isOverwriting &&
      !window.confirm(`Prompt "${nameToSave}" already exists. Overwrite it?`)
    )
      return;
    const newEntry: SavedPromptEntry = {
      name: nameToSave,
      components: [{ id: 0, type: 'Context', content: generatedPrompt }],
      settings: { provider: selectedProvider, model: selectedModel },
      savedAt: new Date().toISOString(),
    };
    savedPrompts[nameToSave] = newEntry;
    try {
      localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
      alert(`Prompt "${nameToSave}" saved successfully!`);
      if (!savedPromptNames.includes(nameToSave)) {
        setSavedPromptNames((p) => [...p, nameToSave].sort());
      }
      setSelectedPromptToLoadInternal(nameToSave);
      setSelectedTemplateToLoadInternal('');
    } catch (e) {
      console.error('Save prompt failed:', e);
      alert('Error saving prompt.');
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
    if (
      doClear &&
      window.confirm(
        'Clear the canvas, variables, and results? Unsaved changes will be lost.'
      )
    ) {
      setComponents([]);
      setPromptName('');
      clearLoadSelection();
      setRefinedPromptResult(null);
      setRefinementError(null);
      setIsLoadingRefinement(false);
      setVariableValues({});
      console.log('Canvas cleared.');
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
      if (
        needsConf &&
        !window.confirm(
          `Loading prompt "${nameToLoad}" will replace current canvas & variables. Proceed?`
        )
      ) {
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
            console.log(`Prompt "${nameToLoad}" loaded.`);
          } else {
            throw new Error('Invalid format');
          }
        } catch (e) {
          console.error('Failed loading prompt:', e);
          alert(`Error loading "${nameToLoad}".`);
          setSelectedPromptToLoadInternal('');
        }
      } else {
        alert('No saved prompts found.');
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
    if (window.confirm(`Permanently delete saved prompt "${nameToDelete}"?`)) {
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
          console.error('Delete prompt failed:', e);
          alert('Error deleting prompt.');
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
        alert('Please provide a name for the template.');
        return false;
      }
      if (components.length === 0) {
        alert('Cannot save an empty canvas as a template.');
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
        !window.confirm(
          `Template "${nameToSave}" already exists. Overwrite it?`
        )
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
        console.error('Save template failed:', e);
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
      if (
        needsConf &&
        !window.confirm(
          `Loading template "${templateName}" will replace current canvas, variables, and results. Proceed?`
        )
      )
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
            throw new Error('Invalid template format');
          }
        } catch (e) {
          console.error('Failed loading template:', e);
          alert(`Error loading template "${templateName}".`);
        }
      } else {
        alert('No saved templates found.');
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
    if (window.confirm(`Permanently delete template "${templateName}"?`)) {
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
          console.error('Delete template failed:', e);
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
      setAvailableModelsList([]);
      setSelectedModelInternal('');
    }
  }, []); // Clear both keys when switching to managed
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
    setApiKeyValidationErrorInternal(null); /* Effect handles fetch */
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
  const validateUserApiKey = useCallback(
    async (keyToValidate: string): Promise<boolean> => {
      const provider = selectedProvider;
      const key = keyToValidate.trim();
      let isValid = false;
      if (!key) {
        setApiKeyValidationErrorInternal('API Key empty.');
        setApiKeyValidationStatusInternal('invalid');
        setAvailableModelsList([]);
        setSelectedModelInternal('');
        return false;
      }
      setApiKeyValidationStatusInternal('validating');
      setApiKeyValidationErrorInternal(null);
      try {
        if (provider === 'openai') {
          const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${key}` },
          });
          if (response.ok) {
            isValid = true;
          } else {
            const eData = await response.json();
            throw new Error(
              eData?.error?.message || `Status ${response.status}`
            );
          }
        } else if (provider === 'anthropic') {
          if (key.startsWith('sk-ant-') && key.length > 15) {
            isValid = true;
          } else {
            throw new Error('Invalid Anthropic Key format.');
          }
        } else {
          throw new Error(`Validation for ${provider} not supported.`);
        }
        setApiKeyValidationStatusInternal('valid');
        fetchAvailableModelsInternal(provider, key);
      } catch (error: any) {
        setApiKeyValidationStatusInternal('invalid');
        setAvailableModelsList([]);
        setSelectedModelInternal('');
        if (
          error.message?.includes('key') ||
          error.message?.includes('401') ||
          error.message?.includes('format')
        ) {
          setApiKeyValidationErrorInternal(error.message);
        } else {
          setApiKeyValidationErrorInternal(
            error.message || 'Validation failed.'
          );
        }
        isValid = false;
      }
      return isValid;
    },
    [selectedProvider, fetchAvailableModelsInternal]
  );

  const handleRefinePrompt = useCallback(async () => {
    console.log('[PromptContext] handleRefinePrompt CALLED!');
    if (isLoadingRefinement) return;
    setRefinedPromptResult(null);
    setRefinementError(null);
    setIsLoadingRefinement(true);
    const currentGeneratedPrompt = generatedPrompt;
    if (!currentGeneratedPrompt.trim()) {
      setRefinementError('Cannot refine empty prompt.');
      setIsLoadingRefinement(false);
      return;
    }
    try {
      let responseData: any;
      let refinedText: string | null = null;
      if (refinementStrategy === 'userKey') {
        const key =
          selectedProvider === 'openai'
            ? userApiKey
            : selectedProvider === 'anthropic'
              ? userAnthropicApiKey
              : null;
        if (!key) {
          throw new Error(
            `API Key for ${selectedProvider.toUpperCase()} required.`
          );
        }
        if (!selectedModel) {
          throw new Error(
            `Select model for ${selectedProvider.toUpperCase()}.`
          );
        }
        console.log(
          `[PromptContext] Calling proxy /api/refine-user for ${selectedProvider} (${selectedModel})`
        );
        const response = await fetch('/api/refine-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentGeneratedPrompt,
            provider: selectedProvider,
            model: selectedModel,
            apiKey: key,
          }),
        });
        responseData = await response.json();
        if (!response.ok) {
          throw new Error(
            responseData.error || `Proxy failed: ${response.status}`
          );
        }
        refinedText = responseData?.refinedPrompt?.trim();
      } else {
        /* managedKey */ if (!selectedModel) {
          throw new Error(
            `Select model for ${selectedProvider.toUpperCase()}.`
          );
        }
        console.log(
          `[PromptContext] Calling managed /api/refine for ${selectedProvider} (${selectedModel})`
        );
        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentGeneratedPrompt,
            provider: selectedProvider,
            model: selectedModel,
          }),
        });
        responseData = await response.json();
        if (!response.ok) {
          throw new Error(
            responseData.error || `Managed request failed: ${response.status}`
          );
        }
        refinedText = responseData?.refinedPrompt?.trim();
      }
      if (!refinedText) {
        throw new Error('No refined content received.');
      }
      setRefinedPromptResult(refinedText);
      console.log('Refinement successful.');
    } catch (error: any) {
      console.error('Refinement failed:', error);
      setRefinementError(error.message || 'Unknown refinement error.');
    } finally {
      setIsLoadingRefinement(false);
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
  }, [refinedPromptResult, promptName, clearLoadSelection, setVariableValues]); // Added setVariableValues

  const updateVariableValue = useCallback(
    (variableName: string, value: string) => {
      setVariableValues((prev) => ({ ...prev, [variableName]: value }));
    },
    []
  );
  const setSelectedTemplateToLoad = useCallback((templateName: string) => {
    setSelectedTemplateToLoadInternal(templateName);
  }, []);

  // --- Value Provided by Context (Ensure ALL props from interface are here) ---
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
  };

  return (
    <PromptContext.Provider value={value}>{children}</PromptContext.Provider>
  );
}
