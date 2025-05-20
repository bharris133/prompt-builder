// src/app/context/PromptContext.tsx // COMPLETE FILE REPLACEMENT - ABSOLUTELY FINAL ATTEMPT

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
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { type QualificationResult } from '../api/qualify-prompt/route';

// --- Type Definitions ---
export interface PromptComponentData {
  id: number;
  type: string;
  content: string;
}
export interface PromptSettings {
  last_selected_provider: string; // Changed from 'provider'
  last_selected_model: string; // Changed from 'model'

  // Add the flags that the API route returns
  has_openai_key_saved?: boolean; // Optional because they might not exist initially
  has_anthropic_key_saved?: boolean; // Optional
}
export interface SavedPromptEntry {
  id?: string;
  user_id?: string;
  name: string;
  components: PromptComponentData[];
  settings: PromptSettings; // Will now use the new settings structure
  created_at?: string;
  updated_at?: string;
}
export interface ListedPrompt {
  id: string;
  name: string;
  updatedAt?: string;
  settings?: PromptSettings;
}
// --- UPDATED Template Types for DB interaction ---
export interface ListedTemplate {
  // For dropdown
  id: string; // Template UUID from DB
  name: string;
  updatedAt?: string;
}
export interface SavedTemplateEntry {
  // For loading/saving full template
  id?: string; // Optional for insert, present for select/update
  user_id?: string; // Added by backend
  name: string;
  components: PromptComponentData[];
  created_at?: string;
  updated_at?: string;
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
  savedPromptList: ListedPrompt[];
  isLoadingSavedPrompts: boolean;
  selectedPromptToLoad: string;
  // --- UPDATED Template State/Handlers ---
  savedTemplateList: ListedTemplate[]; // NEW: Replaces savedTemplateNames
  isLoadingSavedTemplates: boolean; // NEW: Loading state for templates
  selectedTemplateToLoad: string;
  isLoadingUserSettings: boolean; // <<< NEW STATE
  session: Session | null;
  user: User | null;
  authLoading: boolean;
  refinementStrategy: RefinementStrategy;
  userApiKey: string;
  userAnthropicApiKey: string;
  // --- NEW: Google Key State ---
  userGoogleApiKey: string;
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
  // --- NEW: Auth Modal State & Setter ---
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'signIn' | 'signUp') => void; // Can specify mode
  closeAuthModal: () => void;
  // --- NEW: Prompt Management Modal State & Rename Handler ---
  isPromptManagementModalOpen: boolean;
  openPromptManagementModal: () => void;
  closePromptManagementModal: () => void;
  handleRenamePrompt: (promptId: string, newName: string) => Promise<boolean>; // For renaming
  // --- NEW: Template Management Modal State & Rename Handler ---
  isTemplateManagementModalOpen: boolean;
  openTemplateManagementModal: () => void;
  closeTemplateManagementModal: () => void;
  handleRenameTemplate: (
    templateId: string,
    newName: string
  ) => Promise<boolean>;
  // --- NEW: Shared Library Modal State & Setters ---
  isSharedLibraryModalOpen: boolean;
  consentToSaveApiKey: boolean;
  setConsentToSaveApiKey: (consent: boolean) => void;
  isOpenAiKeyLoadedFromDb: boolean;
  isAnthropicKeyLoadedFromDb: boolean;
  openSharedLibraryModal: () => void;
  closeSharedLibraryModal: () => void;
  handleClearCanvas: () => void;
  addComponent: (type: string) => void;
  handleContentSave: (id: number, newContent: string) => void;
  handleDeleteComponent: (id: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  setPromptNameDirectly: (name: string) => void;
  fetchUserPrompts: () => Promise<void>;
  fetchUserTemplates: () => Promise<void>;
  handleSavePrompt: () => Promise<void>;
  handleLoadPrompt: (promptId: string) => Promise<void>; // Changed from event
  handleDeleteSavedPrompt: (promptId: string) => Promise<void>;
  setSelectedPromptToLoad: (promptId: string) => void;
  handleSaveAsTemplate: (templateName: string) => Promise<boolean>; // Now async
  handleLoadTemplate: (templateId: string) => Promise<void>; // Now takes ID, async
  handleDeleteTemplate: (templateId: string) => Promise<void>; // Now takes ID, async
  setSelectedTemplateToLoad: (templateName: string) => void;
  signUpUser: (credentials: any) => Promise<any>;
  signInUser: (credentials: any) => Promise<any>;
  signOutUser: () => Promise<void>;
  setRefinementStrategy: (strategy: RefinementStrategy) => void;
  setUserApiKey: (apiKey: string) => void;
  setUserAnthropicApiKey: (apiKey: string) => void;
  // --- NEW: Google Key Setter ---
  setUserGoogleApiKey: (apiKey: string) => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  handleRefinePrompt: () => Promise<void>;
  setIsApiKeyModalOpen: (isOpen: boolean) => void;
  validateUserApiKey: (keyToValidate: string) => Promise<boolean>;
  updateVariableValue: (variableName: string, value: string) => void;
  loadRefinedPromptToCanvas: () => void;
  toggleSidebar: () => void;
  // --- NEW: Handler for loading library item ---
  loadLibraryItemToCanvas: (item: {
    name: string;
    components: PromptComponentData[];
    suggested_provider?: string;
    suggested_model?: string;
  }) => void;
}

export const PromptContext = createContext<PromptContextType | null>(null);

interface PromptProviderProps {
  children: ReactNode;
}

export function PromptProvider({ children }: PromptProviderProps) {
  const [components, setComponents] = useState<PromptComponentData[]>([]);
  const [promptName, setPromptName] = useState<string>('');
  const nextId = useRef<number>(0);
  const [savedPromptList, setSavedPromptList] = useState<ListedPrompt[]>([]);
  const [isLoadingSavedPrompts, setIsLoadingSavedPrompts] =
    useState<boolean>(false);
  const [selectedPromptToLoad, setSelectedPromptToLoadInternal] =
    useState<string>('');
  // --- UPDATED Template State ---
  const [savedTemplateList, setSavedTemplateList] = useState<ListedTemplate[]>(
    []
  );
  const [isLoadingSavedTemplates, setIsLoadingSavedTemplates] =
    useState<boolean>(false);
  const [selectedTemplateToLoad, setSelectedTemplateToLoadInternal] =
    useState<string>(''); // Stores Template ID
  useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [refinementStrategy, setRefinementStrategyInternal] =
    useState<RefinementStrategy>('userKey');
  const [userApiKey, setUserApiKeyInternal] = useState<string>('');
  const [userAnthropicApiKey, setUserAnthropicApiKeyInternal] =
    useState<string>('');
  const [userGoogleApiKey, setUserGoogleApiKeyInternal] = useState<string>(''); // Google Key state
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // --- NEW: Auth Modal State ---
  const [isAuthModalOpen, setIsAuthModalOpenInternal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signIn' | 'signUp'>(
    'signIn'
  );
  // --- NEW: Prompt/Template Management Modal State ---
  const [isPromptManagementModalOpen, setIsPromptManagementModalOpen] =
    useState(false);
  const [isTemplateManagementModalOpen, setIsTemplateManagementModalOpen] =
    useState(false);
  // --- NEW: Shared Library Modal State ---
  const [isSharedLibraryModalOpen, setIsSharedLibraryModalOpen] =
    useState(false);

  // --- Add these with your other useState hooks ---
  const [isLoadingUserSettings, setIsLoadingUserSettings] =
    useState<boolean>(false);
  const [consentToSaveApiKey, setConsentToSaveApiKey] =
    useState<boolean>(false);
  const [isOpenAiKeyLoadedFromDb, setIsOpenAiKeyLoadedFromDb] =
    useState<boolean>(false);
  const [isAnthropicKeyLoadedFromDb, setIsAnthropicKeyLoadedFromDb] =
    useState<boolean>(false);
  // --- End New State ---

  // --- Calculate Generated Prompt (with variable substitution) ---
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

  // --- Fetch User Prompts from DB ---
  // --- Fetch User Prompts from DB (Stabilized Dependencies) ---
  const fetchUserPrompts = useCallback(async () => {
    const currentUserId = user?.id; // Get ID for dependency array stability
    if (!currentUserId) {
      console.log('[DB Prompts] No user ID, clearing prompt list.');
      // Only update if the list actually needs clearing to prevent loops
      setSavedPromptList((currentList) => {
        if (currentList.length > 0) return [];
        return currentList;
      });
      return;
    }

    setIsLoadingSavedPrompts(true);
    console.log('[DB Prompts] Fetching prompts for user:', currentUserId);
    try {
      const response = await fetch('/api/prompts'); // GET request
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch prompts from server'
        );
      }
      const data = await response.json();
      const newList = data.prompts || [];

      setSavedPromptList((currentList) => {
        if (JSON.stringify(currentList) !== JSON.stringify(newList)) {
          console.log('[DB Prompts] Fetched prompts:', newList);
          return newList;
        }
        return currentList;
      });
    } catch (error: any) {
      console.error('[DB Prompts] Error fetching prompts:', error);
      setSavedPromptList([]);
    } finally {
      setIsLoadingSavedPrompts(false);
    }
  }, [user?.id]); // <<< DEPEND ONLY ON user.id (or user object if truly stable)

  // --- NEW: Handler to Fetch User Templates from DB ---
  const fetchUserTemplates = useCallback(async () => {
    if (!user) {
      setSavedTemplateList([]);
      return;
    }
    setIsLoadingSavedTemplates(true);
    console.log('[DB Templates] Fetching templates for user:', user.id);
    try {
      const response = await fetch('/api/templates'); // GET request
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch templates from server'
        );
      }
      const data = await response.json();
      setSavedTemplateList(data.templates || []); // Expect { templates: ListedTemplate[] }
      console.log('[DB Templates] Fetched templates:', data.templates);
    } catch (error: any) {
      console.error('[DB Templates] Error fetching templates:', error);
      setSavedTemplateList([]);
    } finally {
      setIsLoadingSavedTemplates(false);
    }
  }, [user]);

  // --- Helper: Function to Persist User Settings ---
  // --- Add these new useCallback functions ---
  const saveUserSettings = useCallback(
    async (
      payload:
        | Partial<PromptSettings>
        | {
            provider_to_save: string;
            plaintext_api_key: string;
            consent_given: boolean;
          }
    ) => {
      if (!user) return;
      console.log('[User Settings] Attempting to save to DB:', payload);
      try {
        const response = await fetch('/api/user-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save settings.');
        }
        console.log('[User Settings] Saved successfully to DB:', data.settings);
        if ('provider_to_save' in payload && data.settings) {
          if (payload.provider_to_save === 'openai')
            setIsOpenAiKeyLoadedFromDb(!!data.settings.has_openai_key_saved);
          if (payload.provider_to_save === 'anthropic')
            setIsAnthropicKeyLoadedFromDb(
              !!data.settings.has_anthropic_key_saved
            );
        }
      } catch (e: any) {
        console.error('Error saving settings:', e);
        alert(`Error saving settings: ${e.message}`);
      }
    },
    [user]
  );

  const fetchUserSettings = useCallback(async () => {
    if (!user) {
      setSelectedProviderInternal('openai');
      setSelectedModelInternal('');
      setIsOpenAiKeyLoadedFromDb(false);
      setIsAnthropicKeyLoadedFromDb(false);
      setUserApiKeyInternal('');
      setUserAnthropicApiKeyInternal('');
      return;
    }
    setIsLoadingUserSettings(true);
    try {
      const response = await fetch('/api/user-settings');
      if (!response.ok) {
        const e = await response.json();
        throw new Error(e.error || 'Failed to fetch settings.');
      }
      const data = await response.json();
      const settings: PromptSettings = data.settings || {};
      setSelectedProviderInternal(settings.last_selected_provider || 'openai');
      setSelectedModelInternal(settings.last_selected_model || '');
      setIsOpenAiKeyLoadedFromDb(!!settings.has_openai_key_saved);
      setIsAnthropicKeyLoadedFromDb(!!settings.has_anthropic_key_saved);
    } catch (e: any) {
      console.error('Error fetching settings:', e);
      setSelectedProviderInternal('openai');
      setSelectedModelInternal('');
      setIsOpenAiKeyLoadedFromDb(false);
      setIsAnthropicKeyLoadedFromDb(false);
    } finally {
      setIsLoadingUserSettings(false);
    }
  }, [user]);
  // --- End New Functions ---

  // --- Effects ---
  useEffect(() => {
    // Load initial data (prompts & templates if user exists)
    // Remove localStorage loading for templates
    if (user && !authLoading) {
      // Ensure auth state is settled
      console.log(
        '[Initial Load Effect] User/Auth loaded, fetching initial data.'
      );
      fetchUserPrompts();
      fetchUserTemplates(); // Fetch templates too
      fetchUserSettings(); // Fetch settings
    } else if (!user && !authLoading) {
      console.log('[Initial Load Effect] No user/Auth loaded, clearing lists.');
      setSavedPromptList([]);
      setSavedTemplateList([]);
    }
  }, [
    user,
    authLoading,
    fetchUserPrompts,
    fetchUserTemplates,
    fetchUserSettings,
  ]); // Add fetchUserTemplates to deps

  useEffect(() => {
    const maxId =
      components.length > 0 ? Math.max(...components.map((c) => c.id)) : -1;
    nextId.current = maxId + 1;
  }, [components]);

  useEffect(() => {
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

  // Auth Listener Effect
  useEffect(() => {
    setAuthLoading(true);
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        const initialUser = initialSession?.user ?? null;
        setUser((currentUser) =>
          currentUser?.id !== initialUser?.id ? initialUser : currentUser
        );
        setAuthLoading(false);
        // Data fetching is now handled by the next effect based on user/authLoading state
      })
      .catch((e) => {
        console.error('Session error', e);
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, sessionState: Session | null) => {
        setSession(sessionState);
        const newUser = sessionState?.user ?? null;
        setUser((currentUser) =>
          currentUser?.id !== newUser?.id ? newUser : currentUser
        );
        setAuthLoading(false); // This will trigger the data fetch effect if user changed

        if (_event === 'SIGNED_OUT') {
          setComponents([]);
          setPromptName('');
          setVariableValues({});
          setRefinedPromptResult(null);
          setRefinementError(null);
          clearLoadSelection(); // Ensure dropdowns reset
          // --- ADD THESE LINES TO CLEAR API KEY STATES ---
          setUserApiKeyInternal('');
          setUserAnthropicApiKeyInternal('');
          setIsOpenAiKeyLoadedFromDb(false); // Also reset DB saved flags
          setIsAnthropicKeyLoadedFromDb(false);
          setConsentToSaveApiKey(false); // Reset consent
          // --- END ADDITION ---
        }
      }
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, [clearLoadSelection]);

  const fetchAvailableModelsInternal = useCallback(
    async (provider: string, apiKey?: string) => {
      if (!provider) return;
      const currentProviderUserKey =
        provider.toLowerCase() === 'openai'
          ? apiKey || userApiKey
          : provider.toLowerCase() === 'anthropic'
            ? apiKey || userAnthropicApiKey
            : provider.toLowerCase() === 'google'
              ? apiKey || userGoogleApiKey // <-- Add Google
              : null;
      const keyToUse =
        refinementStrategy === 'userKey'
          ? currentProviderUserKey
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
        if (keyToUse === 'managed') {
          const response = await fetch(
            `/api/get-models?provider=${lowerProvider}`
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed fetch models');
          }
          modelIds = data.models || [];
        } else if (keyToUse && refinementStrategy === 'userKey') {
          if (lowerProvider === 'openai') {
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
                    !id.includes('embed')
                )
                .sort() || [];
          } else if (lowerProvider === 'anthropic') {
            modelIds = [
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307',
            ].sort();
          }
          // --- NEW: Google User Key Model List (Using Defaults after validation) ---
          else if (lowerProvider === 'google') {
            console.warn(
              '[Models] User key Google Gemini: Using curated list after key validation.'
            );
            modelIds = [
              'gemini-pro',
              'gemini-1.0-pro',
              'gemini-1.5-pro-latest',
              'gemini-1.5-flash-latest',
            ].sort();
          }
          // --- END Google User Key ---
          else {
            modelIds = [];
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
                : lowerProvider === 'google'
                  ? 'gemini-1.5-pro-latest' // <-- Add Google Default
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
    [
      refinementStrategy,
      userApiKey,
      userAnthropicApiKey,
      userGoogleApiKey,
      selectedProvider,
    ]
  );
  useEffect(() => {
    fetchAvailableModelsInternal(selectedProvider);
  }, [
    selectedProvider,
    refinementStrategy,
    userApiKey,
    userAnthropicApiKey,
    fetchAvailableModelsInternal,
  ]);

  // --- Handlers ---

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

  const handleSavePrompt = useCallback(async () => {
    if (!user) {
      alert('Please sign in to save prompts.');
      return;
    }
    const nameToSave = promptName.trim();
    const substitutedPromptContent = generatedPrompt;
    if (!nameToSave || !substitutedPromptContent.trim()) {
      alert(
        nameToSave
          ? 'Cannot save an empty generated prompt.'
          : 'Prompt Name is required.'
      );
      return;
    }
    setIsLoadingSavedPrompts(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameToSave,
          components: [
            { id: 0, type: 'Context', content: substitutedPromptContent },
          ],
          settings: { provider: selectedProvider, model: selectedModel },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save prompt to server');
      }
      alert(`Prompt "${nameToSave}" saved successfully!`);
      fetchUserPrompts();
      setSelectedPromptToLoadInternal(data.prompt?.id || '');
      setSelectedTemplateToLoadInternal('');
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      alert(`Error saving prompt: ${error.message}`);
    } finally {
      setIsLoadingSavedPrompts(false);
    }
  }, [
    user,
    promptName,
    generatedPrompt,
    selectedProvider,
    selectedModel,
    fetchUserPrompts,
  ]);

  const handleLoadPrompt = useCallback(
    async (promptId: string) => {
      // This function is now called by setSelectedPromptToLoad after the dropdown state is visually set.
      // promptId is guaranteed to be truthy here if called by that setter.

      if (!user) {
        // Should not happen if UI prevents selection when logged out, but good check.
        alert('Please sign in to load prompts.');
        setSelectedPromptToLoadInternal(''); // Reset selection if somehow reached here
        return;
      }

      if (!promptId) {
        // Should not happen if called correctly by setSelectedPromptToLoad
        console.warn('[Load Prompt] Called without a promptId.');
        setSelectedPromptToLoadInternal(''); // Reset selection
        return;
      }

      // Always confirm before proceeding with the actual load operation
      if (
        !window.confirm(
          `Load selected prompt? Current canvas content and variables will be replaced.`
        )
      ) {
        console.log(
          '[Load Prompt] User cancelled load for prompt ID:',
          promptId
        );
        // The selectedPromptToLoadInternal state is already set to promptId by the setter.
        // If we want the dropdown to visually revert, we need to know the *previous* value.
        // For now, we'll accept that the dropdown shows the clicked item, but no load happens.
        // To truly revert, setSelectedPromptToLoad would need to be more complex.
        return; // User cancelled the load
      }

      console.log('[DB Prompts] Loading full prompt for ID:', promptId);
      setIsLoadingSavedPrompts(true);
      setRefinedPromptResult(null); // Clear refinement before loading
      setRefinementError(null);
      setIsLoadingRefinement(false);
      setVariableValues({}); // Clear current variable values

      try {
        const response = await fetch(`/api/prompts?id=${promptId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to load prompt from server'
          );
        }
        const data = await response.json();
        const entryToLoad = data.prompt; // Expects { prompt: SavedPromptEntry }

        if (
          entryToLoad &&
          entryToLoad.components &&
          Array.isArray(entryToLoad.components) &&
          entryToLoad.settings
        ) {
          setComponents(entryToLoad.components);
          setPromptName(entryToLoad.name);
          setSelectedProviderInternal(entryToLoad.settings.provider);
          setSelectedModelInternal(entryToLoad.settings.model);
          // selectedPromptToLoadInternal is already correctly set by the calling setter.

          setSelectedTemplateToLoadInternal(''); // Clear template selection
          console.log(
            `[DB Prompts] Prompt "${entryToLoad.name}" (ID: ${promptId}) loaded successfully.`
          );
          alert(`Prompt "${entryToLoad.name}" loaded.`); // User feedback
        } else {
          console.error(
            '[DB Prompts] Loaded data invalid format or missing parts:',
            entryToLoad
          );
          throw new Error('Prompt data from server was incomplete or invalid.');
        }
      } catch (error: any) {
        console.error('[DB Prompts] Error loading prompt:', error);
        alert(`Error loading prompt: ${error.message}`);
        setSelectedPromptToLoadInternal(''); // Clear selection on error to reset dropdown
        setComponents([]); // Clear canvas on load error
        setPromptName('');
      } finally {
        setIsLoadingSavedPrompts(false);
      }
      // Dependencies: user. selectedProvider/Model setters are stable.
      // The primary trigger is the promptId via setSelectedPromptToLoad.
      // If we need to revert dropdown on cancel, selectedPromptToLoad state would be a dep.
    },
    [user]
  ); // Keep dependencies minimal for the core load logic.

  const handleDeleteSavedPrompt = useCallback(
    async (promptId: string) => {
      if (!user || !promptId) return;
      if (window.confirm(`Permanently delete this saved prompt?`)) {
        setIsLoadingSavedPrompts(true);
        try {
          const response = await fetch(`/api/prompts?id=${promptId}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete prompt on server');
          }
          alert(`Prompt deleted successfully.`);
          fetchUserPrompts();
          if (selectedPromptToLoad === promptId)
            setSelectedPromptToLoadInternal('');
          const loadedPrompt = savedPromptList.find((p) => p.id === promptId);
          if (loadedPrompt && promptName === loadedPrompt.name) {
            setPromptName('');
            setComponents([]);
            setVariableValues({});
            setRefinedPromptResult(null);
            setRefinementError(null);
          }
        } catch (error: any) {
          console.error('Error deleting prompt:', error);
          alert(`Error deleting prompt: ${error.message}`);
        } finally {
          setIsLoadingSavedPrompts(false);
        }
      }
    },
    [user, selectedPromptToLoad, promptName, fetchUserPrompts, savedPromptList]
  );

  // *** Ensure handleClearCanvas is defined HERE, before the 'value' object ***
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
        'Clear canvas, variables, and results? Unsaved changes will be lost.'
      )
    ) {
      setComponents([]);
      setPromptName('');
      clearLoadSelection(); // This now calls setSelectedPromptToLoadInternal and setSelectedTemplateToLoadInternal
      setRefinedPromptResult(null);
      setRefinementError(null);
      setIsLoadingRefinement(false);
      setVariableValues({});
      console.log('[PromptContext] Canvas, variables, and refinement cleared.');
    } else if (!doClear) {
      console.log('[PromptContext] Canvas already clear.');
    }
  }, [
    components.length,
    promptName,
    refinedPromptResult,
    refinementError,
    variableValues,
    clearLoadSelection,
  ]); // Make sure clearLoadSelection is defined above if used here

  const setSelectedPromptToLoad = useCallback(
    (promptId: string) => {
      setSelectedPromptToLoadInternal(promptId);
      if (promptId) {
        handleLoadPrompt(promptId);
      } else {
        // If "-- Select --" is chosen, optionally clear canvas after confirmation
        if (components.length > 0 || !!promptName) {
          if (window.confirm('Clear current canvas?')) {
            setComponents([]);
            setPromptName('');
            setVariableValues({});
            setRefinedPromptResult(null);
            setRefinementError(null);
          } else {
            // User cancelled clearing, but dropdown is already "Select".
            // This UX is a bit tricky. Maybe find the ID that matches current canvas?
            // For now, leave as is.
          }
        }
      }
    },
    [handleLoadPrompt, components.length, promptName]
  ); // Include handleLoadPrompt as it's called

  const handleSaveAsTemplate = useCallback(
    async (templateName: string): Promise<boolean> => {
      if (!user) {
        alert('Please sign in to save templates.');
        return false;
      }
      const nameToSave = templateName.trim();
      if (!nameToSave) {
        alert('Please provide a name for the template.');
        return false;
      }
      if (components.length === 0) {
        alert('Cannot save an empty canvas as a template.');
        return false;
      }

      setIsLoadingSavedTemplates(true);
      console.log('[DB Templates] Saving template:', nameToSave);
      try {
        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameToSave,
            components: JSON.parse(JSON.stringify(components)), // Send current components
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save template to server');
        }
        alert(`Template "${nameToSave}" saved successfully!`);
        await fetchUserTemplates(); // Refresh template list
        setSelectedTemplateToLoadInternal(data.template?.id || ''); // Select the newly saved template by ID
        setSelectedPromptToLoadInternal(''); // Clear saved prompt selection
        return true;
      } catch (error: any) {
        console.error('[DB Templates] Error saving template:', error);
        alert(`Error saving template: ${error.message}`);
        return false;
      } finally {
        setIsLoadingSavedTemplates(false);
      }
    },
    [user, components, fetchUserTemplates]
  );

  const handleLoadTemplate = useCallback(
    async (templateId: string) => {
      // Now takes ID
      if (!user || !templateId) {
        setSelectedTemplateToLoadInternal(''); // Clear if no id
        return;
      }
      const needsConf =
        components.length > 0 ||
        !!promptName ||
        !!refinedPromptResult ||
        !!refinementError;
      if (
        needsConf &&
        !window.confirm(
          `Loading template will replace current canvas & clear results/name. Proceed?`
        )
      ) {
        // Don't reset setSelectedTemplateToLoadInternal, it's already set by the caller (setter)
        return;
      }

      setIsLoadingSavedTemplates(true);
      // ... (Clear other states: promptName, refinement, variables, selections) ...
      setPromptName('');
      clearLoadSelection();
      setSelectedTemplateToLoadInternal(templateId);
      setRefinedPromptResult(null);
      setRefinementError(null);
      setIsLoadingRefinement(false);
      setVariableValues({});

      console.log('[DB Templates] Loading full template for ID:', templateId);

      try {
        // Fetch single template by ID from backend
        const response = await fetch(`/api/templates?id=${templateId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to load template from server'
          );
        }
        const data = await response.json();
        const entryToLoad: SavedTemplateEntry | null = data.template; // Add type hint

        if (entryToLoad?.components && Array.isArray(entryToLoad.components)) {
          // --- *** REPLACE THIS ID ASSIGNMENT LOGIC *** ---
          let startId = nextId.current; // Get the current unique ID counter value
          const newComponents = entryToLoad.components.map(
            (comp: PromptComponentData, index: number) => {
              const newId = startId + index; // Generate new ID based on current counter
              return { id: newId, type: comp.type, content: comp.content };
            }
          );
          // Update the global nextId counter for subsequent new components
          if (newComponents.length > 0) {
            nextId.current = startId + newComponents.length;
          }
          // --- *** END REPLACEMENT *** ---
          setComponents(newComponents);
          setPromptName(''); // Templates don't set a prompt instance name
          clearLoadSelection(); // Clears both prompt & template selections first
          setSelectedTemplateToLoadInternal(templateId); // Then re-select the loaded template
          setRefinedPromptResult(null);
          setRefinementError(null);
          setIsLoadingRefinement(false);
          setVariableValues({}); // Clear variables when loading a template
          console.log(
            `[DB Templates] Template "${entryToLoad.name}" (ID: ${templateId}) loaded.`
          );
          alert(`Template "${entryToLoad.name}" loaded.`);
        } else {
          throw new Error(
            'Template data not found or invalid format from server.'
          );
        }
      } catch (error: any) {
        console.error('[DB Templates] Error loading template:', error);
        alert(`Error loading template: ${error.message}`);
        setSelectedTemplateToLoadInternal(''); // Clear selection on error
        // Optionally clear canvas too on load error?
      } finally {
        setIsLoadingSavedTemplates(false);
      }
    },
    [
      user,
      components.length,
      promptName,
      refinedPromptResult,
      refinementError,
      clearLoadSelection,
      setVariableValues,
    ]
  );

  // src/app/context/PromptContext.tsx // REPLACE THIS FUNCTION BLOCK

  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      // Now takes ID
      if (!user || !templateId) return;

      // Find the template name for the confirmation message
      const templateToDelete = savedTemplateList.find(
        (t) => t.id === templateId
      );
      const templateNameToConfirm =
        templateToDelete?.name || `ID ${templateId.substring(0, 8)}...`; // Use name or partial ID

      if (
        !window.confirm(
          `Permanently delete the template "${templateNameToConfirm}"?`
        )
      ) {
        return; // User cancelled
      }

      setIsLoadingSavedTemplates(true);
      console.log('[DB Templates] Deleting template ID:', templateId);

      try {
        const response = await fetch(`/api/templates?id=${templateId}`, {
          method: 'DELETE',
        });

        // Check HTTP status code first for success indication
        if (!response.ok) {
          // Try to get more specific error from response body if possible
          let errorMsg = `Failed to delete template (Status: ${response.status})`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg; // Use backend error if available
          } catch (jsonError) {
            // Ignore JSON parsing error if body is not JSON or empty
            console.warn(
              'Could not parse error JSON from failed delete response.'
            );
          }
          throw new Error(errorMsg); // Throw the determined error
        }

        // If response.ok is true, assume deletion was successful on the server
        // Optional: Attempt to parse body for { success: true }, but don't rely on it
        try {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            console.log('[DB Templates] Delete response data:', data); // Log if needed
          }
        } catch (jsonError) {
          console.warn(
            'Could not parse success JSON from delete response, proceeding based on status.'
          );
        }

        alert(`Template "${templateNameToConfirm}" deleted.`);
        fetchUserTemplates(); // Refresh template list from backend
        // Clear selection in UI if the deleted one was selected
        if (selectedTemplateToLoad === templateId) {
          setSelectedTemplateToLoadInternal('');
        }
      } catch (error: any) {
        console.error('[DB Templates] Error deleting template:', error);
        alert(`Error deleting template: ${error.message}`);
        // Do not clear selection here on error, user might want to retry
      } finally {
        setIsLoadingSavedTemplates(false);
      }

      // Updated dependencies - fetchUserTemplates is stable via useCallback
    },
    [user, savedTemplateList, selectedTemplateToLoad, fetchUserTemplates]
  ); // Removed unnecessary promptName

  const setSelectedTemplateToLoad = useCallback(
    (templateId: string) => {
      // Now takes ID
      setSelectedTemplateToLoadInternal(templateId);
      if (templateId) {
        handleLoadTemplate(templateId); // Automatically load when selected
      } else {
        // If "-- Select --" is chosen, optionally clear canvas (after confirmation)
        // For now, just deselects. User can click Clear Canvas if needed.
      }
    },
    [handleLoadTemplate]
  );

  // --- *** NEW: Rename Template Handler *** ---
  const handleRenameTemplate = useCallback(
    async (templateId: string, newName: string): Promise<boolean> => {
      if (!user || !templateId || !newName.trim()) {
        alert('Invalid input for renaming template.');
        return false;
      }
      const trimmedNewName = newName.trim();
      console.log(
        `[CONTEXT Templates] Attempting to rename template ${templateId} to "${trimmedNewName}"`
      );
      setIsLoadingSavedTemplates(true); // Use template loading state

      try {
        const response = await fetch(`/api/templates`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: templateId,
            newName: trimmedNewName,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          alert(
            `Failed to rename template: ${data.error || 'Unknown server error'}`
          );
          console.error(
            '[CONTEXT Templates] Rename API call failed:',
            data.error
          );
          return false;
        }

        alert(
          `Template successfully renamed to "${data.template?.name || trimmedNewName}"!`
        );
        await fetchUserTemplates(); // Refresh the list from the DB
        // Optionally, update selectedTemplateToLoad if the renamed one was selected
        // if (selectedTemplateToLoad === templateId) {
        //    setSelectedTemplateToLoadInternal(templateId); // Keep ID, name updates on list refresh
        // }
        return true;
      } catch (error: any) {
        console.error(
          '[CONTEXT Templates] Error during rename template:',
          error
        );
        alert(`Error renaming template: ${error.message}`);
        return false;
      } finally {
        setIsLoadingSavedTemplates(false);
      }
    },
    [user, fetchUserTemplates]
  ); // Added fetchUserTemplates

  // --- NEW: Template Management Modal Handlers ---
  const openTemplateManagementModal = useCallback(
    () => setIsTemplateManagementModalOpen(true),
    []
  );
  const closeTemplateManagementModal = useCallback(
    () => setIsTemplateManagementModalOpen(false),
    []
  );

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
      // For OpenAI
      const key = apiKey.trim();
      setUserApiKeyInternal(key);
      setApiKeyValidationStatusInternal('idle');
      setApiKeyValidationErrorInternal(null);
      if (!key && selectedProvider === 'openai') {
        setAvailableModelsList([]);
        setSelectedModelInternal('');
      }
      // If consent is given, save to DB
      if (consentToSaveApiKey && user) {
        // Check user exists
        console.log(
          '[CONTEXT setUserApiKey] Consent given. Calling saveUserSettings for OpenAI.'
        ); // ADD THIS LOG
        saveUserSettings({
          provider_to_save: 'openai',
          plaintext_api_key: key,
          consent_given: true,
        });
      } else if (!key && user && isOpenAiKeyLoadedFromDb) {
        // If key is cleared and was previously saved
        console.log(
          '[CONTEXT setUserApiKey] Key cleared, was saved. Calling saveUserSettings to remove OpenAI key.'
        ); // ADD THIS LOG
        saveUserSettings({
          provider_to_save: 'openai',
          plaintext_api_key: '',
          consent_given: true,
        }); // Send empty to delete
      } else {
        console.log('[CONTEXT setUserApiKey] No DB save condition met.', {
          consentToSaveApiKey,
          user: !!user,
          keyExists: !!key,
          isOpenAiKeyLoadedFromDb,
        }); // ADD THIS LOG
      }
    },
    [
      selectedProvider,
      consentToSaveApiKey,
      user,
      saveUserSettings,
      isOpenAiKeyLoadedFromDb,
    ]
  );

  const setUserAnthropicApiKey = useCallback(
    (apiKey: string) => {
      // For Anthropic
      const key = apiKey.trim();
      setUserAnthropicApiKeyInternal(key); // Always update session key
      setApiKeyValidationStatusInternal('idle');
      setApiKeyValidationErrorInternal(null);

      // If key is cleared and Anthropic is the selected provider, clear models
      if (!key && selectedProvider === 'anthropic') {
        setAvailableModelsList([]);
        setSelectedModelInternal('');
      }

      // If consent is given, save to DB
      if (consentToSaveApiKey && user) {
        // Check user exists
        console.log(
          '[CONTEXT setUserAnthropicApiKey] Consent given. Calling saveUserSettings for Anthropic.'
        ); // LOG
        saveUserSettings({
          provider_to_save: 'anthropic',
          plaintext_api_key: key,
          consent_given: true,
        });
      } else if (!key && user && isAnthropicKeyLoadedFromDb) {
        // If key is cleared and was previously saved
        console.log(
          '[CONTEXT setUserAnthropicApiKey] Key cleared, was saved. Calling saveUserSettings to remove Anthropic key.'
        ); // LOG
        saveUserSettings({
          provider_to_save: 'anthropic',
          plaintext_api_key: '',
          consent_given: true,
        }); // Send empty to delete
      } else {
        console.log(
          '[CONTEXT setUserAnthropicApiKey] No DB save condition met.',
          {
            consentToSaveApiKey,
            user: !!user,
            keyExists: !!key,
            isAnthropicKeyLoadedFromDb,
          }
        ); // LOG
      }
    },
    [
      selectedProvider,
      consentToSaveApiKey,
      user,
      saveUserSettings,
      isAnthropicKeyLoadedFromDb,
    ]
  ); // Dependencies

  // --- NEW: Google Key Setter ---
  const setUserGoogleApiKey = useCallback(
    (apiKey: string) => {
      const key = apiKey.trim();
      setUserGoogleApiKeyInternal(key);
      setApiKeyValidationStatusInternal('idle');
      setApiKeyValidationErrorInternal(null);
      if (!key && selectedProvider === 'google') {
        setAvailableModelsList([]);
        setSelectedModelInternal('');
      }
      // Determine if this key should be saved to DB (using same consentToSaveApiKey)
      const isGoogleKeyLoadedFromDb = false; // TODO: Add isGoogleKeyLoadedFromDb state if saving Google keys
      if (consentToSaveApiKey && user) {
        saveUserSettings({
          provider_to_save: 'google',
          plaintext_api_key: key,
          consent_given: true,
        });
      } else if (!key && user && isGoogleKeyLoadedFromDb) {
        // Placeholder logic
        saveUserSettings({
          provider_to_save: 'google',
          plaintext_api_key: '',
          consent_given: true,
        });
      }
    },
    [
      selectedProvider,
      consentToSaveApiKey,
      user,
      saveUserSettings /*, isGoogleKeyLoadedFromDb - add later */,
    ]
  );

  const setSelectedProvider = useCallback(
    (provider: string) => {
      setSelectedProviderInternal(provider);
      setApiKeyValidationStatusInternal('idle');
      setApiKeyValidationErrorInternal(null);
      // Save this change to DB
      saveUserSettings({ last_selected_provider: provider });
    },
    [saveUserSettings]
  );

  const setSelectedModel = useCallback(
    (model: string) => {
      setSelectedModelInternal(model);
      // Save this change to DB
      saveUserSettings({ last_selected_model: model });
    },
    [saveUserSettings]
  ); // Dependency on saveUserSettings

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
      setIsLoadingModels(true);
      try {
        const response = await fetch('/api/validate-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey: key }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Proxy failed: ${response.status}`);
        }
        if (data.isValid) {
          isValid = true;
          setApiKeyValidationStatusInternal('valid');
          setApiKeyValidationErrorInternal(null);
          const modelIds = Array.isArray(data.models) ? data.models : [];
          setAvailableModelsList(modelIds);
          setSelectedModelInternal((cm) => {
            const dm =
              provider === 'openai'
                ? 'gpt-4o'
                : provider === 'anthropic'
                  ? 'claude-3-sonnet-20240229'
                  : provider === 'google' // --- ADD GOOGLE DEFAULT HERE ---
                    ? 'gemini-1.5-pro-latest' // Or 'gemini-pro'*
                    : '';
            return modelIds.includes(cm || '')
              ? cm || ''
              : dm && modelIds.includes(dm)
                ? dm
                : modelIds[0] || '';
          });
        } else {
          isValid = false;
          setApiKeyValidationStatusInternal('invalid');
          setApiKeyValidationErrorInternal(data.error || 'Invalid Key.');
          setAvailableModelsList([]);
          setSelectedModelInternal('');
        }
      } catch (error: any) {
        setApiKeyValidationStatusInternal('invalid');
        setAvailableModelsList([]);
        setSelectedModelInternal('');
        setApiKeyValidationErrorInternal(
          error.message?.includes('fetch')
            ? 'Network Error.'
            : error.message || 'Validation failed.'
        );
        isValid = false;
      } finally {
        setIsLoadingModels(false);
      }
      return isValid;
    },
    [selectedProvider, fetchAvailableModelsInternal]
  );
  const handleRefinePrompt = useCallback(async () => {
    if (!selectedModel)
      throw new Error(`Select model for ${selectedProvider.toUpperCase()}.`);

    console.log('[PromptContext] handleRefinePrompte called');
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

    let promptToSendForRefinement = currentGeneratedPrompt;

    try {
      // Qualification Step
      console.log('[PromptContext] Calling /api/qualify-prompt...');
      const qualifyResponse = await fetch('/api/qualify-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: currentGeneratedPrompt }),
      });
      const qualificationResult: QualificationResult =
        await qualifyResponse.json(); // Use imported type
      if (!qualifyResponse.ok)
        throw new Error(
          qualificationResult.detail || 'Qualification request failed.'
        );
      console.log('[PromptContext] Qualification result:', qualificationResult);

      // --- UPDATED: Handle New Qualification Result Types ---
      switch (qualificationResult.type) {
        case 'valid_for_refinement':
          console.log(
            '[PromptContext] Prompt is valid. Proceeding to refinement.'
          );
          // promptToSendForRefinement remains currentGeneratedPrompt
          break;

        case 'meta_request_for_prompt':
          console.log(
            '[PromptContext] Detected meta request. Rephrasing for refinement.'
          );
          // Instruct the main refiner to build a prompt based on this request
          promptToSendForRefinement = `Based on the following user request, please craft a complete, well-structured prompt that could be used to fulfill it. User Request: "${currentGeneratedPrompt}"`;
          // refinementStatusMessage = "Interpreted as request for a new prompt; attempting to generate...";
          break;

        case 'too_vague_or_incomplete':
        case 'gibberish':
          console.log(
            `[PromptContext] Qualification failed: ${qualificationResult.type}`
          );
          setRefinementError(
            `Input is considered '${qualificationResult.type}'. Please provide a more detailed prompt or a clearer request for a prompt.`
          );
          setIsLoadingRefinement(false);
          return; // Stop processing

        case 'error': // Error from the qualification API route itself
          throw new Error(
            qualificationResult.detail ||
              'Qualification service encountered an error.'
          );

        default: // Should not happen if types are exhaustive
          console.warn(
            '[PromptContext] Unknown qualification type:',
            qualificationResult.type
          );
          setRefinementError(
            'An unexpected issue occurred during prompt qualification. Proceeding with original prompt.'
          );
          // Fallback: proceed with original prompt, or could choose to stop
          break;
      }
      // --- END UPDATE ---

      // Refinement Step (uses promptToSendForRefinement)
      console.log(
        '[PromptContext] Proceeding to refinement call with:',
        promptToSendForRefinement
      );

      let responseData: any;
      let refinedText: string | null = null;
      if (refinementStrategy === 'userKey') {
        const key =
          selectedProvider === 'openai'
            ? userApiKey
            : selectedProvider === 'anthropic'
              ? userAnthropicApiKey
              : selectedProvider === 'google'
                ? userGoogleApiKey
                : null;

        if (!key)
          throw new Error(
            `API Key for ${selectedProvider.toUpperCase()} required.`
          );
        if (!selectedModel)
          throw new Error(
            `Select model for ${selectedProvider.toUpperCase()}.`
          );

        const response = await fetch('/api/refine-user', {
          // Call proxy
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
        if (!response.ok)
          throw new Error(
            responseData.error || `Proxy failed: ${response.status}`
          );
        refinedText = responseData?.refinedPrompt?.trim();
      } else {
        if (!selectedModel)
          throw new Error(`Select model for ${selectedProvider}.`);
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
        if (!response.ok)
          throw new Error(
            responseData.error || `Managed request failed: ${response.status}`
          );
        refinedText = responseData?.refinedPrompt?.trim();
      }

      if (!refinedText) throw new Error('No refined content received.');
      setRefinedPromptResult(refinedText);
      console.log('Refinement successful.');
      setRefinementError(null);
    } catch (error: any) {
      console.error('Refinement failed:', error);
      setRefinementError(error.message || 'Unknown error.');
    } finally {
      setIsLoadingRefinement(false);
      console.log('Refinement/Qualification finished.');
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
  }, [refinedPromptResult, promptName, clearLoadSelection, setVariableValues]);

  const updateVariableValue = useCallback(
    (variableName: string, value: string) => {
      setVariableValues((prev) => ({ ...prev, [variableName]: value }));
    },
    []
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // --- NEW: Auth Modal Handlers ---
  const openAuthModal = useCallback((mode: 'signIn' | 'signUp' = 'signIn') => {
    setAuthModalMode(mode); // Set the mode before opening
    setIsAuthModalOpenInternal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpenInternal(false);
  }, []);

  // Update Auth Listener in context to close modal on successful sign-in/sign-up if it's open
  // This is a bit tricky as onAuthStateChange is global.
  // Let's handle closing via the onAuthSuccess callback passed from AuthModal to AuthDisplay for now.

  const signUpUser = useCallback(async (credentials: any) => {
    setAuthLoading(true);
    try {
      if (!credentials.email || !credentials.password)
        throw new Error('Email/password required.');
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw error;
      alert('Sign up successful! Check email if confirmation needed.');
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      alert(`Sign up failed: ${error.message}`);
      return { data: null, error };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signInUser = useCallback(async (credentials: any) => {
    setAuthLoading(true);
    try {
      if (!credentials.email || !credentials.password)
        throw new Error('Email/password required.');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      alert(`Sign in failed: ${error.message}`);
      return { data: null, error };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      alert(`Sign out failed: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // --- NEW: Prompt Management Modal Handlers ---
  const openPromptManagementModal = useCallback(
    () => setIsPromptManagementModalOpen(true),
    []
  );
  const closePromptManagementModal = useCallback(
    () => setIsPromptManagementModalOpen(false),
    []
  );

  // --- NEW: Rename Prompt Handler (Placeholder - will call API) ---
  // src/app/context/PromptContext.tsx // MODIFY THIS FUNCTION

  // --- Rename Prompt Handler (Implement API Call) ---
  const handleRenamePrompt = useCallback(
    async (promptId: string, newName: string): Promise<boolean> => {
      if (!user || !promptId || !newName.trim()) {
        alert(
          'Invalid input for renaming: User, Prompt ID, and new name are required.'
        );
        return false;
      }
      const trimmedNewName = newName.trim();
      console.log(
        `[CONTEXT] Attempting to rename prompt ${promptId} to "${trimmedNewName}"`
      );

      // Optimistic UI: Find the prompt to update its name locally first for responsiveness
      // This is optional, but can make the UI feel faster.
      // If API call fails, we might need to revert this.
      const originalName = savedPromptList.find((p) => p.id === promptId)?.name;

      // For more robust optimistic update, update a temporary state or clone the list
      // setSavedPromptList(prevList =>
      //     prevList.map(p => (p.id === promptId ? { ...p, name: trimmedNewName, updatedAt: new Date().toISOString() } : p))
      // );

      try {
        const response = await fetch(`/api/prompts`, {
          // Ensure this is the correct endpoint
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: promptId,
            newName: trimmedNewName,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          // Revert optimistic update if API call fails
          // if (originalName) {
          //     setSavedPromptList(prevList =>
          //         prevList.map(p => (p.id === promptId ? { ...p, name: originalName } : p))
          //     );
          // }
          alert(
            `Failed to rename prompt: ${data.error || 'Unknown server error'}`
          );
          console.error('[CONTEXT] Rename API call failed:', data.error);
          return false;
        }

        // If successful, the API has updated the DB.
        // Refresh the list from the DB to ensure consistency and get new updated_at.
        alert(
          `Prompt successfully renamed to "${data.prompt?.name || trimmedNewName}"!`
        );
        await fetchUserPrompts(); // This will re-fetch the list including the renamed item
        return true;
      } catch (error: any) {
        console.error('[CONTEXT] Error during rename prompt:', error);
        // Revert optimistic update on network error etc.
        // if (originalName) {
        //     setSavedPromptList(prevList =>
        //         prevList.map(p => (p.id === promptId ? { ...p, name: originalName } : p))
        //     );
        // }
        alert(`Error renaming prompt: ${error.message}`);
        return false;
      }
      // No explicit setIsLoadingSavedPrompts here, as fetchUserPrompts handles it.
      // If doing optimistic UI without immediate fetch, might need separate loading.
    },
    [user, fetchUserPrompts, savedPromptList]
  ); // Added savedPromptList for optimistic revert (optional)

  // --- NEW: Shared Library Modal Handlers ---
  const openSharedLibraryModal = useCallback(
    () => setIsSharedLibraryModalOpen(true),
    []
  );
  const closeSharedLibraryModal = useCallback(
    () => setIsSharedLibraryModalOpen(false),
    []
  );

  // --- *** NEW: Handler to Load Library Item to Canvas *** ---
  // src/app/context/PromptContext.tsx // Ensure this IS the function in your file

  const loadLibraryItemToCanvas = useCallback(
    (libraryItemData: {
      // Parameter name was item, changed for clarity
      name: string;
      components: PromptComponentData[];
      suggested_provider?: string;
      suggested_model?: string;
    }) => {
      // VERY FIRST LOG
      console.log(
        '[CONTEXT] loadLibraryItemToCanvas CALLED. Received data:',
        JSON.stringify(libraryItemData, null, 2)
      );

      // Early exit if components are missing/invalid
      if (
        !libraryItemData ||
        !libraryItemData.components ||
        !Array.isArray(libraryItemData.components)
      ) {
        console.error(
          '[CONTEXT] ERROR: loadLibraryItemToCanvas received invalid or missing components array!',
          libraryItemData
        );
        alert(
          'Error: Could not load library item, component data is missing or invalid.'
        );
        // Reset relevant states if load fails early
        setRefinedPromptResult(null);
        setRefinementError(null);
        setIsLoadingRefinement(false);
        setVariableValues({});
        clearLoadSelection(); // Resets selected prompt/template dropdowns
        return;
      }

      console.log(
        '[CONTEXT] Loading library item to canvas:',
        libraryItemData.name
      );

      // Assign NEW Unique IDs
      let currentMaxId = -1;
      const newComponents = libraryItemData.components.map((comp, index) => {
        const newId = nextId.current + index; // Use nextId.current as a base for uniqueness
        currentMaxId = newId;
        return { ...comp, id: newId };
      });
      if (nextId.current !== undefined) {
        nextId.current = currentMaxId + 1; // Increment global ID counter
      }

      setComponents(newComponents);
      setPromptName(libraryItemData.name);

      if (libraryItemData.suggested_provider) {
        setSelectedProviderInternal(libraryItemData.suggested_provider);
      }
      if (libraryItemData.suggested_model) {
        setSelectedModelInternal(libraryItemData.suggested_model);
      } else if (libraryItemData.suggested_provider) {
        setSelectedModelInternal(''); // Clear if provider changed but no model suggested
      }

      clearLoadSelection();
      setVariableValues({});
      setRefinedPromptResult(null);
      setRefinementError(null);
      setIsLoadingRefinement(false);

      alert(`Library item "${libraryItemData.name}" loaded to canvas.`);

      // Updated dependency array
    },
    [
      clearLoadSelection,
      nextId /* relevant setters if they weren't stable, but useState setters are */,
    ]
  );

  const value: PromptContextType = {
    // Core State
    components,
    promptName,
    generatedPrompt,
    // Saved Prompts (DB)
    savedPromptList,
    isLoadingSavedPrompts,
    selectedPromptToLoad,
    // Saved Templates (DB)
    savedTemplateList,
    isLoadingSavedTemplates,
    selectedTemplateToLoad,
    // Auth State
    session,
    user,
    authLoading,
    // Refinement State
    refinementStrategy,
    userApiKey,
    userAnthropicApiKey,
    selectedProvider,
    selectedModel,
    isLoadingRefinement,
    refinedPromptResult,
    refinementError,
    // Modal State
    isApiKeyModalOpen,
    isAuthModalOpen,
    isPromptManagementModalOpen,
    isTemplateManagementModalOpen,
    isSharedLibraryModalOpen,
    // API Key Validation State
    apiKeyValidationStatus,
    apiKeyValidationError,
    // Available Models State
    availableModelsList,
    isLoadingModels,
    // Variable State
    detectedVariables,
    variableValues,
    // UI State
    isSidebarOpen,
    isLoadingUserSettings,
    consentToSaveApiKey,
    isOpenAiKeyLoadedFromDb,
    isAnthropicKeyLoadedFromDb,
    // --- Add Google Key State ---
    userGoogleApiKey,
    // --- ALL HANDLERS ---
    addComponent,
    handleContentSave,
    handleDeleteComponent,
    handleDragEnd,
    setPromptNameDirectly,
    fetchUserPrompts,
    handleSavePrompt,
    handleClearCanvas,
    handleLoadPrompt,
    handleDeleteSavedPrompt,
    setSelectedPromptToLoad,
    fetchUserTemplates,
    handleSaveAsTemplate,
    handleLoadTemplate,
    handleDeleteTemplate,
    setSelectedTemplateToLoad,
    handleRenameTemplate,
    handleRenamePrompt,
    signUpUser,
    signInUser,
    signOutUser,
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
    toggleSidebar,
    setConsentToSaveApiKey,
    openAuthModal,
    closeAuthModal,
    openPromptManagementModal,
    closePromptManagementModal,
    openTemplateManagementModal,
    closeTemplateManagementModal,
    openSharedLibraryModal,
    closeSharedLibraryModal,
    loadLibraryItemToCanvas, // Ensure this one is also here from the last step
    // --- Add Google Key Setter ---
    setUserGoogleApiKey,
  };

  return (
    <PromptContext.Provider value={value}>{children}</PromptContext.Provider>
  );
}
