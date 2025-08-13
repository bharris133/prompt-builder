import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Sidebar } from './Sidebar';
import { usePrompt } from '../hooks/usePrompt';
import '@testing-library/jest-dom';

// --- MOCKS ---
vi.mock('./AuthDisplay', () => ({
  AuthDisplay: () => <div data-testid="mock-auth-display" />,
}));
vi.mock('../hooks/usePrompt');
const mockedUsePrompt = usePrompt as Mock;
// --- END MOCKS ---

describe('Sidebar Component', () => {
  const baseMockState = {
    // Sidebar visibility
    isSidebarOpen: true,
    toggleSidebar: vi.fn(),
    // Prompts
    savedPromptList: [],
    isLoadingSavedPrompts: false,
    selectedPromptToLoad: '',
    setSelectedPromptToLoad: vi.fn(),
    handleDeleteSavedPrompt: vi.fn(),
    handleLoadSavedPrompt: vi.fn(), // Added missing property
    // Templates
    savedTemplateList: [],
    isLoadingSavedTemplates: false,
    selectedTemplateToLoad: '',
    setSelectedTemplateToLoad: vi.fn(),
    handleDeleteTemplate: vi.fn(),
    handleLoadTemplate: vi.fn(), // Added missing property
    // Add Components
    addComponent: vi.fn(),
    // Refinement Settings
    refinementStrategy: 'userKey',
    setRefinementStrategy: vi.fn(),
    userApiKey: '',
    setUserApiKey: vi.fn(),
    userAnthropicApiKey: '',
    setUserAnthropicApiKey: vi.fn(),
    userGoogleApiKey: '',
    setUserGoogleApiKey: vi.fn(),
    selectedProvider: 'openai',
    setSelectedProvider: vi.fn(),
    selectedModel: 'gpt-4',
    setSelectedModel: vi.fn(),
    availableModelsList: ['gpt-4', 'gpt-3.5-turbo'],
    isLoadingModels: false,
    // Modals
    isApiKeyModalOpen: false,
    setIsApiKeyModalOpen: vi.fn(),
    openPromptManagementModal: vi.fn(),
    openTemplateManagementModal: vi.fn(),
    openSharedLibraryModal: vi.fn(),
    // User
    user: null,
    // Getters for dynamic properties
    get currentProviderApiKey() {
      if (this.selectedProvider === 'openai') return this.userApiKey;
      if (this.selectedProvider === 'anthropic')
        return this.userAnthropicApiKey;
      if (this.selectedProvider === 'google') return this.userGoogleApiKey;
      return '';
    },
    get currentSetUserApiKey() {
      if (this.selectedProvider === 'openai') return this.setUserApiKey;
      if (this.selectedProvider === 'anthropic')
        return this.setUserAnthropicApiKey;
      if (this.selectedProvider === 'google') return this.setUserGoogleApiKey;
      return vi.fn();
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePrompt.mockReturnValue(baseMockState);
  });

  it('should show API key button and warning when "Use My Key" is selected and key is missing', () => {
    render(<Sidebar />);
    const apiKeyButton = screen.getByRole('button', {
      name: /Enter OPENAI API Key/i,
    });
    const warningMessage = screen.getByText('API Key required for openai.');
    expect(apiKeyButton).toBeInTheDocument();
    expect(warningMessage).toBeInTheDocument();
  });

  it('should show "Key Set" button and no warning when API key is present', () => {
    mockedUsePrompt.mockReturnValue({
      ...baseMockState,
      userApiKey: 'sk-12345',
    });
    render(<Sidebar />);
    const apiKeyButton = screen.getByRole('button', {
      name: /OPENAI Key Set \(Edit\)/i,
    });
    const warningMessage = screen.queryByText('API Key required for openai.');
    expect(apiKeyButton).toBeInTheDocument();
    expect(warningMessage).not.toBeInTheDocument();
  });

  it('should not show the API key section when "Managed Service" is selected', () => {
    mockedUsePrompt.mockReturnValue({
      ...baseMockState,
      refinementStrategy: 'managedKey',
    });
    render(<Sidebar />);
    const apiKeyButton = screen.queryByRole('button', { name: /Key Set/i });
    const managedServiceRadio = screen.getByLabelText('Managed Service');
    expect(apiKeyButton).not.toBeInTheDocument();
    expect(managedServiceRadio).toBeChecked();
  });
});
