import React, { useState } from 'react';
import useAgentStore from '../../stores/agentStore';
import Button from '../shared/Button';
import { agentTemplates } from './AgentTemplates';

const AgentForm = ({ onSubmit, initialValues }) => {
  const agentStore = useAgentStore();
  const { addAgent, updateAgent } = agentStore;
  const [formData, setFormData] = useState(
    initialValues || {
      name: '',
      description: '',
      type: 'analyzer',
      configuration: {},
      capabilities: []
    }
  );
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateSelect = (templateId) => {
    const template = agentTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        type: template.type,
        configuration: template.defaultConfiguration,
        capabilities: template.capabilities
      }));
    }
  };

  const handleCapabilityToggle = (capability) => {
    setFormData(prev => {
      const capabilities = prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability];
      return { ...prev, capabilities };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Create the final agent data
      const agentData = initialValues?.id 
        ? { ...formData, id: initialValues.id } 
        : {
            ...formData,
            id: Math.random().toString(36).substring(2, 11),
            status: 'idle',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
      console.log('Submitting agent data:', agentData);

      // Force localStorage mode for testing
      localStorage.setItem('offline_mode', 'true');
      
      // Update or add the agent
      if (initialValues?.id) {
        // For updates, ensure we have an ID
        const updatedAgent = await updateAgent(agentData);
        console.log('Agent updated successfully:', updatedAgent);
      } else {
        // For new agents, include the generated ID
        const newAgent = await addAgent(agentData);
        console.log('Agent created successfully:', newAgent);
      }

      // Call the callback with the agent data
      if (onSubmit) onSubmit(agentData);
      
    } catch (error) {
      console.error('Error saving agent:', error);
      setErrors({ form: error.message || 'Failed to save agent' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="agent-form">
      <div className="form-group">
        <label htmlFor="name">Agent Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <div className="error-message">{errors.name}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Agent Type</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={errors.type ? 'error' : ''}
        >
          <option value="">Select a type</option>
          <option value="analyzer">Data Analyzer</option>
          <option value="summarizer">Summarizer</option>
          <option value="visualizer">Visualizer</option>
        </select>
        {errors.type && <div className="error-message">{errors.type}</div>}
      </div>

      <div className="form-group">
        <label>Templates</label>
        <div className="template-list">
          {agentTemplates.map(template => (
            <div 
              key={template.id} 
              className="template-item" 
              onClick={() => handleTemplateSelect(template.id)}
            >
              <h4>{template.name}</h4>
              <p>{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Capabilities</label>
        <div className="capabilities-list">
          {['statistical-analysis', 'trend-detection', 'anomaly-detection', 'chart-generation', 'text-summarization'].map(capability => (
            <div key={capability} className="capability-item">
              <input
                type="checkbox"
                id={`capability-${capability}`}
                checked={formData.capabilities.includes(capability)}
                onChange={() => handleCapabilityToggle(capability)}
              />
              <label htmlFor={`capability-${capability}`}>{capability}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <Button type="submit">
          {initialValues?.id ? 'Update Agent' : 'Create Agent'}
        </Button>
      </div>
    </form>
  );
};

export default AgentForm;