import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAgentStore from '../../stores/agentStore';
import useDataStore from '../../stores/dataStore';
import useReportStore from '../../stores/reportStore';

const Sidebar = () => {
  const agentStore = useAgentStore();
  const dataStore = useDataStore();
  const reportStore = useReportStore();
  
  const { agents } = agentStore;
  const { dataSources } = dataStore;
  const { reports } = reportStore;
  const location = useLocation();
  
  // Determine active menu item
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-content">
        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            Overview
          </h3>
          <ul className="sidebar-menu">
            <li className={`menu-item ${isActive('/') ? 'active' : ''}`}>
              <Link to="/">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3" />
                </svg>
                <span>Dashboard</span>
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            Agents
          </h3>
          <ul className="sidebar-menu">
            <li className={`menu-item ${isActive('/agents') ? 'active' : ''}`}>
              <Link to="/agents">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>All Agents ({agents.length})</span>
              </Link>
            </li>
            <li className={`menu-item ${isActive('/agents/new') ? 'active' : ''}`}>
              <Link to="/agents/new">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Agent</span>
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            Data Sources
          </h3>
          <ul className="sidebar-menu">
            <li className={`menu-item ${isActive('/data') ? 'active' : ''}`}>
              <Link to="/data">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span>All Data Sources ({dataSources.length})</span>
              </Link>
            </li>
            <li className={`menu-item ${isActive('/data/upload') ? 'active' : ''}`}>
              <Link to="/data/upload">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload Data</span>
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            Reports
          </h3>
          <ul className="sidebar-menu">
            <li className={`menu-item ${isActive('/reports') ? 'active' : ''}`}>
              <Link to="/reports">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                </svg>
                <span>All Reports ({reports.length})</span>
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            Configuration
          </h3>
          <ul className="sidebar-menu">
            <li className={`menu-item ${isActive('/settings') ? 'active' : ''}`}>
              <Link to="/settings">
                <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="version-info">
          <span>Agent Manager v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;