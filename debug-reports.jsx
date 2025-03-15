// This is a minimal ReportsPage implementation to debug issues
import React, { useState, useEffect } from 'react';

// Minimal component to test reports display
export default function DebugReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to load reports from localStorage
    const loadReports = () => {
      setLoading(true);
      try {
        const storedReports = localStorage.getItem('reports');
        console.log('Raw reports from localStorage:', storedReports);
        if (storedReports) {
          const parsedReports = JSON.parse(storedReports);
          console.log('Parsed reports:', parsedReports);
          setReports(Array.isArray(parsedReports) ? parsedReports : []);
        } else {
          console.log('No reports found in localStorage');
          setReports([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading reports:', err);
        setError(err.message || 'Failed to load reports');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Function to create a sample report
  const createSampleReport = () => {
    const newReport = {
      id: `report-${Date.now()}`,
      name: 'Debug Test Report',
      description: 'A test report created for debugging',
      generatedAt: new Date().toISOString(),
      summary: 'This is a test report.',
      insights: ['Test insight 1', 'Test insight 2'],
      visualizations: [{
        type: 'bar',
        data: [
          { name: 'A', value: 100 },
          { name: 'B', value: 200 },
          { name: 'C', value: 150 }
        ],
        config: {
          title: 'Test Chart',
          xAxisKey: 'name',
          valueKey: 'value'
        }
      }]
    };

    setReports(prev => [...prev, newReport]);
    try {
      localStorage.setItem('reports', JSON.stringify([...reports, newReport]));
      console.log('Saved reports to localStorage. Count:', reports.length + 1);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };

  // Function to clear all reports
  const clearReports = () => {
    try {
      localStorage.removeItem('reports');
      setReports([]);
      console.log('Cleared all reports from localStorage');
    } catch (err) {
      console.error('Error clearing reports:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Debug Reports Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={createSampleReport}
          style={{ 
            padding: '8px 16px', 
            background: '#4a69bd', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Create Sample Report
        </button>
        
        <button 
          onClick={clearReports}
          style={{ 
            padding: '8px 16px', 
            background: '#e74c3c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          Clear All Reports
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Debug Info</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify({
            reportsCount: reports.length,
            loading,
            error,
            hasLocalStorage: typeof localStorage !== 'undefined',
            localStorageReports: typeof localStorage !== 'undefined' ? 
              (localStorage.getItem('reports') ? 'exists' : 'does not exist') : 'unknown'
          }, null, 2)}
        </pre>
      </div>
      
      {loading ? (
        <p>Loading reports...</p>
      ) : error ? (
        <div style={{ color: 'red' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div>
          <h3>No Reports Found</h3>
          <p>Click "Create Sample Report" to add a test report.</p>
        </div>
      ) : (
        <div>
          <h3>Reports ({reports.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {reports.map(report => (
              <div 
                key={report.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '15px',
                  background: 'white' 
                }}
              >
                <h4>{report.name || report.title || 'Untitled Report'}</h4>
                <p>{report.description || 'No description'}</p>
                <p><strong>Generated:</strong> {new Date(report.generatedAt || report.createdAt).toLocaleString()}</p>
                
                {report.visualizations && report.visualizations.length > 0 && (
                  <p><strong>Visualizations:</strong> {report.visualizations.length}</p>
                )}
                
                {report.insights && report.insights.length > 0 && (
                  <p><strong>Insights:</strong> {report.insights.length}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}