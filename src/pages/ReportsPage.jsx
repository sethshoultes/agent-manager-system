import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';

// Minimal ReportPanel component
const SimpleReportPanel = ({ report, onClose }) => {
  if (!report || typeof report !== 'object') {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h2>Invalid Report</h2>
        <p>This report appears to be corrupted or invalid.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h2>{report?.name || report?.title || 'Untitled Report'}</h2>
      <p><strong>Generated:</strong> {new Date(report?.generatedAt || report?.createdAt || Date.now()).toLocaleString()}</p>
      <p>{report?.description || 'No description available'}</p>
      
      {report?.summary && (
        <div>
          <h3>Summary</h3>
          <p>{report.summary}</p>
        </div>
      )}
      
      {Array.isArray(report?.insights) && report.insights.length > 0 && (
        <div>
          <h3>Insights</h3>
          <ul>
            {report.insights.map((insight, i) => (
              <li key={i}>
                {typeof insight === 'string' 
                  ? insight 
                  : typeof insight === 'object' && insight !== null
                    ? (insight.description || insight.title || JSON.stringify(insight))
                    : 'Invalid insight'
                }
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {Array.isArray(report?.visualizations) && report.visualizations.length > 0 && (
        <div>
          <h3>Visualizations</h3>
          <p>This report has {report.visualizations.length} visualizations</p>
          <ul>
            {report.visualizations.map((viz, i) => (
              <li key={i}>
                {viz?.type || 'Unknown'} chart: {viz?.config?.title || 'Untitled'} 
                ({viz?.data?.length || 0} data points)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <Button onClick={onClose}>Close</Button>
    </div>
  );
};

const ReportsPage = () => {
  // Direct management of reports from localStorage
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Load reports from localStorage on mount
  useEffect(() => {
    try {
      // Clear localStorage if needed for a fresh start
      // localStorage.removeItem('reports');
      
      const storedReports = localStorage.getItem('reports');
      console.log('Raw reports from localStorage:', storedReports);
      
      if (storedReports) {
        try {
          const parsedReports = JSON.parse(storedReports);
          console.log('Parsed reports:', parsedReports);
          
          // Clean the reports array - remove any null, undefined, or malformed entries
          const cleanedReports = Array.isArray(parsedReports) 
            ? parsedReports.filter(report => 
                report && 
                typeof report === 'object' &&
                report.id // Must have an ID at minimum
              )
            : [];
            
          console.log('Cleaned reports:', cleanedReports);
          
          // Save the cleaned reports back to localStorage
          if (cleanedReports.length !== (Array.isArray(parsedReports) ? parsedReports.length : 0)) {
            localStorage.setItem('reports', JSON.stringify(cleanedReports));
            console.log('Saved cleaned reports back to localStorage');
          }
          
          setReports(cleanedReports);
        } catch (parseError) {
          console.error('Failed to parse reports JSON:', parseError);
          localStorage.removeItem('reports'); // Remove corrupted data
          setReports([]);
        }
      } else {
        console.log('No reports found in localStorage');
        setReports([]);
      }
    } catch (err) {
      console.error('Error loading reports from localStorage:', err);
      setReports([]);
    }
  }, []);
  
  // Create a sample report for testing
  const createSampleReport = () => {
    const newReport = {
      id: `report-${Date.now()}`,
      name: 'Sample Report',
      description: 'A sample report for testing',
      generatedAt: new Date().toISOString(),
      summary: 'This is a sample report summary.',
      insights: ['Sample insight 1', 'Sample insight 2'],
      visualizations: [{
        type: 'bar',
        data: [
          { name: 'A', value: 100 },
          { name: 'B', value: 200 },
          { name: 'C', value: 150 }
        ],
        config: {
          title: 'Sample Chart',
          xAxisKey: 'name',
          valueKey: 'value'
        }
      }]
    };
    
    const updatedReports = [...reports, newReport];
    setReports(updatedReports);
    
    try {
      localStorage.setItem('reports', JSON.stringify(updatedReports));
      console.log('Saved reports to localStorage. Count:', updatedReports.length);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };
  
  // Delete a report
  const deleteReport = (id) => {
    const updatedReports = reports.filter(r => r.id !== id);
    setReports(updatedReports);
    
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport(null);
    }
    
    try {
      localStorage.setItem('reports', JSON.stringify(updatedReports));
    } catch (err) {
      console.error('Error saving to localStorage after deletion:', err);
    }
  };

  // Debug current state
  console.log('ReportsPage render - Current reports state:', {
    reportsLength: reports.length,
    reportsArray: reports,
    hasNulls: reports.some(r => r === null),
    selectedReport,
  });
  
  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Reports</h1>
          <div>
            <Button onClick={createSampleReport} style={{ marginRight: '10px' }}>Create Sample Report</Button>
            <Button 
              onClick={() => {
                localStorage.removeItem('reports');
                setReports([]);
                console.log('Cleared localStorage reports');
              }}
              style={{ background: '#e74c3c' }}
            >
              Reset Reports
            </Button>
          </div>
        </div>
        
        {selectedReport ? (
          <SimpleReportPanel 
            report={selectedReport} 
            onClose={() => setSelectedReport(null)} 
          />
        ) : reports.length === 0 ? (
          <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
            <p>No reports available. Execute an agent to generate reports or create a sample report for testing.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {reports
              .filter(report => 
                report && 
                typeof report === 'object' && 
                report.id
              )
              .map(report => (
                <Card 
                  key={report.id}
                  title={report?.name || report?.title || 'Untitled Report'}
                  footer={
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button onClick={() => setSelectedReport(report)}>View</Button>
                      <Button onClick={() => deleteReport(report.id)}>Delete</Button>
                    </div>
                  }
                >
                  <p>{report?.description || 'No description'}</p>
                  <p><strong>Created:</strong> {
                    new Date(report?.generatedAt || report?.createdAt || Date.now()).toLocaleString()
                  }</p>
                  
                  {Array.isArray(report?.insights) && report.insights.length > 0 && (
                    <p><strong>Insights:</strong> {report.insights.length}</p>
                  )}
                  
                  {Array.isArray(report?.visualizations) && report.visualizations.length > 0 && (
                    <p><strong>Visualizations:</strong> {report.visualizations.length}</p>
                  )}
                </Card>
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;