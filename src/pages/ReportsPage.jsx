import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import ReportPanel from '../components/reports/ReportPanel';

const ReportsPage = () => {
  // Direct management of reports from localStorage
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Load reports from localStorage on mount and recheck every 3 seconds
  useEffect(() => {
    const loadReports = () => {
      try {
        // Log localStorage keys for debugging
        console.log('Available localStorage keys:', Object.keys(localStorage));
        
        const storedReports = localStorage.getItem('reports');
        console.log('Raw reports from localStorage:', storedReports?.substring(0, 100) + '...');
        
        if (storedReports) {
          try {
            const parsedReports = JSON.parse(storedReports);
            console.log('Parsed reports count:', Array.isArray(parsedReports) ? parsedReports.length : 'not an array');
            
            // Clean the reports array - remove any null, undefined, or malformed entries
            const cleanedReports = Array.isArray(parsedReports) 
              ? parsedReports.filter(report => 
                  report && 
                  typeof report === 'object' &&
                  report.id // Must have an ID at minimum
                )
              : [];
              
            console.log('Cleaned reports count:', cleanedReports.length);
            console.log('Report IDs:', cleanedReports.map(r => r.id).join(', '));
            
            // Save the cleaned reports back to localStorage
            if (cleanedReports.length !== (Array.isArray(parsedReports) ? parsedReports.length : 0)) {
              localStorage.setItem('reports', JSON.stringify(cleanedReports));
              console.log('Saved cleaned reports back to localStorage');
            }
            
            // Only update state if reports have changed
            if (JSON.stringify(cleanedReports.map(r => r.id)) !== 
                JSON.stringify(reports.map(r => r.id))) {
              console.log('Reports changed, updating state');
              setReports(cleanedReports);
            }
          } catch (parseError) {
            console.error('Failed to parse reports JSON:', parseError);
            localStorage.removeItem('reports'); // Remove corrupted data
            setReports([]);
          }
        } else {
          console.log('No reports found in localStorage');
          if (reports.length > 0) {
            setReports([]);
          }
        }
      } catch (err) {
        console.error('Error loading reports from localStorage:', err);
        setReports([]);
      }
    };
    
    // Load immediately
    loadReports();
    
    // Set up polling interval to check for new reports
    const interval = setInterval(loadReports, 3000);
    
    // Clean up
    return () => clearInterval(interval);
  }, [reports]);
  
  // Create a sample report for testing
  const createSampleReport = () => {
    const newReport = {
      id: `report-${Date.now()}`,
      name: 'Product Sales Analysis',
      description: 'Comprehensive analysis of product sales by category and region',
      generatedAt: new Date().toISOString(),
      summary: `# Sales Performance Analysis

## Overview
This report analyzes sales performance across different product categories and regions. The data shows significant variations in sales patterns across different market segments.

## Key Findings
Electronics consistently outperform other categories, with the West region showing the highest sales volumes. Year-over-year growth is strongest in the Toys category.

## Market Trends
We've identified several important market trends in the data:
* **Regional preferences** vary significantly across product categories
* **Seasonal patterns** show Q4 has 40% higher sales than other quarters
* **Price sensitivity** is highest in the South region
* **Customer loyalty** correlates strongly with product quality ratings

## Recommendations
* Increase marketing budget for Electronics in the West region
* Investigate underperformance in the South region
* Expand Toys inventory based on strong growth trends
* Implement targeted promotions during seasonal peaks`,
      insights: [
        'Electronics products generate 42% of total revenue',
        'The West region outperforms all other regions with 37% higher sales',
        'Year-over-year growth is highest in the Toys category (24%)',
        'Products with ratings above 4.5 sell 3x more than lower-rated items',
        'Seasonal patterns show Q4 has 40% higher sales than other quarters'
      ],
      statistics: {
        'sales': {
          mean: 532.4,
          median: 498.2,
          min: 124.0,
          max: 1205.6,
          count: 25
        },
        'value': {
          mean: 621.8,
          median: 580.0,
          min: 200.0,
          max: 1120.0,
          count: 25
        },
        'price': {
          mean: 78.42,
          median: 65.99,
          min: 12.99,
          max: 199.99,
          count: 25
        },
        'rating': {
          mean: 3.8,
          median: 4.0,
          min: 1.0,
          max: 5.0,
          count: 25
        }
      },
      visualizations: [
        {
          type: 'bar',
          title: 'Sales by Product Category',
          data: [
            { name: 'Electronics', value: 4250 },
            { name: 'Clothing', value: 2180 },
            { name: 'Home', value: 3150 },
            { name: 'Books', value: 1430 },
            { name: 'Toys', value: 2840 }
          ],
          config: {
            xAxisKey: 'name',
            valueKey: 'value',
            series: [{
              dataKey: 'value',
              name: 'Sales Volume',
              color: '#0088FE'
            }]
          }
        },
        {
          type: 'pie',
          title: 'Regional Sales Distribution',
          data: [
            { name: 'North', value: 28 },
            { name: 'South', value: 15 },
            { name: 'East', value: 22 },
            { name: 'West', value: 35 }
          ],
          config: {
            nameKey: 'name',
            valueKey: 'value'
          }
        },
        {
          type: 'line',
          title: 'Sales Trend by Year',
          data: [
            { name: '2021', value: 2400 },
            { name: '2022', value: 2800 },
            { name: '2023', value: 3400 },
            { name: '2024', value: 3900 },
            { name: '2025', value: 4500 }
          ],
          config: {
            xAxisKey: 'name',
            valueKey: 'value',
            series: [{
              dataKey: 'value',
              name: 'Annual Sales',
              color: '#00C49F'
            }]
          }
        }
      ]
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

  return (
    <Layout>
      <div className="w-full reports-page">
        <div className="page-header flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reports</h1>
          <div className="action-buttons flex space-x-3">
            <Button onClick={createSampleReport} variant="primary">
              Create Sample Report
            </Button>
            <Button 
              onClick={() => {
                localStorage.removeItem('reports');
                setReports([]);
                console.log('Cleared localStorage reports');
              }}
              variant="danger"
            >
              Reset Reports
            </Button>
          </div>
        </div>
        
        {selectedReport ? (
          <ReportPanel 
            report={selectedReport} 
            onClose={() => setSelectedReport(null)} 
          />
        ) : reports.length === 0 ? (
          <div className="empty-state p-6 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-[var(--color-text-secondary)]">
              No reports available. Execute an agent to generate reports or create a sample report for testing.
            </p>
          </div>
        ) : (
          <div className="reports-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="flex space-x-3">
                      <Button onClick={() => setSelectedReport(report)} variant="primary" size="small">View</Button>
                      <Button onClick={() => deleteReport(report.id)} variant="danger" size="small">Delete</Button>
                    </div>
                  }
                >
                  <p className="mb-2 text-sm text-[var(--color-text-secondary)]">{report?.description || 'No description'}</p>
                  <p className="mb-2 text-sm"><span className="font-semibold">Created:</span> {
                    new Date(report?.generatedAt || report?.createdAt || Date.now()).toLocaleString()
                  }</p>
                  
                  {Array.isArray(report?.insights) && report.insights.length > 0 && (
                    <p className="mb-2 text-sm"><span className="font-semibold">Insights:</span> {report.insights.length}</p>
                  )}
                  
                  {Array.isArray(report?.visualizations) && report.visualizations.length > 0 && (
                    <p className="mb-2 text-sm"><span className="font-semibold">Visualizations:</span> {report.visualizations.length}</p>
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