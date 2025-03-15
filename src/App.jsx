import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import AgentsPage from './pages/AgentsPage';
import NewAgentPage from './pages/NewAgentPage';
import DataPage from './pages/DataPage';
import DataUploadPage from './pages/DataUploadPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import useInitialize from './hooks/useInitialize';
import DebugReports from '../debug-reports';
import './App.css';

// Simple homepage component for easy testing
const HomePage = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Agent Manager System Test Menu</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
        <Link to="/dashboard" style={linkButtonStyle}>Dashboard</Link>
        <Link to="/agents" style={linkButtonStyle}>Agents</Link>
        <Link to="/data" style={linkButtonStyle}>Data</Link>
        <Link to="/reports" style={linkButtonStyle}>Reports</Link>
        <Link to="/debug-reports" style={{...linkButtonStyle, background: '#e74c3c'}}>Debug Reports</Link>
      </div>
      
      <div style={{ background: '#f4f6f8', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Testing Instructions</h2>
        <p>To test the <strong>Create Sample Dataset</strong> feature:</p>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Click the <strong>Data</strong> button above</li>
          <li>Look for the <strong>Create Sample Dataset</strong> button at the top of the page</li>
          <li>Click it to generate sample data</li>
          <li>Verify that the sample data appears in the list</li>
          <li>Click <strong>View Data</strong> to see the sample data displayed in a table</li>
        </ol>
      </div>
      
      <div style={{ textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
        <p>All authentication has been bypassed for testing purposes.</p>
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
        {/* Add our test homepage */}
        <Route path="/" element={<HomePage />} />
        
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
        
        {/* Debug routes */}
        <Route path="/debug-reports" element={<DebugReports />} />
        
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
