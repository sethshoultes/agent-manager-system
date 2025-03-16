import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../shared/ErrorBoundary';

const Layout = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  
  // Check server availability
  const checkServerAvailability = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 2000
      });
      
      setIsServerAvailable(response.ok);
      return response.ok;
    } catch (error) {
      console.log('Server unavailable:', error);
      setIsServerAvailable(false);
      return false;
    }
  };
  
  // Toggle between online and offline mode
  const toggleOfflineMode = async () => {
    if (isOffline) {
      // Trying to switch to online mode - check server first
      const serverAvailable = await checkServerAvailability();
      
      if (serverAvailable) {
        localStorage.setItem('offline_mode', 'false');
        setIsOffline(false);
      } else {
        alert('Cannot switch to online mode. Server is not available.');
      }
    } else {
      // Switch to offline mode
      localStorage.setItem('offline_mode', 'true');
      setIsOffline(true);
    }
  };
  
  useEffect(() => {
    // Initial check of offline mode and server availability
    const offlineMode = localStorage.getItem('offline_mode') === 'true';
    setIsOffline(offlineMode);
    checkServerAvailability();
    
    // Listen for changes to offline mode
    const checkOfflineMode = () => {
      const currentMode = localStorage.getItem('offline_mode') === 'true';
      setIsOffline(currentMode);
    };
    
    window.addEventListener('storage', checkOfflineMode);
    return () => window.removeEventListener('storage', checkOfflineMode);
  }, []);
  
  return (
    <div className="app-layout flex flex-col min-h-screen">
      <Header />
      
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 py-2 px-4 text-center font-semibold text-sm border-b border-yellow-200 dark:border-yellow-800">
          <span>Offline Mode - Data is stored locally. AI features still available.</span>
          {isServerAvailable && (
            <button 
              onClick={toggleOfflineMode}
              className="underline ml-2 hover:text-yellow-700 dark:hover:text-yellow-100"
            >
              Switch to Online Mode
            </button>
          )}
        </div>
      )}
      
      {!isOffline && (
        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 py-2 px-4 text-center font-semibold text-sm border-b border-blue-200 dark:border-blue-800">
          <span>Online Mode - Connected to server.</span>
          <button 
            onClick={toggleOfflineMode}
            className="underline ml-2 hover:text-blue-700 dark:hover:text-blue-100"
          >
            Switch to Offline Mode
          </button>
        </div>
      )}
      
      <div className="app-content">
        <Sidebar />
        <main className="main-content">
          <ErrorBoundary>
            <div>
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;