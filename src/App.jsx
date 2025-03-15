import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import AgentsPage from './pages/AgentsPage';
import NewAgentPage from './pages/NewAgentPage';
import DataPage from './pages/DataPage';
import DataUploadPage from './pages/DataUploadPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import useInitialize from './hooks/useInitialize';
import DebugReports from '../debug-reports';
import DebugAgentPage from './pages/DebugAgentPage';
import './App.css';

// System admin and testing component
const HomePage = () => {
  const [serverRunning, setServerRunning] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  
  // Check if API server is running
  React.useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Try to connect to API server
        const response = await fetch('http://localhost:3001/api/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 2000
        });
        
        if (response.ok) {
          setServerRunning(true);
        } else {
          setServerRunning(false);
        }
      } catch (error) {
        console.log('API server is not running:', error);
        setServerRunning(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkServerStatus();
  }, []);
  
  // Handle server start button click
  const handleStartServer = () => {
    // Open a new terminal and give command to start server
    alert('Please run the following command in your terminal:\n\nnpm run api\n\nOr navigate to the /api directory and run:\n\nnpm run dev');
    
    // In a real app, we might use electron or similar to start the server
    window.open('http://localhost:3001/api/health', '_blank');
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Agent Manager System Control Panel</h1>
      
      <div style={{ 
        background: serverRunning ? '#d4edda' : '#f8d7da', 
        color: serverRunning ? '#155724' : '#721c24',
        padding: '15px 20px', 
        borderRadius: '8px', 
        marginBottom: '30px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>
          {isChecking ? 'Checking API Server Status...' : (serverRunning ? 'API Server: RUNNING' : 'API Server: NOT RUNNING')}
        </h2>
        
        {!isChecking && !serverRunning && (
          <button 
            onClick={handleStartServer} 
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Start API Server
          </button>
        )}
        
        {!isChecking && !serverRunning && (
          <div style={{ fontSize: '14px', marginTop: '10px' }}>
            <p>The application is currently running in <strong>Offline Mode</strong>.</p>
            <p>All data is stored in your browser's localStorage.</p>
            <p>Start the API server to enable online mode and persistent data storage.</p>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
        <Link to="/dashboard" style={linkButtonStyle}>Dashboard</Link>
        <Link to="/agents" style={linkButtonStyle}>Agents</Link>
        <Link to="/data" style={linkButtonStyle}>Data</Link>
        <Link to="/reports" style={linkButtonStyle}>Reports</Link>
        <Link to="/debug-agent" style={{...linkButtonStyle, background: '#4CAF50'}}>Debug Agent</Link>
        <Link to="/debug-reports" style={{...linkButtonStyle, background: '#e74c3c'}}>Debug Reports</Link>
      </div>
      
      <div style={{ background: '#f4f6f8', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Quick Start Guide</h2>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Navigate to the <strong>Data</strong> page to create or upload datasets</li>
          <li>Go to the <strong>Agents</strong> page to create and configure AI agents</li>
          <li>Execute agents against your datasets to generate reports</li>
          <li>View results on the <strong>Reports</strong> page</li>
        </ol>
      </div>
      
      <div style={{ background: '#f0f0f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>OpenAI Integration</h3>
        <p>
          To use OpenAI-powered analysis, enter your API key when executing an agent. 
          This will enable advanced data analysis capabilities beyond the built-in functions.
        </p>
      </div>
      
      <div style={{ textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
        <p>This application is running in secure testing mode without authentication.</p>
      </div>
    </div>
  );
};

// Button style for links
const linkButtonStyle = {
  display: 'inline-block',
  padding: '12px 24px',
  background: '#4a69bd',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '4px',
  fontWeight: 'bold',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

// Private route component to protect authenticated routes
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppContent() {
  // Initialize all stores
  const { isLoading: dataLoading, counts } = useInitialize();
  
  // Enable offline mode by default if not set
  React.useEffect(() => {
    if (localStorage.getItem('offline_mode') === null) {
      localStorage.setItem('offline_mode', 'true');
      console.log('Offline mode enabled by default');
    }
  }, []);
  
  // Show loading state while initializing
  if (dataLoading) {
    return <div className="loading-screen">
      Loading application data...
      {counts && (
        <div className="loading-status">
          <p>Loaded: {counts.dataSources} data sources, {counts.agents} agents, {counts.reports} reports</p>
        </div>
      )}
    </div>;
  }

  return (
    <div className="app">
      <Routes>
        {/* Set Dashboard as homepage */}
        <Route path="/" element={<DashboardPage />} />
        
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Make all routes public for testing */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/new" element={<NewAgentPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/data/upload" element={<DataUploadPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Debug routes */}
        <Route path="/debug-reports" element={<DebugReports />} />
        <Route path="/debug-agent" element={<DebugAgentPage />} />
        <Route path="/test-menu" element={<HomePage />} />
        
        {/* Redirect all other routes to homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
