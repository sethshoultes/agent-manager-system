import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useDataContext } from '../../context/DataContext';
import Button from '../shared/Button';

const CsvUploader = () => {
  const fileInputRef = useRef();
  const { addDataSource } = useDataContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsLoading(false);
        
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }

        const dataSource = {
          name: file.name,
          type: 'csv',
          data: results.data,
          columns: results.meta.fields || [],
          metadata: {
            rowCount: results.data.length,
            columnCount: results.meta.fields?.length || 0,
            sampleSize: Math.min(5, results.data.length)
          }
        };

        addDataSource(dataSource);
      },
      error: (err) => {
        setIsLoading(false);
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileSelect({ target: { files: [file] } });
    }
  };

  return (
    <div className="csv-uploader">
      <div 
        className="dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv"
          style={{ display: 'none' }}
        />
        
        {isLoading ? (
          <div className="loading">Processing CSV...</div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <p>Drag and drop a CSV file here, or click to select</p>
            <Button onClick={() => fileInputRef.current.click()}>
              Select CSV File
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default CsvUploader;