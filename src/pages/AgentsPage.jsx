import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import useDataStore from '../stores/dataStore';
import AgentList from '../components/agents/AgentList';
import ExecutionProgress from '../components/agents/ExecutionProgress';
import Modal from '../components/shared/Modal';
import Button from '../components/shared/Button';
import { executeAgent } from '../services/agentService';
import { generateReport } from '../services/reportService';
import useReportStore from '../stores/reportStore';
import useAgentStore from '../stores/agentStore';
import { useNavigate } from 'react-router-dom';
import OpenAISettings from '../components/agents/OpenAISettings';

const AgentsPage = () => {
  const dataStore = useDataStore();
  const reportStore = useReportStore();
  const agentStore = useAgentStore();
  
  const { dataSources } = dataStore;
  const { addReport } = reportStore;
  const { 
    updateAgent, 
    startAgent,
    stopAgent,
    agents
  } = agentStore;
  
  // Local execution state since we don't have these in Zustand yet
  const [executionProgress, setExecutionProgress] = useState({
    progress: 0,
    stage: 'Not started',
    logs: []
  });
  
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Reset execution state when leaving the page
  useEffect(() => {
    return () => {
      if (isExecuting) {
        // Reset local execution progress
        setExecutionProgress({
          progress: 0,
          stage: 'Not started',
          logs: []
        });
      }
    };
  }, [isExecuting]);

  const handleExecuteAgent = (agent, options = {}) => {
    // If options are provided, skip the modal and execute directly
    if (options && (options.useOpenAI !== undefined)) {
      setSelectedAgent(agent);
      
      // Get the first data source
      if (dataSources && dataSources.length > 0) {
        const dataSource = dataSources[0];
        setSelectedDataSource(dataSource);
        
        // Execute with the provided options
        executeAgentWithOptions(agent, dataSource, options);
      } else {
        setError('No data sources available. Please create a data source first.');
        setShowExecuteModal(true);
      }
    } else {
      // Show the modal for data source selection
      setSelectedAgent(agent);
      setShowExecuteModal(true);
    }
  };

  const handleSelectDataSource = (dataSource) => {
    setSelectedDataSource(dataSource);
  };

  // Execute agent with OpenAI options
  const executeAgentWithOptions = async (agent, dataSource, options = {}) => {
    if (!agent || !dataSource) {
      setError('Agent and data source are required');
      return;
    }
    
    setIsExecuting(true);
    setError(null);
    setShowExecuteModal(true);
    
    try {
      console.log('Starting execution with:', {
        agent: agent.name, 
        dataSource: dataSource.name,
        options
      });
      
      // Update agent status
      const updatedAgent = {
        ...agent,
        status: 'running',
        lastRun: new Date().toISOString()
      };
      
      // Update in localStorage and store
      updateAgentInLocalStorage(updatedAgent);
      await startAgent(agent.id);
      
      // Reset progress logs
      setExecutionProgress({
        progress: 0,
        stage: 'Starting',
        logs: ['Initiating agent execution...']
      });
      
      // Progress tracking callbacks
      const onProgress = (progress) => {
        setExecutionProgress(prev => ({
          progress: progress.progress || prev.progress,
          stage: progress.stage || prev.stage,
          logs: prev.logs
        }));
      };
      
      const onLog = (message) => {
        setExecutionProgress(prev => ({
          progress: prev.progress,
          stage: prev.stage,
          logs: [...prev.logs, message]
        }));
      };
      
      // Execute the agent with real service
      const results = await executeAgent(
        agent, 
        dataSource, 
        {
          onProgress,
          onLog,
          useOpenAI: options.useOpenAI,
          openAIKey: options.openAIKey,
          model: options.model,
          temperature: options.temperature
        }
      );
      
      console.log('Agent execution completed:', results);
      
      // Update progress to completed
      setExecutionProgress(prev => ({
        progress: 100,
        stage: 'Completed',
        logs: [
          ...prev.logs,
          'Analysis complete',
          `Execution method: ${results.executionMethod || 'standard'}`
        ]
      }));
      
      // Generate report from results
      const report = generateReport(results, agent, dataSource);
      console.log('Generated report:', report);
      
      // Save report
      addReport(report)
        .then(savedReport => {
          console.log('Report saved successfully:', savedReport);
          
          // Update agent status to completed
          const completedAgent = {
            ...agent,
            status: 'completed',
            lastRun: new Date().toISOString()
          };
          
          // Update in store and localStorage
          updateAgent(completedAgent);
          updateAgentInLocalStorage(completedAgent);
          
          // Reset UI state
          setShowExecuteModal(false);
          setSelectedAgent(null);
          setSelectedDataSource(null);
          setIsExecuting(false);
          
          // Navigate to reports page
          navigate('/reports');
        })
        .catch(error => {
          console.error('Failed to save report:', error);
          setError('Failed to save report: ' + (error.message || 'Unknown error'));
          setIsExecuting(false);
          
          // Update agent status to error
          handleExecutionError(agent, error);
        });
      
    } catch (error) {
      console.error('Execution error:', error);
      handleExecutionError(agent, error);
    }
  };
  
  // Helper to update agent in localStorage
  const updateAgentInLocalStorage = (agent) => {
    if (!agent || !agent.id) return;
    
    const currentAgents = JSON.parse(localStorage.getItem('agents') || '[]');
    const updatedAgents = currentAgents.map(a => 
      a.id === agent.id ? agent : a
    );
    localStorage.setItem('agents', JSON.stringify(updatedAgents));
  };
  
  // Handle execution errors
  const handleExecutionError = (agent, error) => {
    setError(error.message || 'An unexpected error occurred');
    
    // Update agent status to error
    const errorAgent = {
      ...agent,
      status: 'error',
      lastRun: new Date().toISOString()
    };
    
    // Update in store and localStorage
    updateAgent(errorAgent);
    updateAgentInLocalStorage(errorAgent);
    
    setExecutionProgress(prev => ({
      progress: 0,
      stage: 'Error',
      logs: [...prev.logs, `Error: ${error.message || 'Unknown error'}`]
    }));
    
    setIsExecuting(false);
  };
  
  // Handler for the Run Execution button in the modal
  const handleRunExecution = async () => {
    if (!selectedAgent || !selectedDataSource) {
      setError('Please select a data source');
      return;
    }
    
    // Execute with default options
    executeAgentWithOptions(selectedAgent, selectedDataSource, { useOpenAI: false });
  };

  const handleExportAgents = () => {
    // Use a standard JavaScript export function for now
    const agentsJSON = JSON.stringify([...useAgentStore.getState().agents], null, 2);
    const blob = new Blob([agentsJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `agents-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportAgents = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const fileContents = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        
        const importedAgents = JSON.parse(fileContents);
        
        if (Array.isArray(importedAgents)) {
          // Import each agent
          for (const agent of importedAgents) {
            if (agent.id && agent.name) {
              await useAgentStore.getState().addAgent(agent);
            }
          }
          
          // Reset the file input so the same file can be selected again if needed
          event.target.value = null;
        }
      } catch (err) {
        console.error('Error importing agents:', err);
        setError('Failed to import agents: ' + err.message);
      }
    }
  };

  return (
    <Layout>
      <div className="agents-page">
        <div className="page-header">
          <h1>AI Agents</h1>
          <div className="header-actions">
            <button 
              onClick={() => {
                // Create a sample data source
                const sampleData = [];
                
                // Generate sample data
                for (let i = 0; i < 20; i++) {
                  sampleData.push({
                    id: i + 1,
                    name: `Product ${i + 1}`,
                    category: ['Electronics', 'Clothing', 'Home', 'Books'][Math.floor(Math.random() * 4)],
                    price: Math.floor(Math.random() * 100) + 10,
                    quantity: Math.floor(Math.random() * 50) + 1
                  });
                }
                
                // Create a data source object
                const dataSource = {
                  id: `sample-data-${Date.now()}`,
                  name: 'Sample Data',
                  description: 'Sample data for testing',
                  data: sampleData,
                  columns: ['id', 'name', 'category', 'price', 'quantity'],
                  metadata: {
                    rowCount: sampleData.length,
                    columnCount: 5
                  }
                };
                
                // Store in localStorage
                const existingDataSources = JSON.parse(localStorage.getItem('dataSources') || '[]');
                localStorage.setItem('dataSources', JSON.stringify([...existingDataSources, dataSource]));
                
                // Refresh the page
                alert('Sample data source created! Refreshing page...');
                window.location.reload();
              }}
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Sample Data
            </button>
            <button 
              onClick={() => {
                // Create a sample agent
                const agent = {
                  id: `agent-${Date.now()}`,
                  name: 'Data Analyzer Agent',
                  description: 'Analyzes data and creates reports with visualizations',
                  type: 'visualizer',
                  status: 'active',
                  capabilities: ['data-analysis', 'chart-generation', 'statistical-analysis'],
                  createdAt: new Date().toISOString(),
                  lastRun: null
                };
                
                // Store in localStorage
                const existingAgents = JSON.parse(localStorage.getItem('agents') || '[]');
                localStorage.setItem('agents', JSON.stringify([...existingAgents, agent]));
                
                // Refresh the page
                alert('Sample agent created! Refreshing page...');
                window.location.reload();
              }}
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Sample Agent
            </button>
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
            <Button 
              onClick={() => {
                const currentMode = localStorage.getItem('offline_mode') === 'true';
                localStorage.setItem('offline_mode', (!currentMode).toString());
                alert(`Offline mode ${!currentMode ? 'enabled' : 'disabled'}. Page will reload.`);
                window.location.reload();
              }} 
              variant={localStorage.getItem('offline_mode') === 'true' ? 'primary' : 'secondary'}
            >
              {localStorage.getItem('offline_mode') === 'true' ? 'Disable Offline Mode' : 'Enable Offline Mode'}
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
          onClose={() => isExecuting ? null : setShowExecuteModal(false)}
          title={isExecuting ? `Executing: ${selectedAgent?.name}` : "Execute Agent"}
          size="large"
        >
          <div className="execute-agent-modal">
            {!isExecuting ? (
              // Pre-execution configuration
              <>
                <p>Selected Agent: <strong>{selectedAgent?.name}</strong></p>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Select Data Source</label>
                  <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                    {dataSources.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', background: '#f5f5f5' }}>
                        <p>No data sources available. Please upload a CSV file first.</p>
                      </div>
                    ) : (
                      dataSources.filter(ds => ds && typeof ds === 'object' && ds.id).map(ds => (
                        <div 
                          key={ds.id}
                          style={{ 
                            padding: '15px', 
                            borderBottom: '1px solid #eee',
                            background: selectedDataSource?.id === ds.id ? '#e6f7ff' : 'white',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSelectDataSource(ds)}
                        >
                          <h4 style={{ margin: 0, marginBottom: '5px' }}>{ds.name || 'Unnamed Data Source'}</h4>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            {ds.type || 'Unknown'} - {ds.metadata?.rowCount || 0} rows, {ds.metadata?.columnCount || 0} columns
                          </p>
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
                
                <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      background: selectedDataSource ? '#4a69bd' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedDataSource ? 'pointer' : 'not-allowed'
                    }}
                    onClick={selectedDataSource ? handleRunExecution : undefined}
                    disabled={!selectedDataSource}
                  >
                    Execute Agent
                  </button>
                  <button
                    style={{
                      padding: '8px 16px',
                      background: '#ddd',
                      color: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowExecuteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              // Execution progress display
              <>
                <ExecutionProgress progress={executionProgress} />
                
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default AgentsPage;