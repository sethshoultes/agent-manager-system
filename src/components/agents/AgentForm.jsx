import React, { useState, useEffect } from 'react';
import useAgentStore from '../../stores/agentStore';
import Button from '../shared/Button';
import { agentTemplates, agentCapabilities } from './AgentTemplates';

const AgentForm = ({ onSubmit, initialValues }) => {
  const agentStore = useAgentStore();
  const { addAgent, updateAgent, agents } = agentStore;
  const [formData, setFormData] = useState(
    initialValues || {
      name: '',
      description: '',
      type: 'analyzer',
      configuration: {},
      capabilities: [],
      collaborators: [] // IDs of collaborating agents
    }
  );
  const [errors, setErrors] = useState({});
  const [isCollaborative, setIsCollaborative] = useState(false);

  // Check if selected agent type is collaborative
  useEffect(() => {
    const template = agentTemplates.find(t => t.type === formData.type);
    setIsCollaborative(template?.isCollaborative || false);
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfigChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: value
      }
    }));
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

  const handleCollaboratorToggle = (agentId) => {
    setFormData(prev => {
      const collaborators = prev.collaborators?.includes(agentId)
        ? prev.collaborators.filter(id => id !== agentId)
        : [...(prev.collaborators || []), agentId];
      return { ...prev, collaborators };
    });
  };

  const handleExecutionModeChange = (mode) => {
    handleConfigChange('executionMode', mode);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type is required';
    
    // Validate collaborators if this is a collaborative agent
    if (isCollaborative && (!formData.collaborators || formData.collaborators.length === 0)) {
      newErrors.collaborators = 'At least one collaborator agent is required';
    }
    
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

  // Filter out current agent from potential collaborators
  const availableCollaborators = agents.filter(agent => 
    agent.id !== initialValues?.id && agentTemplates.find(t => t.type === agent.type)?.canCollaborate
  );

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
          <option value="collaborative">Collaborative Analyzer</option>
          <option value="pipeline">Analysis Pipeline</option>
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
              {template.isCollaborative && (
                <span className="collaborative-badge">Collaborative</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Capabilities</label>
        <div className="capabilities-list">
          {agentCapabilities.map(capability => (
            <div key={capability.id} className="capability-item">
              <input
                type="checkbox"
                id={`capability-${capability.id}`}
                checked={formData.capabilities.includes(capability.id)}
                onChange={() => handleCapabilityToggle(capability.id)}
              />
              <label htmlFor={`capability-${capability.id}`}>
                {capability.name}
                <span className="capability-description">{capability.description}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Collaborative agent specific settings */}
      {isCollaborative && (
        <>
          <div className="form-group">
            <label>Execution Mode</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="executionMode"
                  value="sequential"
                  checked={(formData.configuration?.executionMode || 'sequential') === 'sequential'}
                  onChange={() => handleExecutionModeChange('sequential')}
                />
                Sequential (One after another)
              </label>
              <label>
                <input
                  type="radio"
                  name="executionMode"
                  value="parallel"
                  checked={(formData.configuration?.executionMode || 'sequential') === 'parallel'}
                  onChange={() => handleExecutionModeChange('parallel')}
                />
                Parallel (All at once)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Select Collaborator Agents</label>
            {availableCollaborators.length === 0 ? (
              <div className="empty-state">
                No available agents for collaboration. Please create some first.
              </div>
            ) : (
              <div className="collaborators-list">
                {availableCollaborators.map(agent => (
                  <div key={agent.id} className="collaborator-item">
                    <input
                      type="checkbox"
                      id={`collaborator-${agent.id}`}
                      checked={formData.collaborators?.includes(agent.id) || false}
                      onChange={() => handleCollaboratorToggle(agent.id)}
                    />
                    <label htmlFor={`collaborator-${agent.id}`}>
                      {agent.name} <span className="agent-type">({agent.type})</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
            {errors.collaborators && (
              <div className="error-message">{errors.collaborators}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="synthesize-results">
              <input
                type="checkbox"
                id="synthesize-results"
                checked={formData.configuration?.synthesizeResults || false}
                onChange={(e) => handleConfigChange('synthesizeResults', e.target.checked)}
              />
              Synthesize Results
            </label>
            <p className="helper-text">
              When enabled, the collaborative agent will combine results from all collaborators into a cohesive report.
            </p>
          </div>
        </>
      )}

      <div className="form-actions">
        <Button type="submit">
          {initialValues?.id ? 'Update Agent' : 'Create Agent'}
        </Button>
      </div>
    </form>
  );
};

export default AgentForm;