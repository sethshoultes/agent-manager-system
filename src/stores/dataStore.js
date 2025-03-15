import { create } from 'zustand';
import { dataSources as dataSourceService } from '../services/apiClient';
import { exportToJsonFile, importFromJsonFile } from '../services/fileStorageService';
import { auth } from '../services/apiClient';
import { createSampleDataset } from '../utils/dataUtils';

// Create sample data once rather than regenerating it every time
const sampleSalesData = (() => {
  console.log('Creating sample data sources (once)...');
  
  // Create smaller sample data for better storage compatibility
  const data = [];
  
  // Generate sample data for a sales dataset - limit to 25 items to avoid storage issues
  for (let i = 0; i < 25; i++) {
    data.push({
      id: i + 1,
      name: `Product ${i + 1}`,
      category: ['Electronics', 'Clothing', 'Home', 'Books'][Math.floor(Math.random() * 4)],
      value: Math.round(Math.random() * 1000),
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      inStock: Math.random() > 0.3 ? 'Yes' : 'No',
      date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
    });
  }
  
  return data;
})();

// Helper to create a sample dataset
const createSampleDataSources = () => {
  // Create dataString for compatibility with DataPreview component
  const dataString = JSON.stringify(sampleSalesData);
  
  return [
    {
      id: 'sample-data-1',
      name: 'Sample Sales Data.csv',
      description: 'Sample sales data for demonstration',
      type: 'csv',
      // Store data both ways for maximum compatibility
      data: sampleSalesData,
      dataString: dataString, // Add dataString explicitly
      columns: ['id', 'name', 'category', 'value', 'price', 'inStock', 'date'],
      metadata: {
        rowCount: sampleSalesData.length,
        columnCount: 7,
        sampleSize: 5
      },
      uploadedAt: new Date().toISOString()
    }
  ];
};

// Create the store with a stable reference via devtools middleware
const useDataStore = create(
  (set, get) => ({
  // State
  dataSources: [],
  selectedDataSource: null,
  isLoading: false,
  error: null,
  initialized: false, // Add this to track initialization state
  
  // Selectors
  getDataSourceById: (id) => {
    return get().dataSources.find(ds => ds.id === id);
  },
  
  // Actions
  fetchDataSources: async () => {
    // Skip if already initialized or loading
    if (get().initialized || get().isLoading) {
      console.log('Data sources already initialized, skipping fetch');
      return get().dataSources;
    }
    
    console.log('Initializing data sources...');
    
    set({ 
      isLoading: true,
      initialized: false,
      error: null
    });
    
    try {
      // Try to load from localStorage first
      let dataSources = [];
      try {
        const storedData = localStorage.getItem('dataSources');
        if (storedData) {
          dataSources = JSON.parse(storedData);
          console.log('Loaded data sources from localStorage:', {
            count: dataSources.length,
            hasData: dataSources.length > 0
          });
          
          // Verify data integrity
          if (Array.isArray(dataSources) && dataSources.length > 0) {
            // Check if the loaded data is valid
            const isValid = dataSources.every(ds => 
              ds && typeof ds === 'object' && ds.id && ds.name && 
              (ds.data || ds.dataString)
            );
            
            if (!isValid) {
              console.warn('Some loaded data sources are invalid, resetting to empty array');
              dataSources = [];
            }
          }
        } else {
          console.log('No data sources found in localStorage, creating sample data');
          
          // Create a sample dataset if none exists
          const sampleDataset = createSampleDataset();
          dataSources = [sampleDataset];
          
          // Save to localStorage
          localStorage.setItem('dataSources', JSON.stringify(dataSources));
          console.log('Created and saved sample dataset to localStorage');
        }
      } catch (e) {
        console.warn('Error loading from localStorage, using sample data:', e);
        
        // Create a sample dataset on error
        const sampleDataset = createSampleDataset();
        dataSources = [sampleDataset];
      }
      
      // Set the state with loaded data or sample data
      set({ 
        dataSources: dataSources,
        isLoading: false,
        initialized: true
      });
      
      // Don't force offline mode anymore
      // localStorage.setItem('offline_mode', 'true');
      
      console.log('Data store initialized with', dataSources.length, 'data sources');
      return dataSources;
    } catch (error) {
      console.error('Error in data source initialization:', error);
      set({ 
        isLoading: false,
        error: error.message || 'Failed to initialize data sources',
        initialized: true,
        dataSources: [] // Reset to empty on error
      });
      return [];
    }
  },
  
  addDataSource: async (dataSource) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('DataStore: Adding data source', { 
        name: dataSource.name, 
        id: dataSource.id,
        hasData: !!dataSource.data,
        dataType: typeof dataSource.data,
        isArray: Array.isArray(dataSource.data),
        dataLength: dataSource.data?.length || 0
      });
      
      // Always skip API and store locally to avoid 413 Payload Too Large errors
      const newDataSource = { 
        ...dataSource, 
        id: dataSource.id || Math.random().toString(36).substr(2, 9),
        uploadedAt: dataSource.uploadedAt || new Date().toISOString()
      };
      
      // Store a clone of the data to prevent reference issues
      const safeDataSource = JSON.parse(JSON.stringify(newDataSource));
      
      console.log('Adding data source to local state', {
        id: safeDataSource.id,
        name: safeDataSource.name,
        dataIsArray: Array.isArray(safeDataSource.data),
        dataLength: Array.isArray(safeDataSource.data) ? safeDataSource.data.length : 0
      });
      
      // Update the store with the new data source
      const newState = {
        dataSources: [...get().dataSources, safeDataSource],
        isLoading: false
      };
      
      // Set the state
      set(newState);
      
      // Also save to localStorage for persistence
      try {
        localStorage.setItem('dataSources', JSON.stringify(newState.dataSources));
        console.log('Saved data sources to localStorage, count:', newState.dataSources.length);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      
      return safeDataSource;
    } catch (error) {
      console.error('Error adding data source:', error);
      set({ 
        isLoading: false,
        error: error.message || 'Failed to add data source'
      });
      return null;
    }
  },
  
  updateDataSource: async (dataSource) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await dataSourceService.update(dataSource.id, dataSource);
      
      set(state => ({
        dataSources: state.dataSources.map(ds => 
          ds.id === dataSource.id ? { ...ds, ...response.data.dataSource } : ds
        ),
        isLoading: false
      }));
      
      return response.data.dataSource;
    } catch (error) {
      // For offline mode, update locally
      if (error.message === 'Network Error') {
        console.warn('API unreachable, updating data source in local state only');
        
        set(state => ({
          dataSources: state.dataSources.map(ds => 
            ds.id === dataSource.id ? { ...ds, ...dataSource } : ds
          ),
          isLoading: false
        }));
        
        return dataSource;
      } else {
        console.error('Error updating data source:', error);
        set({ 
          isLoading: false,
          error: error.message || 'Failed to update data source'
        });
        throw error;
      }
    }
  },
  
  deleteDataSource: async (id) => {
    set({ isLoading: true, error: null });
    
    // Helper function to delete from localStorage
    const deleteLocally = () => {
      console.log('Deleting data source locally, id:', id);
      
      // Update in localStorage
      try {
        const storedDataSources = JSON.parse(localStorage.getItem('dataSources') || '[]');
        console.log('Found', storedDataSources.length, 'data sources in localStorage');
        
        const updatedDataSources = storedDataSources.filter(ds => ds.id !== id);
        console.log('After filtering, have', updatedDataSources.length, 'data sources');
        
        localStorage.setItem('dataSources', JSON.stringify(updatedDataSources));
        console.log('Saved updated data sources to localStorage');
      } catch (e) {
        console.error('Failed to delete data source from localStorage:', e);
      }
      
      // Force offline mode
      localStorage.setItem('offline_mode', 'true');
      
      // Update state
      set(state => ({
        dataSources: state.dataSources.filter(ds => ds.id !== id),
        selectedDataSource: state.selectedDataSource?.id === id ? null : state.selectedDataSource,
        isLoading: false
      }));
      
      return true;
    };
    
    // Always use localStorage for testing
    return deleteLocally();
    
    try {
      // Check if we're in offline mode or API is unavailable
      const isOfflineMode = localStorage.getItem('offline_mode') === 'true';
      
      if (isOfflineMode) {
        return deleteLocally();
      }
      
      // Call API if not in offline mode
      await dataSourceService.delete(id);
      
      // Update state on success
      set(state => ({
        dataSources: state.dataSources.filter(ds => ds.id !== id),
        selectedDataSource: state.selectedDataSource?.id === id ? null : state.selectedDataSource,
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      console.warn('Error deleting from API, falling back to local delete:', error.message);
      return deleteLocally();
    }
  },
  
  selectDataSource: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Find in current state first (to avoid unnecessary API calls)
      const existingDataSource = get().dataSources.find(ds => ds.id === id);
      
      if (existingDataSource) {
        set({ 
          selectedDataSource: existingDataSource,
          isLoading: false 
        });
        return existingDataSource;
      }
      
      // If not in state, try to get from API
      const response = await dataSourceService.getById(id);
      set({ 
        selectedDataSource: response.data.dataSource,
        isLoading: false
      });
      
      return response.data.dataSource;
    } catch (error) {
      console.error('Error selecting data source:', error);
      set({ 
        isLoading: false,
        error: error.message || 'Failed to select data source'
      });
      throw error;
    }
  },
  
  clearSelectedDataSource: () => {
    set({ selectedDataSource: null });
  },
  
  // Import/Export functions
  exportDataSources: async () => {
    try {
      const dataSources = get().dataSources;
      const filename = `data-sources-${new Date().toISOString().split('T')[0]}.json`;
      return exportToJsonFile(filename, dataSources);
    } catch (error) {
      console.error('Error exporting data sources:', error);
      set({ error: error.message || 'Failed to export data sources' });
      return false;
    }
  },
  
  importDataSources: async (file) => {
    set({ isLoading: true, error: null });
    
    try {
      const importedData = await importFromJsonFile(file);
      
      if (Array.isArray(importedData)) {
        if (auth.isAuthenticated()) {
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
            set({ 
              dataSources: response.data.dataSources,
              isLoading: false
            });
          } catch (apiError) {
            // Fallback to local state if API is unreachable
            if (apiError.message === 'Network Error') {
              console.warn('API unreachable, importing data sources to local state only');
              
              // Add IDs if missing
              const processedData = importedData.map(dataSource => ({
                ...dataSource,
                id: dataSource.id || Math.random().toString(36).substr(2, 9),
                uploadedAt: dataSource.uploadedAt || new Date().toISOString()
              }));
              
              set({ 
                dataSources: processedData,
                isLoading: false
              });
            } else {
              throw apiError;
            }
          }
        } else {
          // Not authenticated, just update local state
          const processedData = importedData.map(dataSource => ({
            ...dataSource,
            id: dataSource.id || Math.random().toString(36).substr(2, 9),
            uploadedAt: dataSource.uploadedAt || new Date().toISOString()
          }));
          
          set({ 
            dataSources: processedData,
            isLoading: false
          });
        }
        
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Error importing data sources:', error);
      set({ 
        isLoading: false,
        error: error.message || 'Failed to import data sources'
      });
      return false;
    }
  }
}));

export default useDataStore;