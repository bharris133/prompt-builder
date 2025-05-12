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
  handleClearCanvas: () => void;
  addComponent: (type: string) => void;
  handleContentSave: (id: number, newContent: string) => void;
  handleDeleteComponent: (id: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  setPromptNameDirectly: (name: string) => void;
  fetchUserPrompts: () => Promise<void>;
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
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  handleRefinePrompt: () => Promise<void>;
  setIsApiKeyModalOpen: (isOpen: boolean) => void;
  validateUserApiKey: (keyToValidate: string) => Promise<boolean>;
  updateVariableValue: (variableName: string, value: string) => void;
  loadRefinedPromptToCanvas: () => void;
  toggleSidebar: () => void;
}

export const PromptContext = createContext<PromptContextType | null>(null);
const SAVED_TEMPLATES_KEY = 'promptBuilderTemplates';

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
  const [isLoadingUserSettings, setIsLoadingUserSettings] =
    useState<boolean>(false); // <<< NEW STATE
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
  ); // Track mode for modal

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
    } else if (!user && !authLoading) {
      console.log('[Initial Load Effect] No user/Auth loaded, clearing lists.');
      setSavedPromptList([]);
      setSavedTemplateList([]);
    }
  }, [user, authLoading, fetchUserPrompts, fetchUserTemplates]); // Add fetchUserTemplates to deps

  // --- NEW Simplified Effect for fetching prompts based on user state ---
  useEffect(() => {
    if (user && !authLoading) {
      // User is definitively logged in and auth check complete
      console.log(
        '[User Effect] User present and auth loaded, calling fetchUserPrompts.'
      );
      fetchUserPrompts();
    } else if (!user && !authLoading) {
      // No user and auth check complete
      console.log(
        '[User Effect] No user and auth loaded, ensuring prompt list is clear.'
      );
      setSavedPromptList((currentList) => {
        // Clear list only if it's not already empty
        if (currentList.length > 0) return [];
        return currentList;
      });
    }
    // This effect depends on 'user', 'authLoading', and the 'fetchUserPrompts' function.
    // 'fetchUserPrompts' is now more stable due to depending on 'user?.id'.
  }, [user, authLoading, fetchUserPrompts]);

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

  // --- Helper: Function to Persist User Settings ---
  // This function will be called by setSelectedProvider and setSelectedModel
  const saveUserSettings = useCallback(
    async (settingsToSave: Partial<PromptSettings>) => {
      if (!user || Object.keys(settingsToSave).length === 0) return;

      console.log('[User Settings] Attempting to save:', settingsToSave);
      // No loading state for this as it's a background save,
      // but could add one if direct user action triggered it.
      try {
        const response = await fetch('/api/user-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsToSave),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(
            data.error || 'Failed to save user settings to server'
          );
        }
        console.log('[User Settings] Saved successfully:', data.settings);
      } catch (error: any) {
        console.error('[User Settings] Error saving settings:', error);
        // Maybe show a non-blocking error to the user?
      }
    },
    [user]
  ); // Dependency on user

  // --- Helper: Function to Fetch User Settings ---
  const fetchUserSettings = useCallback(async () => {
    if (!user) {
      // Reset to defaults if no user or on logout
      setSelectedProviderInternal('openai');
      setSelectedModelInternal(''); // Let model fetch logic handle this based on provider
      // Trigger model fetch for default provider if needed (effect will handle)
      // fetchAvailableModelsInternal('openai'); // No, useEffect for models will run
      return;
    }
    setIsLoadingUserSettings(true);
    console.log('[User Settings] Fetching settings for user:', user.id);
    try {
      const response = await fetch('/api/user-settings'); // GET request
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch user settings from server'
        );
      }
      const data = await response.json();
      const loadedSettings = data.settings;

      if (loadedSettings && typeof loadedSettings === 'object') {
        console.log('[User Settings] Loaded settings:', loadedSettings);
        if (loadedSettings.last_selected_provider) {
          setSelectedProviderInternal(loadedSettings.last_selected_provider);
        } else {
          setSelectedProviderInternal('openai'); // Default if not set
        }
        if (loadedSettings.last_selected_model) {
          setSelectedModelInternal(loadedSettings.last_selected_model);
        } else {
          setSelectedModelInternal(''); // Will be set by fetchAvailableModels
        }
        // TODO: Load API keys here if we implement DB storage for them
      } else {
        console.log('[User Settings] No settings found, using defaults.');
        setSelectedProviderInternal('openai');
        setSelectedModelInternal(''); // Model list fetch effect will set default model
      }
    } catch (error: any) {
      console.error('[User Settings] Error fetching settings:', error);
      // Fallback to defaults on error
      setSelectedProviderInternal('openai');
      setSelectedModelInternal('');
    } finally {
      setIsLoadingUserSettings(false);
    }
  }, [user]); // Re-fetch when user changes

  // Auth Listener Effect
  // Auth Listener Effect (Ensure setUser is stable)
  useEffect(() => {
    setAuthLoading(true);
    console.log('[Auth Effect] Setting up auth listener.');
    // Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        console.log('[Auth Effect] Initial session retrieved.');
        const initialUser = initialSession?.user ?? null;
        // Only update if user genuinely changes to prevent loop with user-dependent effects
        setUser((currentUser) =>
          currentUser?.id !== initialUser?.id ? initialUser : currentUser
        );
        setSession(initialSession);
        setAuthLoading(false);
        // Fetching prompts is now handled by the separate useEffect watching 'user' and 'authLoading'

        if (initialUser) {
          // If user exists from initial session
          console.log('[Auth Effect] Initial user found, fetching data.');
          fetchUserPrompts();
          fetchUserTemplates();
          fetchUserSettings(); // <<< Fetch settings
        } else {
          // No initial user, clear all user-specific data
          setComponents([]);
          setSavedPromptList([]);
          setPromptName('');
          setVariableValues({});
          setSavedTemplateList([]);
          setRefinedPromptResult(null);
          setRefinementError(null);
          clearLoadSelection();
          // Reset settings to default
          setSelectedProviderInternal('openai');
          setSelectedModelInternal('');
        }

        // Listen for future auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, sessionState: Session | null) => {
            console.log('[Auth Listener] Auth state changed:', _event);
            const newUser = sessionState?.user ?? null;
            // Only update if user genuinely changes
            setUser((currentUser) =>
              currentUser?.id !== newUser?.id ? newUser : currentUser
            );
            setSession(sessionState);
            setAuthLoading(false); // Auth process complete

            if (_event === 'SIGNED_IN') {
              console.log('Auth event: SIGNED_IN - Fetching user data.');
              fetchUserPrompts();
              fetchUserTemplates();
              fetchUserSettings(); // <<< Fetch settings
            }

            if (_event === 'SIGNED_OUT') {
              console.log('Auth event: SIGNED_OUT - Clearing user data.');
              // Clearing components, savedPromptList, etc. is implicitly handled by the
              // useEffect watching 'user' when 'user' becomes null.
              // We can add explicit clears here too if needed for immediate UI update,
              // but the user-dependent useEffect should handle it.
              setComponents([]);
              setSavedPromptList([]);
              setPromptName('');
              setVariableValues({});
              setSavedTemplateList([]);
              setRefinedPromptResult(null);
              setRefinementError(null);
              clearLoadSelection(); // Call this to ensure dropdowns reset
              setSelectedProviderInternal('openai');
              setSelectedModelInternal('');
              // Clear session keys
              setUserApiKeyInternal('');
              setUserAnthropicApiKeyInternal('');
            }
          }
        );
        return () => {
          subscription?.unsubscribe();
        };
      })
      .catch((e) => {
        console.error('Session error', e);
        setAuthLoading(false);
      });
  }, [
    fetchUserPrompts,
    fetchUserTemplates,
    fetchUserSettings,
    clearLoadSelection,
  ]); // Add fetchUserSettings

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
          } else {
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
    [refinementStrategy, userApiKey, userAnthropicApiKey, selectedProvider]
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

  // src/app/context/PromptContext.tsx // REPLACE THIS FUNCTION DEFINITION

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

        if (
          entryToLoad &&
          entryToLoad.components &&
          Array.isArray(entryToLoad.components)
        ) {
          let currentMaxId = -1;
          // --- Explicitly type 'comp' here ---
          const newComponents = entryToLoad.components.map(
            (comp: PromptComponentData, index: number) => {
              const newId = index;
              currentMaxId = newId;
              // Ensure we only spread known properties of PromptComponentData
              return { id: newId, type: comp.type, content: comp.content };
            }
          );
          // --- End type addition ---
          nextId.current = currentMaxId + 1;
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
              : null;
        if (!key) throw new Error(`API Key for ${selectedProvider} required.`);
        if (!selectedModel)
          throw new Error(`Select model for ${selectedProvider}.`);
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

  // --- Value Provided by Context ---
  const value: PromptContextType = {
    // Core State
    components,
    promptName,
    generatedPrompt,
    // Saved Prompts (DB)
    savedPromptList,
    isLoadingSavedPrompts,
    selectedPromptToLoad,
    // Saved Templates (localStorage)
    savedTemplateList,
    isLoadingSavedTemplates, // Replace savedTemplateNames
    selectedTemplateToLoad,
    // Auth State
    session,
    user,
    authLoading,
    // --- NEW: Add Auth Modal State/Handlers ---
    isAuthModalOpen,
    // --- Loading state for user settings
    isLoadingUserSettings,
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
    // Core Component Handlers
    addComponent,
    handleContentSave,
    handleDeleteComponent,
    handleDragEnd,
    setPromptNameDirectly,
    // Prompt DB Handlers
    fetchUserPrompts,
    handleSavePrompt,
    handleClearCanvas, // <<<< IS IT LISTED HERE?
    handleLoadPrompt,
    handleDeleteSavedPrompt,
    setSelectedPromptToLoad,
    // Template Handlers
    handleSaveAsTemplate,
    handleLoadTemplate,
    handleDeleteTemplate,
    setSelectedTemplateToLoad,
    // Auth Handlers
    signUpUser,
    signInUser,
    signOutUser,
    // --- NEW: Add Auth Modal State/Handlers ---
    openAuthModal,
    closeAuthModal,
    // We also need authModalMode for the modal if it's set here, but modal can manage its own initialMode
    // Refinement Setters & Handlers
    setRefinementStrategy,
    setUserApiKey,
    setUserAnthropicApiKey,
    setSelectedProvider,
    setSelectedModel,
    handleRefinePrompt,
    // Modal Setter
    setIsApiKeyModalOpen,
    // Validation Handler
    validateUserApiKey,
    // Variable Setter
    updateVariableValue,
    // Load Refined Handler
    loadRefinedPromptToCanvas,
    // Sidebar Toggle
    toggleSidebar,
  };

  return (
    <PromptContext.Provider value={value}>{children}</PromptContext.Provider>
  );
}
