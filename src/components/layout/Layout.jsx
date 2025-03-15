import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../shared/ErrorBoundary';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Header />
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