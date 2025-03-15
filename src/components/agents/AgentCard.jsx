import React from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

const AgentCard = ({ agent, onDelete, onEdit, onExecute }) => {
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

  return (
    <Card 
      title={agent.name}
      className={`agent-card ${getStatusClass()}`}
      footer={
        <div className="card-actions">
          {onExecute && (
            <Button
              onClick={() => onExecute(agent)}
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
  );
};

export default AgentCard;