import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { reports as reportService } from '../services/apiClient';
import { exportToJsonFile, importFromJsonFile } from '../services/fileStorageService';
import { auth } from '../services/apiClient';

const ReportContext = createContext();

const initialState = {
  reports: [],
  selectedReport: null,
  isLoading: false,
  error: null
};

function reportReducer(state, action) {
  switch (action.type) {
    case 'FETCH_REPORTS_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_REPORTS_SUCCESS':
      return {
        ...state,
        reports: action.payload,
        isLoading: false,
        error: null
      };
    case 'FETCH_REPORTS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_REPORT':
      return {
        ...state,
        reports: [action.payload, ...state.reports]
      };
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(report => 
          report.id === action.payload.id 
            ? { ...report, ...action.payload } 
            : report
        )
      };
    case 'DELETE_REPORT':
      return {
        ...state,
        reports: state.reports.filter(report => report.id !== action.payload.id),
        selectedReport: state.selectedReport?.id === action.payload.id ? null : state.selectedReport
      };
    case 'SELECT_REPORT':
      return {
        ...state,
        selectedReport: action.payload
      };
    case 'SET_REPORTS':
      return {
        ...state,
        reports: action.payload,
        selectedReport: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}

export function ReportProvider({ children }) {
  const [state, dispatch] = useReducer(reportReducer, initialState);

  // Fetch reports when component mounts and user is authenticated
  useEffect(() => {
    const fetchReports = async () => {
      // For demo purposes, create sample reports if none exists
      const createSampleReports = () => {
        console.log('Creating sample reports for demo...');
        
        const sampleReports = [
          {
            id: 'sample-report-1',
            name: 'Sales Analysis Report',
            description: 'Analysis of sample sales data',
            agentId: 'sample-agent-1',
            dataSourceId: 'sample-data-1',
            summary: 'This report analyzes sales patterns across different categories and time periods in the sample dataset. Key findings show a concentration of sales in categories A and B, with significant seasonal variations.',
            insights: [
              'Category A has the highest average sales value',
              'Products with price points between $40-$60 show the best conversion rates',
              'Weekend sales are 27% higher than weekday sales',
              'There is a strong positive correlation between price and product category'
            ],
            visualizations: [
              {
                type: 'bar',
                title: 'Sales by Category',
                data: [
                  { name: 'Category A', value: 420 },
                  { name: 'Category B', value: 380 },
                  { name: 'Category C', value: 210 },
                  { name: 'Category D', value: 190 }
                ],
                config: {
                  xAxisKey: 'name',
                  series: [{
                    dataKey: 'value',
                    name: 'Total Sales',
                    color: '#0088FE'
                  }]
                }
              },
              {
                type: 'pie',
                title: 'Sales Distribution',
                data: [
                  { name: 'Category A', value: 420 },
                  { name: 'Category B', value: 380 },
                  { name: 'Category C', value: 210 },
                  { name: 'Category D', value: 190 }
                ],
                config: {
                  nameKey: 'name',
                  valueKey: 'value'
                }
              }
            ],
            generatedAt: new Date().toISOString()
          }
        ];
        
        // Save to localStorage for persistence
        localStorage.setItem('reports', JSON.stringify(sampleReports));
        
        return sampleReports;
      };
      
      try {
        dispatch({ type: 'FETCH_REPORTS_START' });
        
        if (auth.isAuthenticated()) {
          // If authenticated, try to get reports from API
          try {
            const response = await reportService.getAll();
            dispatch({ 
              type: 'FETCH_REPORTS_SUCCESS', 
              payload: response.data.reports 
            });
          } catch (error) {
            console.error('Error fetching reports:', error);
            
            // Fallback to localStorage if API is unreachable
            if (error.message === 'Network Error') {
              console.warn('API unreachable, falling back to localStorage for reports');
              const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
              
              // If no reports in localStorage, create samples
              const reports = savedReports.length > 0 ? savedReports : createSampleReports();
              
              dispatch({ 
                type: 'FETCH_REPORTS_SUCCESS',
                payload: reports
              });
            } else {
              dispatch({ 
                type: 'FETCH_REPORTS_ERROR', 
                payload: error.message || 'Failed to fetch reports' 
              });
            }
          }
        } else {
          // Not authenticated, use localStorage
          console.warn('No authentication, using localStorage for reports');
          const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
          
          // If no reports in localStorage, create samples
          const reports = savedReports.length > 0 ? savedReports : createSampleReports();
          
          dispatch({ 
            type: 'FETCH_REPORTS_SUCCESS',
            payload: reports
          });
        }
      } catch (error) {
        console.error('Error in reports initialization:', error);
        dispatch({ 
          type: 'FETCH_REPORTS_ERROR',
          payload: error.message || 'Failed to initialize reports'
        });
      }
    };

    fetchReports();
  }, []);

  const addReport = async (report) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await reportService.create(report);
      dispatch({ type: 'ADD_REPORT', payload: response.data.report });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.report;
    } catch (error) {
      console.error('Error adding report:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add report' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const updateReport = async (report) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await reportService.update(report.id, report);
      dispatch({ type: 'UPDATE_REPORT', payload: response.data.report });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.report;
    } catch (error) {
      console.error('Error updating report:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update report' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const deleteReport = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await reportService.delete(id);
      dispatch({ type: 'DELETE_REPORT', payload: { id } });
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete report' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const selectReport = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await reportService.getById(id);
      dispatch({ type: 'SELECT_REPORT', payload: response.data.report });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.report;
    } catch (error) {
      console.error('Error selecting report:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to select report' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const exportReports = async () => {
    try {
      const response = await reportService.getAll();
      const reports = response.data.reports;
      const filename = `reports-${new Date().toISOString().split('T')[0]}.json`;
      return exportToJsonFile(filename, reports);
    } catch (error) {
      console.error('Error exporting reports:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to export reports' });
      return false;
    }
  };

  const importReports = async (file) => {
    try {
      const importedData = await importFromJsonFile(file);
      if (Array.isArray(importedData)) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Process each report and add it to the API
        for (const report of importedData) {
          const reportData = {
            name: report.name,
            description: report.description || '',
            content: report.content || {},
            agent_id: report.agent_id,
            data_source_id: report.data_source_id
          };
          
          await reportService.create(reportData);
        }
        
        // Fetch updated list
        const response = await reportService.getAll();
        dispatch({ type: 'SET_REPORTS', payload: response.data.reports });
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing reports:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to import reports' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  return (
    <ReportContext.Provider value={{
      reports: state.reports,
      selectedReport: state.selectedReport,
      isLoading: state.isLoading,
      error: state.error,
      addReport,
      updateReport,
      deleteReport,
      selectReport,
      exportReports,
      importReports
    }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReportContext() {
  return useContext(ReportContext);
}