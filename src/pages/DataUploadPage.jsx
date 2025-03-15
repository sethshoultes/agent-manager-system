import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import CsvUploader from '../components/data/CsvUploader';
import useDataStore from '../stores/dataStore';

const DataUploadPage = () => {
  const dataStore = useDataStore();
  const { addDataSource } = dataStore;
  const navigate = useNavigate();

  const handleDataUploaded = (dataSource) => {
    // Navigate to the data list page after successful upload
    navigate('/data');
  };

  return (
    <Layout>
      <div className="data-upload-page">
        <div className="page-header">
          <h1>Upload Data</h1>
        </div>
        
        <div className="upload-content">
          <p className="upload-description">
            Upload a CSV file to create a new data source for analysis. 
            The file should have a header row with column names.
          </p>
          
          <div className="uploader-container">
            <CsvUploader onUploadComplete={handleDataUploaded} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DataUploadPage;