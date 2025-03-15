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
      console.log('Starting execution with:', {
        agent: selectedAgent.name, 
        dataSource: selectedDataSource.name
      });
      
      // Update the agent status directly and save to localStorage
      const updatedAgent = {
        ...selectedAgent,
        status: 'running',
        lastRun: new Date().toISOString()
      };
      
      // Manually update agents in localStorage
      const currentAgents = JSON.parse(localStorage.getItem('agents') || '[]');
      const updatedAgents = currentAgents.map(agent => 
        agent.id === selectedAgent.id ? updatedAgent : agent
      );
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      
      // Also update in store
      await startAgent(selectedAgent.id);
      
      // Simulate execution progress
      let progress = 0;
      const stages = [
        'Initializing',
        'Loading data',
        'Analyzing data structure',
        'Processing data',
        'Generating insights',
        'Creating visualizations'
      ];
      
      // Update progress periodically
      const progressUpdater = setInterval(() => {
        progress += 5;
        if (progress <= 100) {
          const currentStageIndex = Math.min(
            Math.floor(progress / (100 / stages.length)),
            stages.length - 1
          );
          
          setExecutionProgress({
            progress,
            stage: stages[currentStageIndex],
            logs: [
              ...executionProgress.logs,
              ...(progress % 20 === 0 ? 
                [`${stages[currentStageIndex]} at ${progress}%`] : 
                [])
            ]
          });
        } else {
          clearInterval(progressUpdater);
        }
      }, 300);
      
      // Simulate execution completion
      setTimeout(() => {
        clearInterval(progressUpdater);
        
        // Ensure 100% progress
        setExecutionProgress({
          progress: 100,
          stage: 'Completed',
          logs: [
            ...executionProgress.logs,
            'Analysis complete',
            'Found patterns in data',
            'Generated insights from analysis'
          ]
        });
        
        // Determine what visualizations to create based on agent type/capabilities
        let visualizations = [];
        
        // If agent is a visualizer or has visualization capabilities, add some sample visualizations
        if (selectedAgent.type === 'visualizer' || 
            (selectedAgent.capabilities && 
             (Array.isArray(selectedAgent.capabilities) ? 
              selectedAgent.capabilities.includes('chart-generation') : 
              selectedAgent.capabilities.includes('chart-generation')))) {
          
          console.log('Agent has visualization capabilities, adding sample charts');
          
          // Create sample bar chart
          visualizations.push({
            type: 'bar',
            data: [
              { name: 'Electronics', value: 450 },
              { name: 'Clothing', value: 300 },
              { name: 'Home', value: 150 },
              { name: 'Books', value: 100 }
            ],
            config: {
              title: 'Sales by Category',
              xAxisKey: 'name',
              valueKey: 'value'
            }
          });
          
          // Create sample line chart if there's data with dates
          if (selectedDataSource.data && selectedDataSource.data.some(item => item.date)) {
            visualizations.push({
              type: 'line',
              data: [
                { name: 'Jan', value: 120 },
                { name: 'Feb', value: 150 },
                { name: 'Mar', value: 130 },
                { name: 'Apr', value: 200 },
                { name: 'May', value: 180 },
                { name: 'Jun', value: 190 },
                { name: 'Jul', value: 210 }
              ],
              config: {
                title: 'Monthly Trend',
                xAxisKey: 'name',
                valueKey: 'value'
              }
            });
          }
        }
        
        // Generate report
        const results = {
          success: true,
          agentId: selectedAgent.id,
          dataSourceId: selectedDataSource.id,
          timestamp: new Date().toISOString(),
          summary: `Analysis of ${selectedDataSource.name} completed successfully`,
          insights: [
            `${selectedAgent.name} analyzed ${selectedDataSource.name} successfully`,
            'Found patterns in the data',
            'Generated insights based on the analysis'
          ],
          visualizations: visualizations
        };
        
        // Generate report
        const report = generateReport(results, selectedAgent, selectedDataSource);
        console.log('Generated report:', report);
        
        // Add to reports and also save directly to localStorage
        addReport(report)
          .then(savedReport => {
            console.log('Report saved successfully:', savedReport);
            
            // Update agent status to completed
            const completedAgent = {
              ...selectedAgent,
              status: 'completed',
              lastRun: new Date().toISOString()
            };
            
            // Update in store
            updateAgent(completedAgent);
            
            // Also update directly in localStorage
            const currentAgents = JSON.parse(localStorage.getItem('agents') || '[]');
            const updatedAgents = currentAgents.map(agent => 
              agent.id === selectedAgent.id ? completedAgent : agent
            );
            localStorage.setItem('agents', JSON.stringify(updatedAgents));
            
            // Close modal and reset state
            setShowExecuteModal(false);
            setSelectedAgent(null);
            setSelectedDataSource(null);
            setIsExecuting(false);
            
            // Navigate to the reports page
            navigate('/reports');
          })
          .catch(error => {
            console.error('Failed to save report:', error);
            setError('Failed to save report. Please try again.');
            setIsExecuting(false);
          });
      }, 5000);
      
      // Set a timeout to prevent UI from being stuck
      setTimeout(() => {
        if (isExecuting) {
          setError('Execution timed out. Taking longer than expected.');
          console.error('Execution timeout - current progress:', executionProgress);
          
          // Update agent status to error
          const errorAgent = {
            ...selectedAgent,
            status: 'error',
            lastRun: new Date().toISOString()
          };
          
          // Update in store
          updateAgent(errorAgent);
          
          // Also update directly in localStorage
          const currentAgents = JSON.parse(localStorage.getItem('agents') || '[]');
          const updatedAgents = currentAgents.map(agent => 
            agent.id === selectedAgent.id ? errorAgent : agent
          );
          localStorage.setItem('agents', JSON.stringify(updatedAgents));
          
          setIsExecuting(false);
        }
      }, 60000); // 60-second timeout
      
    } catch (err) {
      console.error('Execution error:', err);
      setError(err.message || 'An unexpected error occurred');
      
      // Update agent status to error
      const errorAgent = {
        ...selectedAgent,
        status: 'error',
        lastRun: new Date().toISOString()
      };
      
      // Update in store
      updateAgent(errorAgent);
      
      // Also update directly in localStorage
      const currentAgents = JSON.parse(localStorage.getItem('agents') || '[]');
      const updatedAgents = currentAgents.map(agent => 
        agent.id === selectedAgent.id ? errorAgent : agent
      );
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      
      setExecutionProgress({
        progress: 0,
        stage: 'Error',
        logs: [...executionProgress.logs, `Error: ${err.message}`]
      });
      setIsExecuting(false);
    }
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