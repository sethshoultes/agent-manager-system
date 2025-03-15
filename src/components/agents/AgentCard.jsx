import { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import OpenAISettings from './OpenAISettings';
import Modal from '../shared/Modal';

const AgentCard = ({ agent, onDelete, onEdit, onExecute }) => {
  const [showModal, setShowModal] = useState(false);
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
    setShowModal(false);
    onExecute(agent, { 
      useOpenAI: true,
      openAIKey: openAISettings.apiKey,
      model: openAISettings.model,
      temperature: openAISettings.temperature
    });
  };
  
  const handleExecuteWithoutAPI = () => {
    setShowModal(false);
    onExecute(agent, { useOpenAI: false });
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
          <h4>Execution Method</h4>
          <p>Choose how you want to execute this agent:</p>
          
          <OpenAISettings
            onSettingsChange={handleOpenAISettingsChange}
          />
          
          <div className="execute-actions">
            <Button 
              onClick={handleExecuteWithAPI}
              disabled={!openAISettings.apiKey}
            >
              Execute with OpenAI
            </Button>
            <Button 
              variant="secondary"
              onClick={handleExecuteWithoutAPI}
            >
              Execute with Mock Data
            </Button>
            <Button 
              variant="tertiary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
          
          {!openAISettings.apiKey && (
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