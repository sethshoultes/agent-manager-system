import { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import OpenAISettings from './OpenAISettings';
import Modal from '../shared/Modal';
import useDataStore from '../../stores/dataStore';
import useAgentStore from '../../stores/agentStore';

const AgentCard = ({ agent, onDelete, onEdit, onExecute }) => {
  // Get data sources from the store
  const dataStore = useDataStore();
  const agentStore = useAgentStore();
  const dataSources = dataStore.dataSources || [];
  const allAgents = agentStore.agents || [];
  
  // Initialize data sources on component mount
  useEffect(() => {
    dataStore.fetchDataSources();
  }, [dataStore]);
  
  // Component state
  const [showModal, setShowModal] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [openAISettings, setOpenAISettings] = useState({
    apiKey: '',
    model: 'gpt-4-turbo',
    temperature: 0.2,
    provider: 'openai'
  });
  const [collaborators, setCollaborators] = useState([]);
  const [isCollaborative, setIsCollaborative] = useState(false);
  
  // Check if this is a collaborative agent
  useEffect(() => {
    const collaborative = agent.type === 'collaborative' || agent.type === 'pipeline';
    setIsCollaborative(collaborative);
    
    if (collaborative && agent.collaborators) {
      // Fetch collaborator agent details
      const collaboratorAgents = agent.collaborators
        .map(id => allAgents.find(a => a.id === id))
        .filter(Boolean);  // Filter out any undefined agents
      
      setCollaborators(collaboratorAgents);
    }
  }, [agent, allAgents]);

  const getStatusClass = () => {
    switch (agent.status) {
      case 'running':
        return 'status-running';
      case 'completed':
        return 'status-completed';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };
  
  const handleOpenAISettingsChange = (settings) => {
    setOpenAISettings(settings);
  };
  
  const handleExecuteClick = () => {
    setShowModal(true);
  };
  
  const handleExecuteWithAPI = () => {
    if (!selectedDataSource) {
      alert('Please select a data source first');
      return;
    }
    
    setShowModal(false);
    onExecute(agent, selectedDataSource, { 
      useOpenAI: true,
      apiKey: openAISettings.apiKey,
      model: openAISettings.model,
      temperature: openAISettings.temperature,
      provider: openAISettings.provider,
      executionMode: agent.configuration?.executionMode || 'sequential',
      synthesizeResults: agent.configuration?.synthesizeResults !== false
    });
  };
  
  const handleExecuteWithoutAPI = () => {
    if (!selectedDataSource) {
      alert('Please select a data source first');
      return;
    }
    
    setShowModal(false);
    onExecute(agent, selectedDataSource, { useOpenAI: false });
  };

  return (
    <>
      <Card 
        title={agent.name}
        className={`agent-card ${getStatusClass()} ${isCollaborative ? 'collaborative-agent' : ''}`}
        footer={
          <div className="card-actions">
            {onExecute && (
              <Button
                onClick={handleExecuteClick}
                disabled={agent.status === 'running'}
              >
                Execute
              </Button>
            )}
            {onEdit && (
              <Button
                variant="secondary"
                onClick={() => onEdit(agent)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="danger"
                onClick={() => onDelete(agent.id)}
              >
                Delete
              </Button>
            )}
          </div>
        }
      >
        <div className="agent-info">
          <p>{agent.description}</p>
          <div className="agent-meta">
            <span className={`agent-type ${isCollaborative ? 'collaborative-type' : ''}`}>
              {agent.type}
              {isCollaborative && <span className="collaborative-badge">Collaborative</span>}
            </span>
            <span className="agent-status">{agent.status}</span>
          </div>
          
          {/* Display collaborator information for collaborative agents */}
          {isCollaborative && collaborators.length > 0 && (
            <div className="collaborator-info">
              <h4>Collaborators:</h4>
              <div className="collaborator-list">
                {collaborators.map(collab => (
                  <div key={collab.id} className="collaborator-item">
                    <span className="collaborator-name">{collab.name}</span>
                    <span className="collaborator-type">{collab.type}</span>
                  </div>
                ))}
              </div>
              <div className="execution-config">
                <div className="config-item">
                  <span className="config-label">Mode:</span>
                  <span className="config-value">{agent.configuration?.executionMode || 'sequential'}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Synthesize:</span>
                  <span className="config-value">{agent.configuration?.synthesizeResults !== false ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="agent-capabilities">
            {agent.capabilities && (() => {
              // Parse capabilities if it's a string
              const capabilitiesArray = typeof agent.capabilities === 'string' 
                ? JSON.parse(agent.capabilities) 
                : agent.capabilities;
              
              // Now we can safely map over the array
              return Array.isArray(capabilitiesArray) && capabilitiesArray.length > 0 
                ? capabilitiesArray.map(capability => (
                    <span key={capability} className="capability-tag">
                      {capability}
                    </span>
                  ))
                : null;
            })()}
          </div>
          <div className="agent-timestamp">
            <small>Created: {new Date(agent.createdAt).toLocaleString()}</small>
          </div>
        </div>
      </Card>
      
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)}
        title={`Execute Agent: ${agent.name}`}
      >
        <div className="execute-options">
          <h4>1. Select Data Source</h4>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            maxHeight: '150px', 
            overflowY: 'auto',
            marginBottom: '20px' 
          }}>
            {dataSources.length === 0 ? (
              <div style={{ padding: '15px', textAlign: 'center' }}>
                <p>No data sources available. Please add a data source first.</p>
              </div>
            ) : (
              dataSources.map(ds => (
                <div 
                  key={ds.id}
                  style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #eee',
                    background: selectedDataSource?.id === ds.id ? '#e6f7ff' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setSelectedDataSource(ds)}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{ds.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {ds.metadata?.rowCount || 0} rows, {ds.metadata?.columnCount || 0} columns
                    </div>
                  </div>
                  {selectedDataSource?.id === ds.id && (
                    <div style={{ color: '#1890ff', alignSelf: 'center' }}>✓</div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <h4>2. Execution Method</h4>
          <p>Choose how you want to execute this agent:</p>
          
          <OpenAISettings
            onSettingsChange={handleOpenAISettingsChange}
          />
          
          {/* Display collaborative agent information in execution modal */}
          {isCollaborative && collaborators.length > 0 && (
            <div className="collaborative-execution-info" style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f0f7ff', 
              borderRadius: '5px', 
              border: '1px solid #91caff' 
            }}>
              <h4 style={{ marginTop: 0 }}>Collaborative Execution</h4>
              <p>This agent will coordinate the execution of multiple collaborators:</p>
              
              <ul style={{ paddingLeft: '20px' }}>
                {collaborators.map(collab => (
                  <li key={collab.id}>
                    <strong>{collab.name}</strong> ({collab.type})
                  </li>
                ))}
              </ul>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <div>
                  <strong>Execution Mode:</strong> {agent.configuration?.executionMode || 'sequential'}
                </div>
                <div>
                  <strong>Synthesize Results:</strong> {agent.configuration?.synthesizeResults !== false ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          )}
          
          <div className="execute-actions" style={{ marginTop: '20px' }}>
            <Button 
              onClick={handleExecuteWithAPI}
              disabled={!openAISettings.apiKey || !selectedDataSource}
              style={{
                opacity: (!openAISettings.apiKey || !selectedDataSource) ? 0.5 : 1
              }}
            >
              Execute with {openAISettings.provider === 'openai' ? 'OpenAI' : 'OpenRouter'}
            </Button>
            <Button 
              variant="secondary"
              onClick={handleExecuteWithoutAPI}
              disabled={!selectedDataSource}
              style={{
                opacity: !selectedDataSource ? 0.5 : 1
              }}
            >
              Execute with Data Analysis
            </Button>
            <Button 
              variant="tertiary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
          
          {!selectedDataSource && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
              <p style={{ margin: 0 }}><strong>Required:</strong> Please select a data source to analyze.</p>
            </div>
          )}
          
          {!openAISettings.apiKey && selectedDataSource && (
            <div className="openai-notice">
              <p><strong>Note:</strong> An API key is required to use AI-powered analysis.</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AgentCard;