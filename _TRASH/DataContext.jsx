import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { dataSources as dataSourceService } from '../services/apiClient';
import { exportToJsonFile, importFromJsonFile } from '../services/fileStorageService';
import { auth } from '../services/apiClient';

const DataContext = createContext();

const initialState = {
  dataSources: [],
  selectedDataSource: null,
  isLoading: false,
  error: null
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'FETCH_DATA_SOURCES_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_DATA_SOURCES_SUCCESS':
      return {
        ...state,
        dataSources: action.payload,
        isLoading: false,
        error: null
      };
    case 'FETCH_DATA_SOURCES_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_DATA_SOURCE':
      return {
        ...state,
        dataSources: [...state.dataSources, action.payload]
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

  // Fetch data sources when component mounts and user is authenticated
  useEffect(() => {
    const fetchDataSources = async () => {
      // Debug function to check localStorage status
      const checkLocalStorage = () => {
        try {
          const currentSize = (localStorage.getItem('dataSources') || '').length;
          console.log('Current localStorage size for dataSources:', currentSize, 'bytes');
          
          // Calculate remaining space
          let totalUsed = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            totalUsed += (localStorage.getItem(key) || '').length + key.length;
          }
          console.log('Total localStorage used:', totalUsed, 'bytes (approximate)');
          
          return { currentSize, totalUsed };
        } catch (e) {
          console.error('Error checking localStorage:', e);
          return { error: e.message };
        }
      };
      
      // Check localStorage status before we start
      checkLocalStorage();
      // For demo purposes, create sample data if none exists
      const createSampleDataSources = () => {
        console.log('Creating sample data sources for demo...');
        
        // Create smaller sample data for better storage compatibility
        const sampleData = [];
        
        // Generate sample data for a sales dataset - limit to 25 items to avoid storage issues
        for (let i = 0; i < 25; i++) {
          sampleData.push({
            id: i + 1,
            name: `Product ${i + 1}`,
            category: ['Electronics', 'Clothing', 'Home', 'Books'][Math.floor(Math.random() * 4)],
            value: Math.round(Math.random() * 1000),
            price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
            inStock: Math.random() > 0.3 ? 'Yes' : 'No',
            date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
          });
        }
        
        console.log('Generated sample data with', sampleData.length, 'items');
        
        // Create a stringified version for storage
        const dataString = JSON.stringify(sampleData);
        console.log('Sample data string size:', dataString.length, 'bytes');
        
        const sampleDataSources = [
          {
            id: 'sample-data-1',
            name: 'Sample Sales Data.csv',
            description: 'Sample sales data for demonstration',
            type: 'csv',
            // Store data both ways for maximum compatibility
            data: sampleData.slice(0, 25), // Limit in-memory data
            dataString: dataString, // Keep full data as string for parsing
            columns: ['id', 'name', 'category', 'value', 'price', 'inStock', 'date'],
            metadata: {
              rowCount: sampleData.length,
              columnCount: 7,
              sampleSize: 5
            },
            uploadedAt: new Date().toISOString()
          }
        ];
        
        let returnDataSources = sampleDataSources;
        
        // Save to localStorage for persistence
        try {
          // Log to debug
          console.log('Saving sample data source. Size:', 
            JSON.stringify(sampleDataSources).length,
            'Sample data size:', JSON.stringify(sampleData).length);
            
          localStorage.setItem('dataSources', JSON.stringify(sampleDataSources));
          console.log('Sample data sources saved to localStorage successfully');
        } catch (e) {
          console.error('Error saving to localStorage:', e);
          // Try to save without the data array (may be too large)
          const slimDataSources = sampleDataSources.map(ds => ({
            ...ds,
            data: ds.data.slice(0, 10), // Just keep 10 items as sample
          }));
          
          try {
            localStorage.setItem('dataSources', JSON.stringify(slimDataSources));
            console.log('Slimmed sample data sources saved to localStorage');
            // Important: Return the slimmed version to match what's in localStorage
            returnDataSources = slimDataSources;
          } catch (innerError) {
            console.error('Still failed to save to localStorage:', innerError);
            // Create a minimal fallback version that will definitely fit
            const minimalDataSources = sampleDataSources.map(ds => ({
              ...ds,
              data: ds.data.slice(0, 3), // Just keep 3 items as absolute minimum
              dataString: JSON.stringify(ds.data) // Store full data as string instead
            }));
            
            try {
              localStorage.setItem('dataSources', JSON.stringify(minimalDataSources));
              console.log('Minimal sample data sources saved to localStorage');
              returnDataSources = minimalDataSources;
            } catch (finalError) {
              console.error('Cannot save to localStorage at all:', finalError);
            }
          }
        }
        
        return returnDataSources;
      };
      
      try {
        dispatch({ type: 'FETCH_DATA_SOURCES_START' });
        
        if (auth.isAuthenticated()) {
          // If authenticated, try to get data sources from API
          try {
            const response = await dataSourceService.getAll();
            dispatch({ 
              type: 'FETCH_DATA_SOURCES_SUCCESS', 
              payload: response.data.dataSources 
            });
          } catch (error) {
            console.error('Error fetching data sources:', error);
            
            // Fallback to localStorage if API is unreachable
            if (error.message === 'Network Error') {
              console.warn('API unreachable, falling back to localStorage for data sources');
              const savedDataSources = JSON.parse(localStorage.getItem('dataSources') || '[]');
              
              // If no data sources in localStorage, create samples
              const dataSources = savedDataSources.length > 0 ? savedDataSources : createSampleDataSources();
              
              // Debug data sources before dispatch
              console.log('Data sources to be dispatched:', 
                          dataSources.length, 
                          'sources, first source data length:', 
                          dataSources[0]?.data?.length || 0,
                          'data string length:', 
                          dataSources[0]?.dataString?.length || 0);
              
              // Debug data format
              if (dataSources.length > 0) {
                console.log('First data source structure:', 
                            Object.keys(dataSources[0]),
                            'has data array:', 
                            Array.isArray(dataSources[0]?.data),
                            'data type:', 
                            typeof dataSources[0]?.data);
              }
              
              dispatch({ 
                type: 'FETCH_DATA_SOURCES_SUCCESS',
                payload: dataSources
              });
            } else {
              dispatch({ 
                type: 'FETCH_DATA_SOURCES_ERROR', 
                payload: error.message || 'Failed to fetch data sources' 
              });
            }
          }
        } else {
          // Not authenticated, use localStorage
          console.warn('No authentication, using localStorage for data sources');
          const savedDataSources = JSON.parse(localStorage.getItem('dataSources') || '[]');
          
          // If no data sources in localStorage, create samples
          const dataSources = savedDataSources.length > 0 ? savedDataSources : createSampleDataSources();
          
          // Debug data sources before dispatch
          console.log('Data sources to be dispatched (no auth):', 
                      dataSources.length, 
                      'sources, first source data length:', 
                      dataSources[0]?.data?.length || 0,
                      'data string length:', 
                      dataSources[0]?.dataString?.length || 0);
          
          // Debug data format
          if (dataSources.length > 0) {
            console.log('First data source structure (no auth):', 
                        Object.keys(dataSources[0]),
                        'has data array:', 
                        Array.isArray(dataSources[0]?.data),
                        'data type:', 
                        typeof dataSources[0]?.data);
          }
          
          dispatch({ 
            type: 'FETCH_DATA_SOURCES_SUCCESS',
            payload: dataSources
          });
        }
      } catch (error) {
        console.error('Error in data source initialization:', error);
        dispatch({ 
          type: 'FETCH_DATA_SOURCES_ERROR',
          payload: error.message || 'Failed to initialize data sources'
        });
      }
    };

    fetchDataSources();
  }, []);

  const addDataSource = async (dataSource) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Process CSV data for API upload
      const dataSourceForApi = {
        name: dataSource.name,
        description: dataSource.description || '',
        type: dataSource.type || 'csv',
        // Convert data array to string for API storage if it's an array
        data: typeof dataSource.data === 'object' ? JSON.stringify(dataSource.data) : dataSource.data,
        schema: dataSource.columns ? { columns: dataSource.columns } : dataSource.schema,
        configuration: dataSource.metadata ? { metadata: dataSource.metadata } : dataSource.configuration
      };
      
      try {
        const response = await dataSourceService.create(dataSourceForApi);
        dispatch({ type: 'ADD_DATA_SOURCE', payload: response.data.dataSource });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data.dataSource;
      } catch (apiError) {
        // Fallback to localStorage if API is unreachable
        if (apiError.message === 'Network Error') {
          console.warn('API unreachable, falling back to localStorage for adding data source');
          
          const newDataSource = { 
            ...dataSource, 
            id: Math.random().toString(36).substr(2, 9),
            uploadedAt: new Date().toISOString()
          };
          
          // Update local state
          dispatch({ type: 'ADD_DATA_SOURCE', payload: newDataSource });
          
          // Save to localStorage
          const savedDataSources = JSON.parse(localStorage.getItem('dataSources') || '[]');
          localStorage.setItem('dataSources', JSON.stringify([...savedDataSources, newDataSource]));
          
          dispatch({ type: 'SET_LOADING', payload: false });
          return newDataSource;
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error adding data source:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add data source' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const updateDataSource = async (dataSource) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await dataSourceService.update(dataSource.id, dataSource);
      dispatch({ type: 'UPDATE_DATA_SOURCE', payload: response.data.dataSource });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.dataSource;
    } catch (error) {
      console.error('Error updating data source:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update data source' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const deleteDataSource = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await dataSourceService.delete(id);
      dispatch({ type: 'DELETE_DATA_SOURCE', payload: { id } });
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } catch (error) {
      console.error('Error deleting data source:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete data source' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const selectDataSource = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await dataSourceService.getById(id);
      dispatch({ type: 'SELECT_DATA_SOURCE', payload: response.data.dataSource });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.dataSource;
    } catch (error) {
      console.error('Error selecting data source:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to select data source' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const exportDataSources = async () => {
    try {
      const response = await dataSourceService.getAll();
      const dataSources = response.data.dataSources;
      const filename = `data-sources-${new Date().toISOString().split('T')[0]}.json`;
      return exportToJsonFile(filename, dataSources);
    } catch (error) {
      console.error('Error exporting data sources:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to export data sources' });
      return false;
    }
  };

  const importDataSources = async (file) => {
    try {
      const importedData = await importFromJsonFile(file);
      if (Array.isArray(importedData)) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          // Process each data source and add it to the API
          for (const dataSource of importedData) {
            const dataSourceData = {
              name: dataSource.name,
              description: dataSource.description || '',
              type: dataSource.type || 'csv',
              schema: dataSource.schema || {},
              configuration: dataSource.configuration || {},
              data: typeof dataSource.data === 'object' ? JSON.stringify(dataSource.data) : dataSource.data
            };
            
            await dataSourceService.create(dataSourceData);
          }
          
          // Fetch updated list
          const response = await dataSourceService.getAll();
          dispatch({ type: 'SET_DATA_SOURCES', payload: response.data.dataSources });
        } catch (apiError) {
          // Fallback to localStorage if API is unreachable
          if (apiError.message === 'Network Error') {
            console.warn('API unreachable, falling back to localStorage for importing data sources');
            
            // Process imported data for localStorage
            const processedData = importedData.map(dataSource => ({
              ...dataSource,
              id: dataSource.id || Math.random().toString(36).substr(2, 9),
              uploadedAt: dataSource.uploadedAt || new Date().toISOString()
            }));
            
            // Save to localStorage
            localStorage.setItem('dataSources', JSON.stringify(processedData));
            
            // Update state
            dispatch({ type: 'SET_DATA_SOURCES', payload: processedData });
          } else {
            throw apiError;
          }
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing data sources:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to import data sources' });
      dispatch({ type: 'SET_LOADING', payload: false });
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