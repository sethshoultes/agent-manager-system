import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import ChartComponent from './ChartComponent';

const VisualizationSelector = ({ dataSource, onCreateVisualization }) => {
  const [chartType, setChartType] = useState('bar');
  const [title, setTitle] = useState('');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  // Get only string/categorical columns
  const getCategoricalColumns = () => {
    if (!dataSource || !dataSource.data || dataSource.data.length === 0) {
      return [];
    }

    return dataSource.columns.filter(column => {
      // Check the first few rows to determine if it's likely categorical
      const sampleSize = Math.min(5, dataSource.data.length);
      const samples = dataSource.data.slice(0, sampleSize);
      const stringValues = samples.filter(row => 
        typeof row[column] === 'string' && isNaN(parseFloat(row[column]))
      );
      return stringValues.length > 0;
    });
  };

  // Get only numeric columns
  const getNumericColumns = () => {
    if (!dataSource || !dataSource.data || dataSource.data.length === 0) {
      return [];
    }

    return dataSource.columns.filter(column => {
      // Check the first few rows to determine if it's likely numeric
      const sampleSize = Math.min(5, dataSource.data.length);
      const samples = dataSource.data.slice(0, sampleSize);
      const numericValues = samples.filter(row => 
        !isNaN(parseFloat(row[column])) && row[column] !== null && row[column] !== ''
      );
      return numericValues.length > sampleSize / 2;
    });
  };

  const handlePreview = () => {
    try {
      if (!xAxis || (!yAxis && chartType !== 'pie')) {
        setError('Please select both X and Y axis for visualization');
        setPreviewData(null);
        return;
      }

      setError(null);
      
      let config = {
        title: title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      };
      
      let preparedData;

      if (chartType === 'pie') {
        // For pie charts, we need to aggregate data
        const aggregated = {};
        dataSource.data.forEach(row => {
          const key = String(row[xAxis]);
          aggregated[key] = (aggregated[key] || 0) + 1;
        });
        
        preparedData = Object.entries(aggregated)
          .map(([name, value]) => ({ name, value }))
          .slice(0, 10); // Limit to top 10 for readability
        
        config = {
          ...config,
          nameKey: 'name',
          valueKey: 'value'
        };
      } else {
        // For bar and line charts
        config = {
          ...config,
          xAxisKey: xAxis,
          series: [{
            dataKey: yAxis,
            name: yAxis,
            color: '#0088FE'
          }]
        };
        
        // Limit data points for readability
        preparedData = dataSource.data.slice(0, 20);
      }

      setPreviewData({
        type: chartType,
        data: preparedData,
        config: config
      });
    } catch (err) {
      setError(`Error generating preview: ${err.message}`);
      setPreviewData(null);
    }
  };

  const handleCreate = () => {
    if (!previewData) {
      handlePreview();
      return;
    }

    if (onCreateVisualization) {
      onCreateVisualization(previewData);
    }
  };

  return (
    <Card
      title="Create Visualization"
      className="visualization-selector"
    >
      <div className="visualization-form">
        <div className="form-group">
          <label htmlFor="chart-title">Chart Title</label>
          <input
            type="text"
            id="chart-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chart title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="chart-type">Chart Type</label>
          <select
            id="chart-type"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="x-axis">{chartType === 'pie' ? 'Category Field' : 'X Axis'}</label>
          <select
            id="x-axis"
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
          >
            <option value="">Select a field</option>
            {getCategoricalColumns().map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </div>

        {chartType !== 'pie' && (
          <div className="form-group">
            <label htmlFor="y-axis">Y Axis</label>
            <select
              id="y-axis"
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
            >
              <option value="">Select a field</option>
              {getNumericColumns().map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-actions">
          <Button 
            onClick={handlePreview}
            disabled={!dataSource || !xAxis || (!yAxis && chartType !== 'pie')}
          >
            Preview
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!dataSource || !xAxis || (!yAxis && chartType !== 'pie')}
            variant="primary"
          >
            Create Visualization
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {previewData && (
        <div className="visualization-preview">
          <h3>Preview</h3>
          <ChartComponent
            type={previewData.type}
            data={previewData.data}
            config={previewData.config}
          />
        </div>
      )}
    </Card>
  );
};

export default VisualizationSelector;