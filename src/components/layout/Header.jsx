import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-logo">
        <Link to="/">
          <h1>Agent Manager</h1>
        </Link>
      </div>
      
      <nav className="header-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link to="/" className="nav-link">Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link to="/agents" className="nav-link">Agents</Link>
          </li>
          <li className="nav-item">
            <Link to="/data" className="nav-link">Data</Link>
          </li>
          <li className="nav-item">
            <Link to="/reports" className="nav-link">Reports</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;