import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ConnectionContext } from './Layout';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isOffline, isServerAvailable, toggleOfflineMode } = useContext(ConnectionContext);
  
  // Function to handle toggle click with confirmation
  const handleConnectionToggle = async () => {
    if (isOffline && !isServerAvailable) {
      alert('Cannot switch to online mode. Server is not available.');
      return;
    }
    toggleOfflineMode();
  };
  
  return (
    <header className="app-header">
      <div className="container mx-auto flex justify-between items-center">
        <div className="header-logo">
          <Link to="/">
            <h1>Agent Manager</h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme toggle button - Moved to first position */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn relative group"
            aria-label="Toggle dark mode"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
          
          {/* Connection status button - Now second position */}
          <div className="connection-status flex items-center">
            {/* Status indicator text - small screens only show icon */}
            <span className="hidden sm:inline-block mr-1.5 text-sm font-medium">
              {isOffline ? 'Offline' : 'Online'}
            </span>
            
            <button
              onClick={handleConnectionToggle}
              className={`connection-toggle-btn relative group ${isOffline ? 'text-yellow-500' : 'text-green-500'}`}
              aria-label={isOffline ? 'Switch to Online Mode' : 'Switch to Offline Mode'}
              title={isOffline ? 'Currently Offline' : 'Currently Online'}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={isOffline 
                    ? "M13 10V3L4 14h7v7l9-11h-7z" // Lightning bolt with slash (offline)
                    : "M13 10V3L4 14h7v7l9-11h-7z"  // Lightning bolt (online)
                  } 
                />
                {isOffline && (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2"
                    stroke="currentColor"
                    d="M18 6L6 18"
                  />
                )}
              </svg>
              
              {/* Tooltip */}
              <span className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 -bottom-8 whitespace-nowrap z-10">
                {isOffline 
                  ? isServerAvailable 
                    ? 'Click to go online' 
                    : 'Server unavailable' 
                  : 'Click to go offline'
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;