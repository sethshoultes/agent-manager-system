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
    <div className="app-layout">
      <Header />
      {isOffline && (
        <div style={{
          background: '#ffe066',
          color: '#664d03',
          padding: '8px 16px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          borderBottom: '1px solid #ffc107'
        }}>
          Running in Offline Mode - All changes are stored locally
        </div>
      )}
      <div className="app-content">
        <Sidebar />
        <main className="main-content">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;