import React, { useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import CsvUploader from '../components/data/CsvUploader';
import DataPreview from '../components/data/DataPreview';
import { useDataContext } from '../context/DataContext';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { createSampleDataset } from '../components/data/DataUtils';

const DataPage = () => {
  const { dataSources, deleteDataSource, addDataSource, exportDataSources, importDataSources } = useDataContext();
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const fileInputRef = useRef(null);

  const handleDataSourceClick = (dataSource) => {
    setSelectedDataSource(dataSource);
  };

  const handleCreateSample = () => {
    const sampleData = createSampleDataset();
    addDataSource(sampleData);
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
                {dataSources.map(dataSource => (
                  <Card 
                    key={dataSource.id}
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