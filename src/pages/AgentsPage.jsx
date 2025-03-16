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
import { createSampleDataset } from '../utils/dataUtils';

const AgentsPage = () => {
  const dataStore = useDataStore();
  const reportStore = useReportStore();
  const agentStore = useAgentStore();
  
  // Initialize data sources on component mount
  useEffect(() => {
    console.log("AgentsPage useEffect - Fetching data sources");
    const initializeDataSources = async () => {
      try {
        // Create sample data if no data exists
        if (window.localStorage) {
          const existingData = window.localStorage.getItem('dataSources');
          if (!existingData || JSON.parse(existingData).length === 0) {
            console.log("No data sources found in localStorage, creating sample data");
            const sampleDataset = createSampleDataset();
            
            // Force save the sample dataset directly to localStorage
            const sampleDataArray = [sampleDataset];
            window.localStorage.setItem('dataSources', JSON.stringify(sampleDataArray));
            console.log("Sample data saved directly to localStorage");
          }
        }
        
        // Now fetch the data sources (which should include our sample)
        await dataStore.fetchDataSources();
        console.log("Data sources fetched:", dataStore.dataSources);
      } catch (error) {
        console.error("Failed to initialize data sources:", error);
      }
    };
    
    initializeDataSources();
  }, []);
  
  // Get data sources directly from the store for better reactivity
  const dataSources = dataStore.dataSources || [];
  console.log("AgentsPage render - Data sources:", { count: dataSources.length, sources: dataSources });
  
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

  const handleExecuteAgent = (agent, dataSource, options = {}) => {
    console.log('Executing agent with data source:', { agent, dataSource, options });
    
    // Validate both agent and data source
    if (!agent) {
      setError('No agent provided for execution');
      return;
    }
    
    // If we have both agent and data source, execute directly
    if (agent && dataSource) {
      setSelectedAgent(agent);
      setSelectedDataSource(dataSource);
      executeAgentWithOptions(agent, dataSource, options);
    } else {
      // This should almost never happen since we now select the data source in the modal
      setError('Data source is required for execution');
    }
  };

  const handleSelectDataSource = (dataSource) => {
    console.log('Data source selected:', dataSource);
    // Set selected data source in the component state
    setSelectedDataSource(dataSource);
    
    // Force highlight the selected data source in the modal
    const elements = document.querySelectorAll('.data-source-item');
    elements.forEach(el => {
      if (el.dataset.id === dataSource.id) {
        el.style.background = '#e6f7ff';
        el.style.fontWeight = 'bold';
      } else {
        el.style.background = 'white';
        el.style.fontWeight = 'normal';
      }
    });
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
      
      // Check if a report is already included in the results
      if (results.reportId) {
        console.log('Report already created during execution:', results.reportId);
        
        // Just update the agent status to completed
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
      } else {
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
      }
      
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
    if (!selectedAgent) {
      setError('No agent selected. Please select an agent first.');
      return;
    }
    
    if (!selectedDataSource) {
      setError('Please select a data source to analyze');
      return;
    }
    
    // Check if data source has data
    if (!selectedDataSource.data) {
      setError('The selected data source does not contain any data to analyze.');
      return;
    }
    
    console.log('Running execution with:', {
      agent: selectedAgent.name,
      dataSource: selectedDataSource.name,
      dataSourceData: selectedDataSource.data ? `Has data (${Array.isArray(selectedDataSource.data) ? selectedDataSource.data.length : 'object'} entries)` : 'No data'
    });
    
    // Execute with default options but don't force useOpenAI: false
    // This will allow the system to use OpenAI if an API key is provided
    executeAgentWithOptions(selectedAgent, selectedDataSource, {});
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
                // Import the createSampleDataset function
                const sampleDataset = createSampleDataset();
                
                // Add the sample dataset to the data store
                dataStore.addDataSource(sampleDataset)
                  .then(() => {
                    alert('Sample data source created! The new data source is now available.');
                  })
                  .catch(error => {
                    console.error('Error adding sample data:', error);
                    alert('Error creating sample data source: ' + error.message);
                  });
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
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '16px' }}>
                    <span style={{ color: 'red' }}>*</span> Select Data Source (Required)
                  </label>
                  <div style={{ 
                    border: '2px solid #40a9ff', 
                    borderRadius: '4px', 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    boxShadow: '0 0 10px rgba(24, 144, 255, 0.2)'
                  }}>
                    {dataSources.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', background: '#f5f5f5' }}>
                        <p>No data sources available. Please upload a CSV file first.</p>
                      </div>
                    ) : (
                      dataSources.filter(ds => ds && typeof ds === 'object' && ds.id).map((ds, index) => (
                        <div 
                          key={`${ds.id}-${index}`}
                          className="data-source-item"
                          data-id={ds.id}
                          style={{ 
                            padding: '15px', 
                            borderBottom: '1px solid #eee',
                            background: selectedDataSource?.id === ds.id ? '#e6f7ff' : 'white',
                            cursor: 'pointer',
                            border: selectedDataSource?.id === ds.id ? '2px solid #1890ff' : '1px solid transparent',
                            borderRadius: '4px',
                            fontWeight: selectedDataSource?.id === ds.id ? 'bold' : 'normal'
                          }}
                          onClick={() => handleSelectDataSource(ds)}
                        >
                          <h4 style={{ margin: 0, marginBottom: '5px' }}>{ds.name || 'Unnamed Data Source'}</h4>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            {ds.type || 'Unknown'} - {ds.metadata?.rowCount || 0} rows, {ds.metadata?.columnCount || 0} columns
                          </p>
                          {selectedDataSource?.id === ds.id && (
                            <div style={{ color: '#1890ff', marginTop: '5px', fontSize: '14px' }}>
                              ✓ Selected for analysis
                            </div>
                          )}
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
                      padding: '12px 24px',
                      background: selectedDataSource ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedDataSource ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      boxShadow: selectedDataSource ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                    onClick={selectedDataSource ? handleRunExecution : undefined}
                    disabled={!selectedDataSource}
                  >
                    Execute Agent with Selected Data
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