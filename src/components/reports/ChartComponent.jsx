import React from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B'];

const ChartComponent = ({ type, data, config }) => {
  // Validate and normalize data
  const normalizeData = () => {
    if (!data) return [];
    
    // If data is not an array, try to handle it
    if (!Array.isArray(data)) {
      console.warn('Chart data is not an array, attempting to convert', data);
      
      // Try to handle specific formats we know about
      if (data.categories && Array.isArray(data.categories) && data.values && Array.isArray(data.values)) {
        return data.categories.map((category, i) => ({
          name: category,
          value: data.values[i] || 0
        }));
      }
      
      if (data.days && Array.isArray(data.days) && data.values && Array.isArray(data.values)) {
        return data.days.map((day, i) => ({
          name: `Day ${day}`,
          value: data.values[i] || 0
        }));
      }
      
      // As a last resort, try to convert to array if it's an object
      if (typeof data === 'object') {
        try {
          return Object.entries(data).map(([key, value]) => ({
            name: key,
            value: typeof value === 'number' ? value : 0
          }));
        } catch (e) {
          console.error('Failed to convert object data to array', e);
          return [];
        }
      }
      
      return [];
    }
    
    // Handle empty array
    if (data.length === 0) return [];
    
    // Data is already an array, ensure it has the right format
    return data.map(item => {
      if (typeof item !== 'object') {
        return { name: String(item), value: 1 };
      }
      return item;
    });
  };
  
  const normalizedData = normalizeData();
  
  if (!normalizedData || normalizedData.length === 0) {
    return (
      <div className="no-data" style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px dashed #dee2e6',
        borderRadius: '4px',
        color: '#6c757d'
      }}>
        No data available for visualization
      </div>
    );
  }
  
  // Normalize config to avoid errors
  const safeConfig = {
    ...(config || {}),
    title: config?.title || 'Data Visualization',
    xAxisKey: config?.xAxisKey || 'name',
    valueKey: config?.valueKey || 'value'
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={safeConfig.xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {safeConfig.series?.map((series, index) => (
                <Bar 
                  key={series.dataKey || `series-${index}`}
                  dataKey={series.dataKey || safeConfig.valueKey} 
                  fill={series.color || COLORS[index % COLORS.length]} 
                  name={series.name || series.dataKey || safeConfig.valueKey}
                />
              )) || (
                <Bar 
                  dataKey={safeConfig.valueKey} 
                  fill={safeConfig.color || COLORS[0]} 
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={safeConfig.xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {safeConfig.series?.map((series, index) => (
                <Line 
                  key={series.dataKey || `series-${index}`}
                  type="monotone"
                  dataKey={series.dataKey || safeConfig.valueKey} 
                  stroke={series.color || COLORS[index % COLORS.length]} 
                  name={series.name || series.dataKey || safeConfig.valueKey}
                />
              )) || (
                <Line 
                  type="monotone"
                  dataKey={safeConfig.valueKey} 
                  stroke={safeConfig.color || COLORS[0]} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                labelLine={safeConfig.labelLine !== false}
                label={safeConfig.label !== false}
                outerRadius={150}
                fill="#8884d8"
                dataKey={safeConfig.valueKey}
                nameKey={safeConfig.nameKey || safeConfig.xAxisKey}
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className="chart-container">
      <h3 className="chart-title">{safeConfig.title}</h3>
      {renderChart()}
    </div>
  );
};

export default ChartComponent;