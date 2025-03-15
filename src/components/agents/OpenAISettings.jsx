import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OpenAISettings.css';

/**
 * Component for configuring OpenAI settings for agent execution
 * This can use settings from the settings page or override them for a specific execution
 */
const OpenAISettings = ({ 
  apiKey = '',  
  model = '',
  temperature = 0.2,
  onSettingsChange = () => {},
  containerClassName = ''
}) => {
  // State for settings
  const [key, setKey] = useState(apiKey);
  const [selectedModel, setSelectedModel] = useState(model);
  const [temp, setTemp] = useState(temperature);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveToLocalStorage, setSaveToLocalStorage] = useState(false);
  const [useGlobalSettings, setUseGlobalSettings] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  
  // Available models for each provider
  const availableModels = {
    openai: [
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    openrouter: [
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
      { id: 'openai/gpt-4', name: 'GPT-4 (via OpenRouter)' },
      { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' }
    ]
  };

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        // Try to load complete settings object first
        const aiSettingsJson = localStorage.getItem('ai_settings');
        if (aiSettingsJson) {
          const aiSettings = JSON.parse(aiSettingsJson);
          const defaultProvider = aiSettings.defaultProvider || 'openai';
          setSelectedProvider(defaultProvider);
          
          // Get the provider settings
          const providerSettings = aiSettings.providers[defaultProvider];
          if (providerSettings) {
            if (providerSettings.key) {
              setKey(providerSettings.key);
              setSaveToLocalStorage(true);
            }
            
            if (providerSettings.model) {
              setSelectedModel(providerSettings.model);
            }
          }
        } else {
          // Fall back to individual settings
          const storedKey = localStorage.getItem('openai_api_key');
          const storedModel = localStorage.getItem('openai_model');
          const storedTemp = localStorage.getItem('openai_temperature');
          
          if (storedKey) {
            setKey(storedKey);
            setSaveToLocalStorage(true);
          }
          
          if (storedModel) {
            setSelectedModel(storedModel);
          } else {
            // Set default model based on provider
            setSelectedModel(selectedProvider === 'openai' ? 'gpt-4-turbo' : 'anthropic/claude-3-haiku');
          }
          
          if (storedTemp) {
            setTemp(parseFloat(storedTemp));
          }
        }
      } catch (error) {
        console.error('Error loading AI settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Update parent component when settings change
  useEffect(() => {
    if (useGlobalSettings) {
      // When using global settings, read from localStorage
      try {
        const aiSettingsJson = localStorage.getItem('ai_settings');
        if (aiSettingsJson) {
          const aiSettings = JSON.parse(aiSettingsJson);
          const provider = aiSettings.defaultProvider || 'openai';
          const providerSettings = aiSettings.providers[provider];
          
          if (providerSettings) {
            onSettingsChange({
              apiKey: providerSettings.key || '',
              model: providerSettings.model || 'gpt-4-turbo',
              temperature: temp,
              provider
            });
          } else {
            onSettingsChange({
              apiKey: localStorage.getItem('openai_api_key') || '',
              model: localStorage.getItem('openai_model') || 'gpt-4-turbo',
              temperature: temp,
              provider: 'openai'
            });
          }
        } else {
          onSettingsChange({
            apiKey: localStorage.getItem('openai_api_key') || '',
            model: localStorage.getItem('openai_model') || 'gpt-4-turbo',
            temperature: temp,
            provider: 'openai'
          });
        }
      } catch (error) {
        console.error('Error reading global settings:', error);
      }
    } else {
      // When using local settings, use the component state
      onSettingsChange({
        apiKey: key,
        model: selectedModel,
        temperature: temp,
        provider: selectedProvider
      });
    }
  }, [key, selectedModel, temp, saveToLocalStorage, useGlobalSettings, selectedProvider]);
  
  // Handle API key input
  const handleKeyChange = (e) => {
    setKey(e.target.value);
  };
  
  // Handle model selection
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };
  
  // Handle temperature slider
  const handleTemperatureChange = (e) => {
    setTemp(parseFloat(e.target.value));
  };
  
  // Toggle save to localStorage
  const handleSaveToggle = (e) => {
    setSaveToLocalStorage(e.target.checked);
  };
  
  // Toggle between global and execution-specific settings
  const handleUseGlobalSettings = (e) => {
    setUseGlobalSettings(e.target.checked);
  };
  
  // Handle provider change
  const handleProviderChange = (e) => {
    setSelectedProvider(e.target.value);
    
    // Update model selection to a valid one for this provider
    if (availableModels[e.target.value] && availableModels[e.target.value].length > 0) {
      setSelectedModel(availableModels[e.target.value][0].id);
    }
  };
  
  return (
    <div className={`openai-settings ${containerClassName}`}>
      <div className="openai-settings-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="ai-icon">🤖</span> 
          AI Settings (Required for full analysis)
          <span className="toggle-icon">{isExpanded ? '▼' : '►'}</span>
        </h3>
      </div>
      
      {isExpanded && (
        <div className="openai-settings-content">
          <div className="setting-group checkbox-group">
            <label htmlFor="use-global-settings">
              <input
                id="use-global-settings"
                type="checkbox"
                checked={useGlobalSettings}
                onChange={handleUseGlobalSettings}
              />
              Use global settings from Settings page
            </label>
            <p className="setting-help">
              When checked, this will use the API keys and models configured in{' '}
              <Link to="/settings" target="_blank">Settings</Link>.
            </p>
          </div>
          
          {!useGlobalSettings && (
            <>
              <div className="setting-group">
                <label>AI Provider</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="provider"
                      value="openai"
                      checked={selectedProvider === 'openai'}
                      onChange={handleProviderChange}
                    />
                    OpenAI
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="provider"
                      value="openrouter"
                      checked={selectedProvider === 'openrouter'}
                      onChange={handleProviderChange}
                    />
                    OpenRouter
                  </label>
                </div>
              </div>
              
              <div className="setting-group">
                <label htmlFor="ai-api-key">API Key</label>
                <input
                  id="ai-api-key"
                  type="password"
                  value={key}
                  onChange={handleKeyChange}
                  placeholder={`Enter your ${selectedProvider === 'openai' ? 'OpenAI' : 'OpenRouter'} API key`}
                  autoComplete="off"
                />
                <p className="setting-help">
                  Required for AI-powered analysis.{' '}
                  {selectedProvider === 'openai' ? (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Get an OpenAI key</a>
                  ) : (
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">Get an OpenRouter key</a>
                  )}
                </p>
              </div>
              
              <div className="setting-group">
                <label htmlFor="ai-model">Model</label>
                <select
                  id="ai-model"
                  value={selectedModel}
                  onChange={handleModelChange}
                >
                  {availableModels[selectedProvider].map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="setting-help">
                  {selectedProvider === 'openai' 
                    ? 'Select the OpenAI model to use. GPT-4 provides better analysis but costs more.'
                    : 'Select the model to use through OpenRouter. Different models have different capabilities and costs.'}
                </p>
              </div>
              
              <div className="setting-group">
                <label htmlFor="ai-temperature">Temperature: {temp.toFixed(1)}</label>
                <input
                  id="ai-temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temp}
                  onChange={handleTemperatureChange}
                />
                <div className="temperature-labels">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
                <p className="setting-help">
                  Lower values provide more deterministic responses, higher values more creative ones.
                </p>
              </div>
              
              <div className="setting-group checkbox-group">
                <label htmlFor="save-settings">
                  <input
                    id="save-settings"
                    type="checkbox"
                    checked={saveToLocalStorage}
                    onChange={handleSaveToggle}
                  />
                  Save these settings for future sessions
                </label>
                <p className="setting-help">
                  Your API key will be stored in your browser's localStorage if checked.
                </p>
              </div>
            </>
          )}
          
          <div className="openai-footer">
            <div className="api-status">
              {useGlobalSettings ? (
                <span className="status-ok">Using global settings from Settings page</span>
              ) : key ? (
                <span className="status-ok">API Key: ✓ Set</span>
              ) : (
                <span className="status-missing">API Key: ✗ Not Set</span>
              )}
            </div>
            <div className="openai-info">
              Using AI models incurs usage costs.{' '}
              {selectedProvider === 'openai' ? (
                <a href="https://openai.com/pricing" target="_blank" rel="noreferrer">View OpenAI pricing</a>
              ) : (
                <a href="https://openrouter.ai/docs#pricing" target="_blank" rel="noreferrer">View OpenRouter pricing</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAISettings;