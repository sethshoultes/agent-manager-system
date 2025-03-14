import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AgentProvider } from './context/AgentContext';
import { DataProvider } from './context/DataContext';
import { ReportProvider } from './context/ReportContext';
import DashboardPage from './pages/DashboardPage';
import AgentsPage from './pages/AgentsPage';
import DataPage from './pages/DataPage';
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
                <Route path="/data" element={<DataPage />} />
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
