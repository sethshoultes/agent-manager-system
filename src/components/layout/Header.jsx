import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Determine active menu item
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <header className="app-header">
      <div className="container mx-auto flex justify-between items-center">
        <div className="header-logo">
          <Link to="/">
            <h1>Agent Manager</h1>
          </Link>
        </div>
        
        <nav className="header-nav hidden md:block">
          <ul className="nav-list">
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/agents" 
                className={`nav-link ${isActive('/agents') ? 'active' : ''}`}
              >
                Agents
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/data" 
                className={`nav-link ${isActive('/data') ? 'active' : ''}`}
              >
                Data
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/reports" 
                className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
              >
                Reports
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/settings" 
                className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="flex items-center">
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu}
            className="mobile-menu-btn ml-4 md:hidden"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className={`mobile-menu md:hidden px-2 pt-2 pb-4 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <Link to="/" className="mobile-menu-item">
          Dashboard
        </Link>
        <Link to="/agents" className="mobile-menu-item">
          Agents
        </Link>
        <Link to="/data" className="mobile-menu-item">
          Data
        </Link>
        <Link to="/reports" className="mobile-menu-item">
          Reports
        </Link>
        <Link to="/settings" className="mobile-menu-item">
          Settings
        </Link>
      </div>
    </header>
  );
};

export default Header;