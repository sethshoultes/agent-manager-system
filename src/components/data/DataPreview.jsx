import React, { useState, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

/**
 * DataPreview component displays a preview of a data source
 * Handles both array data and stringified JSON data formats
 * 
 * Debugging version with enhanced error handling
 */
const DataPreview = ({ dataSource }) => {
  const [previewRows, setPreviewRows] = useState(5);
  const [parseError, setParseError] = useState(null);
  const [dataFormat, setDataFormat] = useState("unknown");
  
  // Safely parse JSON string helper function
  const safeJsonParse = (jsonString) => {
    try {
      if (!jsonString) {
        setParseError("No data string provided");
        return [];
      }
      
      if (typeof jsonString !== 'string') {
        setParseError(`Expected string but got ${typeof jsonString}`);
        return [];
      }
      
      // Try to parse the string as JSON
      setDataFormat("parsing");
      const result = JSON.parse(jsonString);
      
      // Check if the result is an array
      if (Array.isArray(result)) {
        setDataFormat("array");
        setParseError(null);
        return result;
      } else if (typeof result === 'object' && result !== null) {
        // If it's an object but not an array, convert to array if possible
        setDataFormat("object");
        setParseError(null);
        const asArray = Object.values(result);
        return asArray;
      } else {
        setDataFormat(`unexpected:${typeof result}`);
        setParseError(`Parsed result is not an array or object: ${typeof result}`);
        return [];
      }
    } catch (error) {
      setParseError(`JSON parse error: ${error.message}`);
      console.error('Error parsing JSON string:', error);
      return [];
    }
  };

  // Debug data source to help diagnose issues
  console.log('DataPreview component received:', {
    hasDataSource: !!dataSource,
    dataSourceId: dataSource?.id,
    dataSourceName: dataSource?.name,
    dataType: dataSource && dataSource.data ? typeof dataSource.data : 'none',
    isArray: dataSource && dataSource.data ? Array.isArray(dataSource.data) : false,
    dataLength: dataSource && dataSource.data && Array.isArray(dataSource.data) ? dataSource.data.length : 0,
    hasDataString: dataSource && !!dataSource.dataString,
    dataStringType: dataSource && dataSource.dataString ? typeof dataSource.dataString : 'none',
    dataStringLength: dataSource && dataSource.dataString ? dataSource.dataString.length : 0,
    hasColumns: dataSource && !!dataSource.columns,
    columnsType: dataSource && dataSource.columns ? (Array.isArray(dataSource.columns) ? 'array' : typeof dataSource.columns) : 'none'
  });
  
  // Use memoization to avoid parsing JSON on every render
  const displayData = useMemo(() => {
    if (!dataSource) {
      console.log('DataPreview: No data source provided');
      return [];
    }
    
    console.log('DataPreview: Processing dataSource:', {
      id: dataSource.id,
      name: dataSource.name,
      dataType: typeof dataSource.data,
      dataKeys: dataSource.data ? Object.keys(dataSource.data).length : 0,
      dataStringType: typeof dataSource.dataString
    });
    
    // If we have an array, use it directly
    if (dataSource.data && Array.isArray(dataSource.data) && dataSource.data.length > 0) {
      console.log('DataPreview: Using data array directly, length:', dataSource.data.length);
      console.log('DataPreview: First item sample:', dataSource.data[0]);
      return dataSource.data;
    }
    
    // If we have a string that looks like it's been stringified twice, fix it
    if (dataSource.data && typeof dataSource.data === 'string' && dataSource.data.startsWith('[{')) {
      try {
        console.log('DataPreview: Data looks like stringified JSON, parsing it');
        const parsedData = JSON.parse(dataSource.data);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log('DataPreview: Successfully parsed string data into array, length:', parsedData.length);
          return parsedData;
        }
      } catch (e) {
        console.error('DataPreview: Error parsing data string:', e);
      }
    }
    
    // If we have data but it's not an array, try to handle it
    if (dataSource.data && typeof dataSource.data === 'object' && !Array.isArray(dataSource.data)) {
      console.log('DataPreview: Data is an object but not an array, attempting conversion');
      // Convert object to array if possible
      if (Object.keys(dataSource.data).length > 0) {
        const converted = Object.values(dataSource.data);
        if (Array.isArray(converted) && converted.length > 0) {
          console.log('DataPreview: Successfully converted object to array, length:', converted.length);
          return converted;
        }
      }
    }
    
    // Otherwise try to parse the dataString
    if (dataSource.dataString) {
      console.log('DataPreview: Attempting to parse dataString, length:', dataSource.dataString.length);
      console.log('DataPreview: Sample of dataString:', dataSource.dataString.substring(0, 100) + '...');
      
      try {
        // Check if it's a string that needs to be parsed
        const parsed = safeJsonParse(dataSource.dataString);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('DataPreview: Parsed dataString into array, length:', parsed.length);
          console.log('DataPreview: First parsed item sample:', parsed[0]);
          return parsed;
        } else {
          console.log('DataPreview: Parsed dataString but result is not a valid array:', {
            isArray: Array.isArray(parsed),
            length: Array.isArray(parsed) ? parsed.length : 'N/A',
            type: typeof parsed
          });
        }
      } catch (e) {
        console.error('DataPreview: Error parsing dataString:', e);
      }
    }
    
    console.log('DataPreview: No valid data found in dataSource after all attempts');
    return [];
  }, [dataSource]);
  
  // Show empty state if no valid data is available
  if (!displayData || displayData.length === 0) {
    console.log('Empty state: No data available for preview');
    
    let debugInfo = "";
    if (dataSource?.dataString && typeof dataSource.dataString === 'string') {
      // Try to extract partial data for debugging
      debugInfo = dataSource.dataString.substring(0, 100) + "...";
    }
    
    return (
      <div className="empty-state" style={{ padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "5px" }}>
        <h3 style={{ color: "red" }}>Debug: No Data Available</h3>
        
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fffaef", border: "1px solid #ffe0b2", borderRadius: "3px" }}>
          <h4>Data Source Info:</h4>
          <ul style={{ listStyle: "none", padding: "0", margin: "0", fontSize: "14px", lineHeight: "1.6" }}>
            <li><strong>Data source:</strong> {dataSource ? `Found (${typeof dataSource})` : 'Not provided'}</li>
            <li><strong>ID:</strong> {dataSource?.id || 'Missing'}</li>
            <li><strong>Name:</strong> {dataSource?.name || 'Missing'}</li>
            <li><strong>Type:</strong> {dataSource?.type || 'Unknown'}</li>
            <li><strong>Columns:</strong> {dataSource?.columns ? `${dataSource.columns.length} columns` : 'No columns'}</li>
          </ul>
        </div>
        
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fffaef", border: "1px solid #ffe0b2", borderRadius: "3px" }}>
          <h4>Data Format:</h4>
          <ul style={{ listStyle: "none", padding: "0", margin: "0", fontSize: "14px", lineHeight: "1.6" }}>
            <li><strong>Data:</strong> {dataSource?.data ? `${typeof dataSource.data} (${Array.isArray(dataSource.data) ? 'array' : 'not array'})` : 'Not provided'}</li>
            <li><strong>Data length:</strong> {Array.isArray(dataSource?.data) ? dataSource.data.length : 'N/A'}</li>
            <li><strong>DataString:</strong> {dataSource?.dataString ? `${typeof dataSource.dataString} (length: ${dataSource.dataString.length})` : 'Not provided'}</li>
            <li><strong>Parse result:</strong> {dataFormat}</li>
            {parseError && <li style={{ color: "red" }}><strong>Parse error:</strong> {parseError}</li>}
          </ul>
        </div>
        
        {debugInfo && (
          <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fffaef", border: "1px solid #ffe0b2", borderRadius: "3px" }}>
            <h4>Data Sample:</h4>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", maxHeight: "100px", overflow: "auto" }}>
              {debugInfo}
            </pre>
          </div>
        )}
        
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Instructions: Click "Create Sample Dataset" again to retry.</p>
        </div>
      </div>
    );
  }

  const handleShowMore = () => {
    setPreviewRows(prev => Math.min(prev + 5, displayData.length));
  };

  const handleShowLess = () => {
    setPreviewRows(prev => Math.max(prev - 5, 5));
  };

  // Ensure we have column data to display
  let columns = [];
  
  // Try to get columns from different sources (with safeguards)
  if (dataSource?.columns && Array.isArray(dataSource.columns) && dataSource.columns.length > 0) {
    // Use columns from data source if available
    columns = dataSource.columns;
    console.log(`Using ${columns.length} columns from dataSource.columns`);
  } else if (displayData.length > 0 && displayData[0] && typeof displayData[0] === 'object') {
    // Extract column names from the first data item
    columns = Object.keys(displayData[0]);
    console.log(`Extracted ${columns.length} columns from first data item`);
  } else {
    console.log('No columns available, using empty array');
  }
    
  // Get a display sample
  const sampleData = displayData.slice(0, previewRows);
  
  return (
    <Card
      title={`Data Preview: ${dataSource?.name || 'Unnamed Dataset'}`}
      className="data-preview-card"
      footer={
        <div className="preview-controls">
          <div className="preview-info">
            Showing {previewRows} of {displayData.length} rows
          </div>
          <div className="preview-actions">
            {previewRows > 5 && (
              <Button
                variant="secondary"
                onClick={handleShowLess}
                size="small"
              >
                Show Less
              </Button>
            )}
            {previewRows < displayData.length && (
              <Button
                variant="secondary"
                onClick={handleShowMore}
                size="small"
              >
                Show More
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="data-preview">
        <div className="data-metadata">
          <p><strong>Type:</strong> {dataSource?.type || 'Unknown'}</p>
          <p><strong>Total Rows:</strong> {displayData.length}</p>
          <p><strong>Columns:</strong> {columns.length}</p>
          <p><strong>Uploaded:</strong> {dataSource?.uploadedAt ? new Date(dataSource.uploadedAt).toLocaleString() : 'Unknown'}</p>
          <p><strong>Data Format:</strong> {dataFormat}</p>
          {parseError && <p style={{ color: "red" }}><strong>Parse Error:</strong> {parseError}</p>}
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {columns.map(column => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{rowIndex + 1}</td>
                  {columns.map(column => (
                    <td key={`${rowIndex}-${column}`}>
                      {row[column] !== undefined && row[column] !== null 
                        ? String(row[column]) 
                        : <span style={{color: '#999', fontStyle: 'italic'}}>empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default DataPreview;