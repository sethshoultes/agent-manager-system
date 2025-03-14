import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAgentContext } from '../../context/AgentContext';
import { useDataContext } from '../../context/DataContext';
import { useReportContext } from '../../context/ReportContext';

const Sidebar = () => {
  const { agents } = useAgentContext();
  const { dataSources } = useDataContext();
  const { reports } = useReportContext();
  const location = useLocation();
  
  // Determine active menu item
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-heading">Overview</h3>
        <ul className="sidebar-menu">
          <li className={`menu-item ${isActive('/') ? 'active' : ''}`}>
            <Link to="/">Dashboard</Link>
          </li>
        </ul>
      </div>
      
      <div className="sidebar-section">
        <h3 className="sidebar-heading">Agents</h3>
        <ul className="sidebar-menu">
          <li className={`menu-item ${isActive('/agents') ? 'active' : ''}`}>
            <Link to="/agents">All Agents ({agents.length})</Link>
          </li>
          <li className="menu-item">
            <Link to="/agents/new">+ New Agent</Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-heading">Data Sources</h3>
        <ul className="sidebar-menu">
          <li className={`menu-item ${isActive('/data') ? 'active' : ''}`}>
            <Link to="/data">All Data Sources ({dataSources.length})</Link>
          </li>
          <li className="menu-item">
            <Link to="/data/upload">+ Upload Data</Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-heading">Reports</h3>
        <ul className="sidebar-menu">
          <li className={`menu-item ${isActive('/reports') ? 'active' : ''}`}>
            <Link to="/reports">All Reports ({reports.length})</Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;