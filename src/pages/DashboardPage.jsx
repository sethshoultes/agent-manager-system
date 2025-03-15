import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAgentStore from '../stores/agentStore';
import useDataStore from '../stores/dataStore';
import useReportStore from '../stores/reportStore';
import Layout from '../components/layout/Layout';
import { executeAgent } from '../services/agentService';
import { generateReport } from '../services/reportService';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import Card from '../components/shared/Card';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import QuickActions from '../components/dashboard/QuickActions';
import './DashboardPage.css';

const DashboardPage = () => {
  // Use Zustand stores
  const agentStore = useAgentStore();
  const dataStore = useDataStore();
  const reportStore = useReportStore();
  
  // Extract values from stores
  const { agents, updateAgent } = agentStore;
  const { dataSources } = dataStore;
  const { reports, addReport } = reportStore;
  
  // UI state
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [systemStatus, setSystemStatus] = useState('initializing');
  const [apiStatus, setApiStatus] = useState('checking');

  // Check API status on load
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Simple check for API connectivity
        const response = await fetch('/health');
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (err) {
        console.log('API health check failed:', err);
        setApiStatus('disconnected');
      }
      
      // Set overall system status
      setSystemStatus('ready');
    };
    
    checkApiStatus();
  }, []);

  const handleExecuteAgent = async () => {
    if (!selectedAgent || !selectedDataSource) {
      setError('Please select both an agent and a data source');
      return;
    }

    setIsExecuting(true);
    setError(null);
    
    // Set agent status to running
    await updateAgent({
      ...selectedAgent,
      status: 'running',
      lastRun: new Date().toISOString()
    });

    try {
      const results = await executeAgent(selectedAgent, selectedDataSource);
      
      if (results.success) {
        // Update agent status to completed
        await updateAgent({
          ...selectedAgent,
          status: 'completed',
          lastRun: new Date().toISOString()
        });
        
        const report = generateReport(results, selectedAgent, selectedDataSource);
        setCurrentReport(report);
        
        // Add to reports store
        try {
          await addReport(report);
        } catch (err) {
          console.error('Error saving report:', err);
          // Continue anyway since we have the report locally
        }
      } else {
        // Update agent status to error
        await updateAgent({
          ...selectedAgent,
          status: 'error',
          lastRun: new Date().toISOString()
        });
        setError(results.error || 'Failed to execute agent');
      }
    } catch (err) {
      // Update agent status to error
      await updateAgent({
        ...selectedAgent,
        status: 'error',
        lastRun: new Date().toISOString()
      });
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Dashboard</h1>
            <div className="system-status">
              <span className={`status-indicator ${apiStatus}`}></span>
              <span className="status-text">
                {apiStatus === 'connected' ? 'API Connected' : 
                 apiStatus === 'disconnected' ? 'Using Local Storage' : 
                 apiStatus === 'error' ? 'API Error' : 
                 'Checking Connection...'}
              </span>
            </div>
          </div>
          <div className="header-right">
            <Button 
              onClick={() => setShowModal(true)}
              disabled={isExecuting}
            >
              Execute Agent
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="dashboard-stats">
          <Card title="System Overview" className="stats-card">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{Array.isArray(agents) ? agents.length : 0}</div>
                <div className="stat-label">Agents</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{Array.isArray(dataSources) ? dataSources.length : 0}</div>
                <div className="stat-label">
                  <Link to="/data" style={{ color: 'blue', textDecoration: 'underline' }}>
                    Data Sources
                  </Link>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{Array.isArray(reports) ? reports.length : 0}</div>
                <div className="stat-label">Reports</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {isExecuting ? (
                    <span className="status-executing">Working</span>
                  ) : systemStatus === 'ready' ? (
                    <span className="status-ready">Ready</span>
                  ) : (
                    <span className="status-initializing">Loading</span>
                  )}
                </div>
                <div className="stat-label">Status</div>
              </div>
            </div>
          </Card>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Test Navigation Buttons */}
        <div style={{ margin: '20px 0', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h3>Navigation</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Link to="/data">
              <Button>Go to Data Page</Button>
            </Link>
            <Link to="/agents">
              <Button variant="secondary">Go to Agents Page</Button>
            </Link>
            <Link to="/reports">
              <Button variant="secondary">Go to Reports Page</Button>
            </Link>
            <Link to="/test-menu">
              <Button variant="tertiary">System Admin Panel</Button>
            </Link>
            <Link to="/settings">
              <Button variant="tertiary">AI Provider Settings</Button>
            </Link>
          </div>
        </div>
        
        {/* Quick Actions Component */}
        <QuickActions 
          onExecuteAgent={() => setShowModal(true)}
        />

        {/* Analytics Charts */}
        <DashboardAnalytics 
          agents={agents} 
          dataSources={dataSources} 
          reports={reports}
        />

        {/* Report Preview Section */}
        {currentReport && (
          <Card title="Recently Generated Report" className="report-preview-card">
            <div className="report-preview">
              <h3>{currentReport.name}</h3>
              <p className="report-description">{currentReport.description}</p>
              
              <div className="report-insights">
                <h4>Key Insights</h4>
                {currentReport.insights && currentReport.insights.length > 0 ? (
                  <ul>
                    {currentReport.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No insights available</p>
                )}
              </div>
              
              <div className="report-summary">
                <h4>Summary</h4>
                <div className="summary-content">
                  {currentReport.summary}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Execute Agent Modal */}
        <Modal 
          show={showModal} 
          onClose={() => !isExecuting && setShowModal(false)}
          title="Execute Agent"
          size="large"
        >
          <div className="execute-agent-form">
            <div className="form-group">
              <label>Select Agent</label>
              <div className="agent-selection">
                {Array.isArray(agents) && agents.length > 0 ? (
                  agents.map(agent => (
                    agent && (
                      <div 
                        key={agent.id} 
                        className={`agent-option ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <h4>{agent.name || 'Unnamed Agent'}</h4>
                        <p>{agent.type || 'Unknown Type'}</p>
                      </div>
                    )
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No agents available. Please create an agent first.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Select Data Source</label>
              <div className="datasource-selection">
                {Array.isArray(dataSources) && dataSources.length > 0 ? (
                  dataSources.map(ds => (
                    ds && (
                      <div 
                        key={ds.id} 
                        className={`datasource-option ${selectedDataSource?.id === ds.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDataSource(ds)}
                      >
                        <h4>{ds.name || 'Unnamed Source'}</h4>
                        <p>{ds.type || 'Unknown'} - {ds.metadata?.rowCount || 0} rows</p>
                      </div>
                    )
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No data sources available. Please upload a data source first.</p>
                  </div>
                )}
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
                onClick={() => !isExecuting && setShowModal(false)}
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