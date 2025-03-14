import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AgentProvider } from './context/AgentContext';
import { DataProvider } from './context/DataContext';
import { ReportProvider } from './context/ReportContext';
import DashboardPage from './pages/DashboardPage';
import AgentsPage from './pages/AgentsPage';
import NewAgentPage from './pages/NewAgentPage';
import DataPage from './pages/DataPage';
import DataUploadPage from './pages/DataUploadPage';
import ReportsPage from './pages/ReportsPage';
import './App.css';

function App() {
  return (
    <Router>
      <AgentProvider>
        <DataProvider>
          <ReportProvider>
            <div className="app">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/agents/new" element={<NewAgentPage />} />
                <Route path="/data" element={<DataPage />} />
                <Route path="/data/upload" element={<DataUploadPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </div>
          </ReportProvider>
        </DataProvider>
      </AgentProvider>
    </Router>
  );
}

export default App;
