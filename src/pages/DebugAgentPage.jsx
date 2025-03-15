import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/shared/Button';
import { createSampleDataset } from '../utils/dataUtils';
import { executeAgent } from '../services/agentService';

/**
 * A simplified debug version of the Agents page that focuses only on
 * executing agents with data sources.
 */
const DebugAgentPage = () => {
  // State for the entire page
  const [agents, setAgents] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [executionResults, setExecutionResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  // Load data on mount
  useEffect(() => {
    // Function to load data from localStorage
    const loadData = () => {
      try {
        // Load agents
        const agentsJson = localStorage.getItem('agents');
        if (agentsJson) {
          const loadedAgents = JSON.parse(agentsJson);
          setAgents(loadedAgents.filter(a => a && a.id));
          addLog('Loaded ' + loadedAgents.length + ' agents from localStorage');
        } else {
          addLog('No agents found in localStorage');
          // Create a sample agent
          createSampleAgent();
        }

        // Load data sources
        const dataSourcesJson = localStorage.getItem('dataSources');
        if (dataSourcesJson) {
          const loadedDataSources = JSON.parse(dataSourcesJson);
          setDataSources(loadedDataSources.filter(ds => ds && ds.id));
          addLog('Loaded ' + loadedDataSources.length + ' data sources from localStorage');
        } else {
          addLog('No data sources found in localStorage');
          // Create a sample data source
          createSampleDataSource();
        }
      } catch (error) {
        addLog('Error loading data: ' + error.message);
      }
    };

    loadData();
  }, []);

  // Add a log message
  const addLog = (message) => {
    setLogs(prevLogs => [...prevLogs, { time: new Date().toLocaleTimeString(), message }]);
  };

  // Create a sample agent
  const createSampleAgent = () => {
    addLog('Creating sample agent...');
    const agent = {
      id: 'sample-agent-' + Date.now(),
      name: 'Sample Agent',
      description: 'A sample agent for testing',
      type: 'analyzer',
      capabilities: ['statistical-analysis', 'trend-detection'],
      status: 'idle',
      createdAt: new Date().toISOString(),
      lastRun: null
    };

    // Save to localStorage and state
    try {
      const existingAgents = JSON.parse(localStorage.getItem('agents') || '[]');
      localStorage.setItem('agents', JSON.stringify([...existingAgents, agent]));
      setAgents(prevAgents => [...prevAgents, agent]);
      addLog('Sample agent created successfully');
    } catch (error) {
      addLog('Error creating sample agent: ' + error.message);
    }
  };

  // Create a sample data source
  const createSampleDataSource = () => {
    addLog('Creating sample data source...');
    try {
      const sampleDataset = createSampleDataset();
      const existingDataSources = JSON.parse(localStorage.getItem('dataSources') || '[]');
      localStorage.setItem('dataSources', JSON.stringify([...existingDataSources, sampleDataset]));
      setDataSources(prevDataSources => [...prevDataSources, sampleDataset]);
      addLog('Sample data source created successfully');
    } catch (error) {
      addLog('Error creating sample data source: ' + error.message);
    }
  };

  // Execute the selected agent with the selected data source
  const handleExecute = async () => {
    if (!selectedAgent) {
      setError('Please select an agent');
      return;
    }

    if (!selectedDataSource) {
      setError('Please select a data source');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setExecutionResults(null);
    addLog('Executing agent: ' + selectedAgent.name + ' with data source: ' + selectedDataSource.name);

    try {
      // Track progress with callback
      const onProgress = (progress) => {
        addLog('Progress: ' + progress.progress + '% - ' + progress.stage);
      };

      // Track logs with callback
      const onLog = (message) => {
        addLog('Agent log: ' + message);
      };

      // Execute the agent
      const results = await executeAgent(selectedAgent, selectedDataSource, {
        onProgress,
        onLog,
        forceOffline: true // For debugging, force offline mode
      });

      // Handle results
      setExecutionResults(results);
      addLog('Execution completed successfully');
      
      // Update agent status in localStorage
      try {
        const updatedAgent = {
          ...selectedAgent,
          status: 'completed',
          lastRun: new Date().toISOString()
        };
        
        const existingAgents = JSON.parse(localStorage.getItem('agents') || '[]');
        const updatedAgents = existingAgents.map(a => 
          a.id === updatedAgent.id ? updatedAgent : a
        );
        
        localStorage.setItem('agents', JSON.stringify(updatedAgents));
        setAgents(updatedAgents);
        addLog('Agent status updated in localStorage');
      } catch (error) {
        addLog('Error updating agent status: ' + error.message);
      }
    } catch (error) {
      setError('Execution failed: ' + error.message);
      addLog('Error during execution: ' + error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset the page state
  const handleReset = () => {
    setSelectedAgent(null);
    setSelectedDataSource(null);
    setExecutionResults(null);
    setError(null);
    addLog('State reset');
  };

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <h1>Debug Agent Execution</h1>
        
        {error && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Left column - Selection */}
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2>1. Select Agent</h2>
              {agents.length === 0 ? (
                <div>No agents available. <Button onClick={createSampleAgent}>Create Sample Agent</Button></div>
              ) : (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  maxHeight: '200px', 
                  overflowY: 'auto' 
                }}>
                  {agents.map(agent => (
                    <div 
                      key={agent.id}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        backgroundColor: selectedAgent?.id === agent.id ? '#e3f2fd' : 'white',
                        borderLeft: selectedAgent?.id === agent.id ? '4px solid #2196f3' : '4px solid transparent',
                      }}
                      onClick={() => {
                        setSelectedAgent(agent);
                        addLog('Selected agent: ' + agent.name);
                      }}
                    >
                      <h3 style={{ margin: '0 0 5px 0' }}>{agent.name}</h3>
                      <p style={{ margin: '0', fontSize: '14px' }}>{agent.description}</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                        Type: {agent.type}, Status: {agent.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h2>2. Select Data Source</h2>
              {dataSources.length === 0 ? (
                <div>No data sources available. <Button onClick={createSampleDataSource}>Create Sample Data</Button></div>
              ) : (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  maxHeight: '200px', 
                  overflowY: 'auto' 
                }}>
                  {dataSources.map(ds => (
                    <div 
                      key={ds.id}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        backgroundColor: selectedDataSource?.id === ds.id ? '#e8f5e9' : 'white',
                        borderLeft: selectedDataSource?.id === ds.id ? '4px solid #4caf50' : '4px solid transparent',
                      }}
                      onClick={() => {
                        setSelectedDataSource(ds);
                        addLog('Selected data source: ' + ds.name);
                        // Log data source details
                        if (ds.data) {
                          addLog(`Data source has ${Array.isArray(ds.data) ? ds.data.length : 'unknown'} records`);
                        } else {
                          addLog('WARNING: Data source has no data array');
                        }
                      }}
                    >
                      <h3 style={{ margin: '0 0 5px 0' }}>{ds.name}</h3>
                      <p style={{ margin: '0', fontSize: '14px' }}>{ds.description || 'No description'}</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                        {ds.metadata?.rowCount || 0} rows, {ds.metadata?.columnCount || 0} columns
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h2>3. Execute</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button 
                  onClick={handleExecute}
                  disabled={!selectedAgent || !selectedDataSource || isExecuting}
                  style={{
                    backgroundColor: selectedAgent && selectedDataSource ? '#4caf50' : '#ccc',
                    color: 'white',
                    padding: '10px 20px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {isExecuting ? 'Executing...' : 'Execute Agent with Selected Data'}
                </Button>
                <Button onClick={handleReset} variant="secondary">Reset</Button>
              </div>
            </div>
          </div>
          
          {/* Right column - Results and Logs */}
          <div style={{ flex: '1' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2>Debug Logs</h2>
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                maxHeight: '200px', 
                overflowY: 'auto',
                backgroundColor: '#f5f5f5',
                fontFamily: 'monospace',
                padding: '10px'
              }}>
                {logs.map((log, index) => (
                  <div key={index} style={{ margin: '5px 0' }}>
                    <span style={{ color: '#999' }}>[{log.time}]</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
            
            {executionResults && (
              <div>
                <h2>Execution Results</h2>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '20px',
                  backgroundColor: '#fff8e1'
                }}>
                  <h3>Summary</h3>
                  <p>{executionResults.summary || 'No summary available'}</p>
                  
                  {executionResults.insights && executionResults.insights.length > 0 && (
                    <>
                      <h3>Insights</h3>
                      <ul>
                        {executionResults.insights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  <pre style={{ 
                    marginTop: '20px', 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {JSON.stringify(executionResults, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DebugAgentPage;