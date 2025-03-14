import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  saveToLocalStorage, 
  loadFromLocalStorage,
  exportToJsonFile,
  importFromJsonFile
} from '../services/fileStorageService';

const ReportContext = createContext();

// Load reports from local storage or use empty array as default
const loadReports = () => {
  const savedReports = loadFromLocalStorage('reports', []);
  return savedReports;
};

const initialState = {
  reports: loadReports(),
  selectedReport: null,
  isLoading: false,
  error: null
};

function reportReducer(state, action) {
  switch (action.type) {
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

  // Save reports to local storage whenever they change
  useEffect(() => {
    saveToLocalStorage('reports', state.reports);
  }, [state.reports]);

  const addReport = (report) => {
    dispatch({ type: 'ADD_REPORT', payload: { ...report, id: report.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() } });
  };

  const updateReport = (report) => {
    dispatch({ type: 'UPDATE_REPORT', payload: { ...report, updatedAt: new Date() } });
  };

  const deleteReport = (id) => {
    dispatch({ type: 'DELETE_REPORT', payload: { id } });
  };

  const selectReport = (report) => {
    dispatch({ type: 'SELECT_REPORT', payload: report });
  };

  const exportReports = () => {
    const filename = `reports-${new Date().toISOString().split('T')[0]}.json`;
    return exportToJsonFile(filename, state.reports);
  };

  const importReports = async (file) => {
    try {
      const importedData = await importFromJsonFile(file);
      if (Array.isArray(importedData)) {
        // Process each report and add to state
        const processedReports = importedData.map(report => {
          if (!report.id) {
            report.id = uuidv4();
          }
          if (!report.createdAt) {
            report.createdAt = new Date().toISOString();
          }
          report.updatedAt = new Date().toISOString();
          return report;
        });
        
        dispatch({ type: 'SET_REPORTS', payload: processedReports });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing reports:', error);
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