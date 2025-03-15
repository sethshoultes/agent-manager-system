import React, { useState } from 'react';
import useAgentStore from '../../stores/agentStore';
import AgentCard from './AgentCard';
import AgentForm from './AgentForm';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

const AgentList = ({ onExecuteAgent }) => {
  const agentStore = useAgentStore();
  const { agents, deleteAgent } = agentStore;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);

  const handleAddAgent = () => {
    setShowAddModal(true);
  };

  const handleEditAgent = (agent) => {
    setCurrentAgent(agent);
    setShowEditModal(true);
  };

  const handleDeleteAgent = (id) => {
    // Optional: Add a confirmation dialog here
    deleteAgent(id);
  };

  const handleAgentFormSubmit = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentAgent(null);
  };

  const filterByType = (type) => {
    if (!agents || !Array.isArray(agents)) return [];
    return agents.filter(agent => agent && agent.type === type);
  };

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <h2>Available Agents</h2>
        <Button onClick={handleAddAgent}>Add New Agent</Button>
      </div>

      {!agents || !Array.isArray(agents) || agents.length === 0 ? (
        <div className="empty-state">
          <p>No agents available. Create an agent to get started.</p>
          <Button onClick={handleAddAgent}>Create Your First Agent</Button>
        </div>
      ) : (
        <>
          {/* Analyzer Agents */}
          {filterByType('analyzer').length > 0 && (
            <div className="agent-section">
              <h3>Data Analyzers</h3>
              <div className="agents-grid">
                {filterByType('analyzer').map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={handleDeleteAgent}
                    onEdit={handleEditAgent}
                    onExecute={onExecuteAgent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Visualizer Agents */}
          {filterByType('visualizer').length > 0 && (
            <div className="agent-section">
              <h3>Data Visualizers</h3>
              <div className="agents-grid">
                {filterByType('visualizer').map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={handleDeleteAgent}
                    onEdit={handleEditAgent}
                    onExecute={onExecuteAgent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Summarizer Agents */}
          {filterByType('summarizer').length > 0 && (
            <div className="agent-section">
              <h3>Data Summarizers</h3>
              <div className="agents-grid">
                {filterByType('summarizer').map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={handleDeleteAgent}
                    onEdit={handleEditAgent}
                    onExecute={onExecuteAgent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Agent Types */}
          {(Array.isArray(agents) ? agents.filter(agent => agent && agent.type && !['analyzer', 'visualizer', 'summarizer'].includes(agent.type)) : []).length > 0 && (
            <div className="agent-section">
              <h3>Other Agents</h3>
              <div className="agents-grid">
                {(Array.isArray(agents) ? agents.filter(agent => agent && agent.type && !['analyzer', 'visualizer', 'summarizer'].includes(agent.type)) : []).map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={handleDeleteAgent}
                    onEdit={handleEditAgent}
                    onExecute={onExecuteAgent}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Agent Modal */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Agent"
      >
        <AgentForm
          onSubmit={handleAgentFormSubmit}
        />
      </Modal>

      {/* Edit Agent Modal */}
      <Modal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCurrentAgent(null);
        }}
        title="Edit Agent"
      >
        {currentAgent && (
          <AgentForm
            initialValues={currentAgent}
            onSubmit={handleAgentFormSubmit}
          />
        )}
      </Modal>
    </div>
  );
};

export default AgentList;