import { useState, useEffect } from 'react';
import './OpenAISettings.css';

/**
 * Component for configuring OpenAI settings for agent execution
 */
const OpenAISettings = ({ 
  apiKey = '',  
  model = 'gpt-4-turbo', 
  temperature = 0.2,
  onSettingsChange = () => {},
  containerClassName = '' 
}) => {
  const [key, setKey] = useState(apiKey);
  const [selectedModel, setSelectedModel] = useState(model);
  const [temp, setTemp] = useState(temperature);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveToLocalStorage, setSaveToLocalStorage] = useState(false);
  
  // Available models
  const availableModels = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ];

  // Load API key from localStorage on component mount if available
  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    const storedModel = localStorage.getItem('openai_model');
    const storedTemp = localStorage.getItem('openai_temperature');
    
    if (storedKey) {
      setKey(storedKey);
      setSaveToLocalStorage(true);
      
      // Update parent with stored settings
      onSettingsChange({
        apiKey: storedKey,
        model: storedModel || model,
        temperature: parseFloat(storedTemp) || temperature
      });
    }
    
    if (storedModel) {
      setSelectedModel(storedModel);
    }
    
    if (storedTemp) {
      setTemp(parseFloat(storedTemp));
    }
  }, []);
  
  // Update parent component when settings change
  useEffect(() => {
    onSettingsChange({
      apiKey: key,
      model: selectedModel,
      temperature: temp
    });
    
    // Save to localStorage if option is selected
    if (saveToLocalStorage) {
      localStorage.setItem('openai_api_key', key);
      localStorage.setItem('openai_model', selectedModel);
      localStorage.setItem('openai_temperature', temp.toString());
    }
  }, [key, selectedModel, temp, saveToLocalStorage]);
  
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
    
    // Remove from localStorage if unchecked
    if (!e.target.checked) {
      localStorage.removeItem('openai_api_key');
      localStorage.removeItem('openai_model');
      localStorage.removeItem('openai_temperature');
    }
  };
  
  return (
    <div className={`openai-settings ${containerClassName}`}>
      <div className="openai-settings-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="ai-icon">🤖</span> 
          OpenAI Settings
          <span className="toggle-icon">{isExpanded ? '▼' : '►'}</span>
        </h3>
      </div>
      
      {isExpanded && (
        <div className="openai-settings-content">
          <div className="setting-group">
            <label htmlFor="openai-api-key">API Key</label>
            <input
              id="openai-api-key"
              type="password"
              value={key}
              onChange={handleKeyChange}
              placeholder="Enter your OpenAI API key"
              autoComplete="off"
            />
            <p className="setting-help">
              Required for AI-powered analysis. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Get a key here</a>.
            </p>
          </div>
          
          <div className="setting-group">
            <label htmlFor="openai-model">Model</label>
            <select
              id="openai-model"
              value={selectedModel}
              onChange={handleModelChange}
            >
              {availableModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="setting-help">
              Select the OpenAI model to use. GPT-4 provides better analysis but costs more.
            </p>
          </div>
          
          <div className="setting-group">
            <label htmlFor="openai-temperature">Temperature: {temp.toFixed(1)}</label>
            <input
              id="openai-temperature"
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
              Save settings for future sessions
            </label>
            <p className="setting-help">
              Your API key will be stored in your browser's localStorage if checked.
            </p>
          </div>
          
          <div className="openai-footer">
            <div className="api-status">
              {key ? (
                <span className="status-ok">API Key: ✓ Set</span>
              ) : (
                <span className="status-missing">API Key: ✗ Not Set</span>
              )}
            </div>
            <div className="openai-info">
              Using OpenAI models incurs usage costs. <a href="https://openai.com/pricing" target="_blank" rel="noreferrer">View pricing</a>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAISettings;