import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

const DataPreview = ({ dataSource }) => {
  const [previewRows, setPreviewRows] = useState(5);
  
  if (!dataSource || !dataSource.data || dataSource.data.length === 0) {
    return (
      <div className="empty-state">
        <p>No data available for preview</p>
      </div>
    );
  }

  const handleShowMore = () => {
    setPreviewRows(prev => Math.min(prev + 5, dataSource.data.length));
  };

  const handleShowLess = () => {
    setPreviewRows(prev => Math.max(prev - 5, 5));
  };

  return (
    <Card
      title={`Data Preview: ${dataSource.name}`}
      className="data-preview-card"
      footer={
        <div className="preview-controls">
          <div className="preview-info">
            Showing {previewRows} of {dataSource.data.length} rows
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
            {previewRows < dataSource.data.length && (
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
          <p><strong>Type:</strong> {dataSource.type}</p>
          <p><strong>Total Rows:</strong> {dataSource.data.length}</p>
          <p><strong>Columns:</strong> {dataSource.columns.length}</p>
          <p><strong>Uploaded:</strong> {new Date(dataSource.uploadedAt).toLocaleString()}</p>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {dataSource.columns.map(column => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataSource.data.slice(0, previewRows).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{rowIndex + 1}</td>
                  {dataSource.columns.map(column => (
                    <td key={`${rowIndex}-${column}`}>{String(row[column] !== undefined ? row[column] : '')}</td>
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