import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings store for application configuration
 * Persists settings in localStorage
 */
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // API Keys (stored securely in localStorage)
      apiKeys: {
        openai: '',
        openrouter: ''
      },
      
      // Model configuration
      modelConfig: {
        defaultModel: 'gpt-4-turbo',
        temperature: 0.2,
        maxTokens: 4000
      },
      
      // UI Preferences
      uiPreferences: {
        theme: 'light',
        sidebarCollapsed: false,
        codeHighlighting: true
      },
      
      // Actions
      setApiKey: (provider, key) => {
        set(state => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key
          }
        }));
      },
      
      setModelConfig: (config) => {
        set(state => ({
          modelConfig: {
            ...state.modelConfig,
            ...config
          }
        }));
      },
      
      setUIPreference: (key, value) => {
        set(state => ({
          uiPreferences: {
            ...state.uiPreferences,
            [key]: value
          }
        }));
      },
      
      // Check if API keys are configured
      hasApiKey: (provider) => {
        const state = get();
        return state.apiKeys[provider] && state.apiKeys[provider].length > 0;
      },
      
      resetSettings: () => {
        set({
          apiKeys: {
            openai: '',
            openrouter: ''
          },
          modelConfig: {
            defaultModel: 'gpt-4-turbo',
            temperature: 0.2,
            maxTokens: 4000
          },
          uiPreferences: {
            theme: 'light',
            sidebarCollapsed: false,
            codeHighlighting: true
          }
        });
      }
    }),
    {
      name: 'agent-manager-settings',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        modelConfig: state.modelConfig,
        uiPreferences: state.uiPreferences
      })
    }
  )
);

export default useSettingsStore;