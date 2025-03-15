import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import './SettingsPage.css';

const SettingsPage = () => {
  const [openAIKey, setOpenAIKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [defaultProvider, setDefaultProvider] = useState('openai');
  const [models, setModels] = useState({
    openai: 'gpt-4-turbo',
    openrouter: 'anthropic/claude-3-haiku'
  });
  const [saveStatus, setSaveStatus] = useState({ message: '', type: '' });
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const storedOpenAIKey = localStorage.getItem('openai_api_key') || '';
    const storedOpenRouterKey = localStorage.getItem('openrouter_api_key') || '';
    const storedDefaultProvider = localStorage.getItem('default_ai_provider') || 'openai';
    const storedOpenAIModel = localStorage.getItem('openai_model') || 'gpt-4-turbo';
    const storedOpenRouterModel = localStorage.getItem('openrouter_model') || 'anthropic/claude-3-haiku';
    
    setOpenAIKey(storedOpenAIKey);
    setOpenRouterKey(storedOpenRouterKey);
    setDefaultProvider(storedDefaultProvider);
    setModels({
      openai: storedOpenAIModel,
      openrouter: storedOpenRouterModel
    });
  }, []);
  
  // Handle input changes
  const handleOpenAIKeyChange = (e) => setOpenAIKey(e.target.value);
  const handleOpenRouterKeyChange = (e) => setOpenRouterKey(e.target.value);
  const handleDefaultProviderChange = (e) => setDefaultProvider(e.target.value);
  
  // Handle model selection changes
  const handleModelChange = (provider, value) => {
    setModels(prevState => ({
      ...prevState,
      [provider]: value
    }));
  };
  
  // Save settings to localStorage
  const saveSettings = () => {
    try {
      // Store API keys
      localStorage.setItem('openai_api_key', openAIKey);
      localStorage.setItem('openrouter_api_key', openRouterKey);
      
      // Store default provider
      localStorage.setItem('default_ai_provider', defaultProvider);
      
      // Store model selections
      localStorage.setItem('openai_model', models.openai);
      localStorage.setItem('openrouter_model', models.openrouter);
      
      // Also store in a combined format for easy access
      localStorage.setItem('ai_settings', JSON.stringify({
        providers: {
          openai: {
            key: openAIKey,
            model: models.openai
          },
          openrouter: {
            key: openRouterKey,
            model: models.openrouter
          }
        },
        defaultProvider
      }));
      
      setSaveStatus({
        message: 'Settings saved successfully!',
        type: 'success'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ message: '', type: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus({
        message: 'Error saving settings: ' + error.message,
        type: 'error'
      });
    }
  };
  
  // Clear all API keys
  const clearAPIKeys = () => {
    if (window.confirm('Are you sure you want to clear all API keys? This cannot be undone.')) {
      localStorage.removeItem('openai_api_key');
      localStorage.removeItem('openrouter_api_key');
      localStorage.removeItem('ai_settings');
      
      setOpenAIKey('');
      setOpenRouterKey('');
      
      setSaveStatus({
        message: 'API keys cleared successfully.',
        type: 'success'
      });
      
      setTimeout(() => {
        setSaveStatus({ message: '', type: '' });
      }, 3000);
    }
  };
  
  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Configure your AI providers and API keys</p>
        </div>
        
        <Card title="AI Provider Settings" className="settings-card">
          <div className="settings-section">
            <h3>Default AI Provider</h3>
            <div className="settings-field">
              <label>
                <input
                  type="radio"
                  name="defaultProvider"
                  value="openai"
                  checked={defaultProvider === 'openai'}
                  onChange={handleDefaultProviderChange}
                />
                OpenAI
              </label>
              <label>
                <input
                  type="radio"
                  name="defaultProvider"
                  value="openrouter"
                  checked={defaultProvider === 'openrouter'}
                  onChange={handleDefaultProviderChange}
                />
                OpenRouter
              </label>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>OpenAI Settings</h3>
            <div className="settings-field">
              <label htmlFor="openai-key">API Key</label>
              <input
                id="openai-key"
                type="password"
                value={openAIKey}
                onChange={handleOpenAIKeyChange}
                placeholder="Enter your OpenAI API key"
                className="api-key-input"
                autoComplete="off"
              />
              <p className="help-text">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                  Get an OpenAI API key
                </a>
              </p>
            </div>
            
            <div className="settings-field">
              <label htmlFor="openai-model">Default Model</label>
              <select
                id="openai-model"
                value={models.openai}
                onChange={(e) => handleModelChange('openai', e.target.value)}
              >
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>OpenRouter Settings</h3>
            <div className="settings-field">
              <label htmlFor="openrouter-key">API Key</label>
              <input
                id="openrouter-key"
                type="password"
                value={openRouterKey}
                onChange={handleOpenRouterKeyChange}
                placeholder="Enter your OpenRouter API key"
                className="api-key-input"
                autoComplete="off"
              />
              <p className="help-text">
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
                  Get an OpenRouter API key
                </a>
              </p>
            </div>
            
            <div className="settings-field">
              <label htmlFor="openrouter-model">Default Model</label>
              <select
                id="openrouter-model"
                value={models.openrouter}
                onChange={(e) => handleModelChange('openrouter', e.target.value)}
              >
                <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                <option value="openai/gpt-4">GPT-4</option>
                <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
              </select>
            </div>
          </div>
          
          <div className="settings-info-section">
            <h3>About AI Providers</h3>
            <div className="provider-info">
              <div className="provider-card">
                <h4>OpenAI</h4>
                <p>Direct access to OpenAI models like GPT-4 and GPT-3.5 Turbo.</p>
                <p>Best for: General purpose AI with consistent results.</p>
                <p>Pricing: Pay-as-you-go based on token usage.</p>
              </div>
              
              <div className="provider-card">
                <h4>OpenRouter</h4>
                <p>Provides access to multiple models from different providers.</p>
                <p>Best for: Access to Claude, Llama, and other models with a single API key.</p>
                <p>Pricing: Credits-based system with volume discounts.</p>
              </div>
            </div>
          </div>
          
          <div className="settings-actions">
            <Button onClick={saveSettings}>Save Settings</Button>
            <Button variant="danger" onClick={clearAPIKeys}>Clear API Keys</Button>
          </div>
          
          {saveStatus.message && (
            <div className={`settings-status ${saveStatus.type}`}>
              {saveStatus.message}
            </div>
          )}
        </Card>
        
        <Card title="Local Storage Settings" className="settings-card">
          <div className="settings-section">
            <h3>Offline Mode</h3>
            <div className="settings-field">
              <label>
                <input
                  type="checkbox"
                  checked={localStorage.getItem('offline_mode') === 'true'}
                  onChange={(e) => {
                    localStorage.setItem('offline_mode', e.target.checked.toString());
                    setSaveStatus({
                      message: `Offline mode ${e.target.checked ? 'enabled' : 'disabled'}.`,
                      type: 'success'
                    });
                    setTimeout(() => {
                      setSaveStatus({ message: '', type: '' });
                    }, 3000);
                  }}
                />
                Enable Offline Mode
              </label>
              <p className="help-text">
                When enabled, all changes are stored locally in your browser.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;