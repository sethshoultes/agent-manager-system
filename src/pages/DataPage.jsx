import React, { useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import CsvUploader from '../components/data/CsvUploader';
import DataPreview from '../components/data/DataPreview';
import useDataStore from '../stores/dataStore';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { createSampleDataset } from '../utils/dataUtils';

const DataPage = () => {
  const dataStore = useDataStore();
  const { 
    dataSources, 
    deleteDataSource, 
    addDataSource, 
    exportDataSources, 
    importDataSources,
    isLoading,
    error
  } = dataStore;
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const fileInputRef = useRef(null);

  const handleDataSourceClick = (dataSource) => {
    setSelectedDataSource(dataSource);
  };

  const handleCreateSample = async () => {
    try {
      console.log('=== STARTING SAMPLE DATASET CREATION (ERROR TRACKING) ===');
      
      // Clear any previous errors
      window.lastSampleDataError = null;
      
      // Capture the error in global scope for debugging
      window.createSampleTry = function() {
        try {
          console.log('1. Creating sample dataset...');
          const sampleData = createSampleDataset();
          console.log('2. Sample dataset created:', { 
            id: sampleData?.id || 'missing',
            name: sampleData?.name || 'missing',
            hasData: !!sampleData?.data,
            dataType: sampleData?.data ? typeof sampleData.data : 'undefined',
            isDataArray: sampleData?.data ? Array.isArray(sampleData.data) : false,
            dataLength: sampleData?.data && Array.isArray(sampleData.data) ? sampleData.data.length : 0,
            hasDataString: !!sampleData?.dataString,
            dataStringType: sampleData?.dataString ? typeof sampleData.dataString : 'undefined',
            dataStringLength: sampleData?.dataString ? sampleData.dataString.length : 0
          });
          
          // Check for missing data
          if (!sampleData) {
            throw new Error('createSampleDataset returned null or undefined');
          }
          
          // Ensure data is actually in the sample data
          if (!sampleData.data || !Array.isArray(sampleData.data) || sampleData.data.length === 0) {
            throw new Error('Sample data array is empty or invalid');
          }
          
          // Make sure dataString is set properly
          if (!sampleData.dataString) {
            console.log('3. No dataString found in sample data, creating it now');
            sampleData.dataString = JSON.stringify(sampleData.data);
          }
          
          return sampleData;
        } catch (error) {
          console.error('Error in createSampleTry:', error);
          window.lastSampleDataError = error;
          throw error;
        }
      };
      
      // Create the sample data
      const sampleData = window.createSampleTry();
      
      // Check if sample data is valid
      console.log('4. Sample data validation passed');
      console.log('5. First data item:', sampleData.data[0]);
      
      // Create a safe copy to avoid mutation issues
      const safeSampleData = JSON.parse(JSON.stringify(sampleData));
      console.log('6. Created safe copy of sample data');
      
      // Double check the data is still valid after cloning
      if (!safeSampleData.data || !Array.isArray(safeSampleData.data) || safeSampleData.data.length === 0) {
        throw new Error('Data became invalid after JSON clone operation');
      }
      
      if (!safeSampleData.dataString) {
        console.log('7. Regenerating dataString after clone');
        safeSampleData.dataString = JSON.stringify(safeSampleData.data);
      }
      
      // Try to add the data to the store
      console.log('8. Adding sample dataset to store...');
      
      // Add to window for debugging
      window.lastSampleData = safeSampleData;
      
      // Add additional safety check
      if (!safeSampleData.id || !safeSampleData.data || !safeSampleData.dataString || !safeSampleData.columns) {
        console.error('ERROR: Sample dataset is missing required properties');
        
        // Log the state for debugging
        console.log('Sample dataset state:', {
          hasId: !!safeSampleData.id,
          hasData: !!safeSampleData.data,
          dataIsArray: Array.isArray(safeSampleData.data),
          dataLength: Array.isArray(safeSampleData.data) ? safeSampleData.data.length : 'N/A',
          hasDataString: !!safeSampleData.dataString,
          hasColumns: !!safeSampleData.columns,
          columnCount: safeSampleData.columns ? safeSampleData.columns.length : 0
        });
        
        throw new Error('Sample dataset missing required properties');
      }
      
      try {
        // Make the data immutable to prevent accidental mutations
        const immutableData = Object.freeze(JSON.parse(JSON.stringify(safeSampleData)));
        
        await addDataSource(immutableData);
        console.log('9. Sample dataset added successfully to store');
      } catch (storeError) {
        console.error('10. ERROR: Failed to add to store:', storeError);
        window.storeError = storeError;
        throw storeError;
      }
      
      // Also save directly to localStorage as backup
      try {
        const currentStored = localStorage.getItem('dataSources');
        const currentArray = currentStored ? JSON.parse(currentStored) : [];
        currentArray.push(safeSampleData);
        localStorage.setItem('dataSources', JSON.stringify(currentArray));
        console.log('11. Directly saved to localStorage as backup');
      } catch (localStorageError) {
        console.warn('12. Warning: Failed to save to localStorage:', localStorageError);
      }
      
      // Force a state update to show the new data source immediately
      console.log('13. Refreshing UI state...');
      setSelectedDataSource(null);
      
      // Alert user of success
      console.log('14. SAMPLE DATASET CREATION COMPLETED SUCCESSFULLY');
      alert('Sample dataset created successfully! Check the console for debug info.');
      
    } catch (error) {
      console.error('ERROR IN SAMPLE DATASET CREATION:', error);
      alert('Error creating sample dataset. Check the browser console for details.');
    }
  };

  const handleExportDataSources = () => {
    exportDataSources();
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportDataSources = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const success = await importDataSources(file);
      if (success) {
        // Reset the file input so the same file can be selected again if needed
        event.target.value = null;
      }
    }
  };

  return (
    <Layout>
      <div className="data-page">
        <div className="page-header">
          <h1>Data Sources</h1>
          <div className="header-actions">
            {dataSources.length === 0 && (
              <Button onClick={handleCreateSample} className="mr-2">
                Create Sample Dataset
              </Button>
            )}
            <Button 
              onClick={handleExportDataSources} 
              variant="secondary"
              disabled={dataSources.length === 0}
              className="mr-2"
            >
              Export Data Sources
            </Button>
            <Button onClick={handleImportClick} variant="secondary">
              Import Data Sources
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportDataSources} 
            />
          </div>
        </div>

        <div className="data-upload-section">
          <h2>Upload New Data</h2>
          <CsvUploader />
        </div>

        {selectedDataSource ? (
          <div className="data-preview-section">
            <div className="section-header">
              <h2>Data Preview</h2>
              <Button 
                variant="secondary"
                onClick={() => setSelectedDataSource(null)}
              >
                Back to Data Sources
              </Button>
            </div>
            <DataPreview dataSource={selectedDataSource} />
          </div>
        ) : (
          <div className="data-sources-section">
            <h2>Available Data Sources</h2>
            
            {dataSources.length === 0 ? (
              <div className="empty-state">
                <p>No data sources available. Upload a CSV file to get started.</p>
                <div className="empty-actions">
                  <Button onClick={handleImportClick} variant="secondary">
                    Import Data Sources
                  </Button>
                </div>
              </div>
            ) : (
              <div className="data-sources-grid">
                {dataSources.filter(dataSource => dataSource && typeof dataSource === 'object' && dataSource.name).map(dataSource => (
                  <Card 
                    key={dataSource.id || `ds-${Math.random()}`}
                    title={dataSource.name}
                    className="data-source-card"
                    footer={
                      <div className="card-actions">
                        <Button
                          onClick={() => handleDataSourceClick(dataSource)}
                          variant="primary"
                        >
                          View Data
                        </Button>
                        <Button 
                          variant="danger"
                          onClick={() => deleteDataSource(dataSource.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    }
                  >
                    <div className="data-source-info">
                      <p><strong>Type:</strong> {dataSource.type}</p>
                      <p><strong>Rows:</strong> {dataSource.metadata?.rowCount || 0}</p>
                      <p><strong>Columns:</strong> {dataSource.metadata?.columnCount || 0}</p>
                      <p><strong>Uploaded:</strong> {new Date(dataSource.uploadedAt).toLocaleString()}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DataPage;