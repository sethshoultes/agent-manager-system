import React, { useEffect, useState, createContext } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../shared/ErrorBoundary';

// Create context for connection status
export const ConnectionContext = createContext({
  isOffline: false,
  isServerAvailable: false,
  toggleOfflineMode: () => {},
  checkServerAvailability: () => {}
});

const Layout = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  
  // Check server availability - For demo purposes, make it always available
  const checkServerAvailability = async () => {
    try {
      // In a real app, we would check the actual server
      // const response = await fetch('http://localhost:3001/api/health', { 
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   timeout: 2000
      // });
      
      // For demo purposes, just return true
      setIsServerAvailable(true);
      return true;
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
  
  // Context value with connection state and functions
  const connectionContextValue = {
    isOffline,
    isServerAvailable,
    toggleOfflineMode,
    checkServerAvailability
  };
  
  return (
    <ConnectionContext.Provider value={connectionContextValue}>
      <div className="app-layout flex flex-col min-h-screen">
        <Header />
        
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
    </ConnectionContext.Provider>
  );
};

export default Layout;