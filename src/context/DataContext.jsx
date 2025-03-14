import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  saveToLocalStorage, 
  loadFromLocalStorage,
  exportToJsonFile,
  importFromJsonFile
} from '../services/fileStorageService';

const DataContext = createContext();

// Load data sources from local storage or use empty array as default
const loadDataSources = () => {
  const savedDataSources = loadFromLocalStorage('dataSources', []);
  return savedDataSources;
};

const initialState = {
  dataSources: loadDataSources(),
  selectedDataSource: null,
  isLoading: false,
  error: null
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'ADD_DATA_SOURCE':
      return {
        ...state,
        dataSources: [...state.dataSources, { ...action.payload, id: uuidv4(), uploadedAt: new Date() }]
      };
    case 'UPDATE_DATA_SOURCE':
      return {
        ...state,
        dataSources: state.dataSources.map(ds => 
          ds.id === action.payload.id 
            ? { ...ds, ...action.payload } 
            : ds
        )
      };
    case 'DELETE_DATA_SOURCE':
      return {
        ...state,
        dataSources: state.dataSources.filter(ds => ds.id !== action.payload.id),
        selectedDataSource: state.selectedDataSource?.id === action.payload.id ? null : state.selectedDataSource
      };
    case 'SELECT_DATA_SOURCE':
      return {
        ...state,
        selectedDataSource: action.payload
      };
    case 'SET_DATA_SOURCES':
      return {
        ...state,
        dataSources: action.payload,
        selectedDataSource: null
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

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Save data sources to local storage whenever they change
  useEffect(() => {
    saveToLocalStorage('dataSources', state.dataSources);
  }, [state.dataSources]);

  const addDataSource = (dataSource) => {
    dispatch({ type: 'ADD_DATA_SOURCE', payload: dataSource });
  };

  const updateDataSource = (dataSource) => {
    dispatch({ type: 'UPDATE_DATA_SOURCE', payload: dataSource });
  };

  const deleteDataSource = (id) => {
    dispatch({ type: 'DELETE_DATA_SOURCE', payload: { id } });
  };

  const selectDataSource = (dataSource) => {
    dispatch({ type: 'SELECT_DATA_SOURCE', payload: dataSource });
  };

  const exportDataSources = () => {
    const filename = `data-sources-${new Date().toISOString().split('T')[0]}.json`;
    return exportToJsonFile(filename, state.dataSources);
  };

  const importDataSources = async (file) => {
    try {
      const importedData = await importFromJsonFile(file);
      if (Array.isArray(importedData)) {
        // Process each data source and add to state
        const processedData = importedData.map(dataSource => {
          if (!dataSource.id) {
            dataSource.id = uuidv4();
          }
          if (!dataSource.uploadedAt) {
            dataSource.uploadedAt = new Date().toISOString();
          }
          return dataSource;
        });
        
        dispatch({ type: 'SET_DATA_SOURCES', payload: processedData });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing data sources:', error);
      return false;
    }
  };

  return (
    <DataContext.Provider value={{
      dataSources: state.dataSources,
      selectedDataSource: state.selectedDataSource,
      isLoading: state.isLoading,
      error: state.error,
      addDataSource,
      updateDataSource,
      deleteDataSource,
      selectDataSource,
      exportDataSources,
      importDataSources
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  return useContext(DataContext);
}