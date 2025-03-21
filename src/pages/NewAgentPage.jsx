import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AgentForm from '../components/agents/AgentForm';
import useAgentStore from '../stores/agentStore';

const NewAgentPage = () => {
  const agentStore = useAgentStore();
  const { addAgent } = agentStore;
  const navigate = useNavigate();

  const handleCreateAgent = (agent) => {
    addAgent(agent);
    navigate('/agents');
  };

  return (
    <Layout>
      <div className="new-agent-page">
        <div className="page-header">
          <h1>Create New Agent</h1>
        </div>
        
        <div className="agent-form-container">
          <AgentForm onSubmit={handleCreateAgent} />
        </div>
      </div>
    </Layout>
  );
};

export default NewAgentPage;