import { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import OpenAISettings from './OpenAISettings';
import Modal from '../shared/Modal';
import useDataStore from '../../stores/dataStore';

const AgentCard = ({ agent, onDelete, onEdit, onExecute }) => {
  // Get data sources from the store
  const dataStore = useDataStore();
  const dataSources = dataStore.dataSources || [];
  
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
    temperature: 0.2
  });

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
      openAIKey: openAISettings.apiKey,
      model: openAISettings.model,
      temperature: openAISettings.temperature
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
        className={`agent-card ${getStatusClass()}`}
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
            <span className="agent-type">{agent.type}</span>
            <span className="agent-status">{agent.status}</span>
          </div>
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
        title="Execute Agent"
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
          
          <div className="execute-actions" style={{ marginTop: '20px' }}>
            <Button 
              onClick={handleExecuteWithAPI}
              disabled={!openAISettings.apiKey || !selectedDataSource}
              style={{
                opacity: (!openAISettings.apiKey || !selectedDataSource) ? 0.5 : 1
              }}
            >
              Execute with OpenAI
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
              <p><strong>Note:</strong> An OpenAI API key is required to use AI-powered analysis.</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AgentCard;