import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../shared/ErrorBoundary';

const Layout = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    const offlineMode = localStorage.getItem('offline_mode') === 'true';
    setIsOffline(offlineMode);
    
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
          Running in Offline Mode - All changes are stored locally
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