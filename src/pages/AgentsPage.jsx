import React, { useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { useDataContext } from '../context/DataContext';
import AgentList from '../components/agents/AgentList';
import Modal from '../components/shared/Modal';
import Button from '../components/shared/Button';
import { executeAgent } from '../services/agentService';
import { generateReport } from '../services/reportService';
import { useReportContext } from '../context/ReportContext';
import { useAgentContext } from '../context/AgentContext';
import { useNavigate } from 'react-router-dom';

const AgentsPage = () => {
  const { dataSources } = useDataContext();
  const { addReport } = useReportContext();
  const { exportAgents, importAgents } = useAgentContext();
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleExecuteAgent = (agent) => {
    setSelectedAgent(agent);
    setShowExecuteModal(true);
  };

  const handleSelectDataSource = (dataSource) => {
    setSelectedDataSource(dataSource);
  };

  const handleRunExecution = async () => {
    if (!selectedAgent || !selectedDataSource) {
      setError('Please select a data source');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Update agent status
      if (selectedAgent) {
        selectedAgent.status = 'running';
      }

      // Execute agent
      const results = await executeAgent(selectedAgent, selectedDataSource);
      
      if (results.success) {
        // Generate report from results
        const report = generateReport(results, selectedAgent, selectedDataSource);
        
        // Add to reports
        addReport(report);
        
        // Close modal and navigate to report
        setShowExecuteModal(false);
        setSelectedAgent(null);
        setSelectedDataSource(null);
        
        // Navigate to the reports page
        navigate('/reports');
      } else {
        setError(results.error || 'Failed to execute agent');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsExecuting(false);
      if (selectedAgent) {
        selectedAgent.status = 'idle';
      }
    }
  };

  const handleExportAgents = () => {
    exportAgents();
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportAgents = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const success = await importAgents(file);
      if (success) {
        // Reset the file input so the same file can be selected again if needed
        event.target.value = null;
      }
    }
  };

  return (
    <Layout>
      <div className="agents-page">
        <div className="page-header">
          <h1>AI Agents</h1>
          <div className="header-actions">
            <Button 
              onClick={handleExportAgents} 
              variant="secondary"
              className="mr-2"
            >
              Export Agents
            </Button>
            <Button onClick={handleImportClick} variant="secondary">
              Import Agents
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportAgents} 
            />
          </div>
        </div>

        <AgentList onExecuteAgent={handleExecuteAgent} />
        
        {/* Execute Agent Modal */}
        <Modal
          show={showExecuteModal}
          onClose={() => setShowExecuteModal(false)}
          title="Execute Agent"
        >
          <div className="execute-agent-modal">
            <p>Selected Agent: <strong>{selectedAgent?.name}</strong></p>
            
            <div className="form-group">
              <label>Select Data Source</label>
              <div className="data-source-selection">
                {dataSources.length === 0 ? (
                  <div className="empty-state">
                    <p>No data sources available. Please upload a CSV file first.</p>
                  </div>
                ) : (
                  dataSources.map(ds => (
                    <div 
                      key={ds.id}
                      className={`data-source-option ${selectedDataSource?.id === ds.id ? 'selected' : ''}`}
                      onClick={() => handleSelectDataSource(ds)}
                    >
                      <h4>{ds.name}</h4>
                      <p>{ds.type} - {ds.metadata?.rowCount || 0} rows, {ds.metadata?.columnCount || 0} columns</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleRunExecution}
                disabled={isExecuting || !selectedDataSource}
              >
                {isExecuting ? 'Executing...' : 'Execute Agent'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowExecuteModal(false)}
                disabled={isExecuting}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default AgentsPage;