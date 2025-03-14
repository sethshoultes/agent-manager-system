import React, { useState } from 'react';
import { useAgentContext } from '../context/AgentContext';
import { useDataContext } from '../context/DataContext';
import Layout from '../components/layout/Layout';
import { executeAgent } from '../services/agentService';
import { generateReport } from '../services/reportService';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';

const DashboardPage = () => {
  const { agents, setAgentStatus } = useAgentContext();
  const { dataSources } = useDataContext();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleExecuteAgent = async () => {
    if (!selectedAgent || !selectedDataSource) {
      setError('Please select both an agent and a data source');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setAgentStatus(selectedAgent.id, 'running');

    try {
      const results = await executeAgent(selectedAgent, selectedDataSource);
      
      if (results.success) {
        setAgentStatus(selectedAgent.id, 'completed');
        const report = generateReport(results, selectedAgent, selectedDataSource);
        setCurrentReport(report);
      } else {
        setAgentStatus(selectedAgent.id, 'error');
        setError(results.error || 'Failed to execute agent');
      }
    } catch (err) {
      setAgentStatus(selectedAgent.id, 'error');
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="action-buttons">
            <Button 
              onClick={() => setShowModal(true)}
              disabled={isExecuting}
            >
              Execute Agent
            </Button>
          </div>
        </div>

        <div className="dashboard-summary">
          <div className="summary-card">
            <h3>Agents</h3>
            <p>{agents.length} available</p>
          </div>
          <div className="summary-card">
            <h3>Data Sources</h3>
            <p>{dataSources.length} available</p>
          </div>
          <div className="summary-card">
            <h3>Status</h3>
            <p>{isExecuting ? 'Running' : currentReport ? 'Report Ready' : 'Ready'}</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {currentReport && (
          <div className="report-preview">
            <h2>Report Preview</h2>
            <div className="report-summary">
              <h3>{currentReport.name}</h3>
              <p>{currentReport.description}</p>
              <pre>{currentReport.summary}</pre>
            </div>
          </div>
        )}

        <Modal 
          show={showModal} 
          onClose={() => setShowModal(false)}
          title="Execute Agent"
        >
          <div className="execute-agent-form">
            <div className="form-group">
              <label>Select Agent</label>
              <div className="agent-selection">
                {agents.map(agent => (
                  <div 
                    key={agent.id} 
                    className={`agent-option ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <h4>{agent.name}</h4>
                    <p>{agent.type}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Select Data Source</label>
              <div className="datasource-selection">
                {dataSources.map(ds => (
                  <div 
                    key={ds.id} 
                    className={`datasource-option ${selectedDataSource?.id === ds.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDataSource(ds)}
                  >
                    <h4>{ds.name}</h4>
                    <p>{ds.type} - {ds.metadata?.rowCount || 0} rows</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <Button 
                onClick={handleExecuteAgent}
                disabled={!selectedAgent || !selectedDataSource || isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Execute Agent'}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default DashboardPage;