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
  if (!data || data.length === 0) {
    return <div className="no-data">No data available for visualization</div>;
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config?.xAxisKey || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config?.series?.map((series, index) => (
                <Bar 
                  key={series.dataKey}
                  dataKey={series.dataKey} 
                  fill={series.color || COLORS[index % COLORS.length]} 
                  name={series.name || series.dataKey}
                />
              )) || (
                <Bar 
                  dataKey={config?.valueKey || 'value'} 
                  fill={config?.color || COLORS[0]} 
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config?.xAxisKey || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config?.series?.map((series, index) => (
                <Line 
                  key={series.dataKey}
                  type="monotone"
                  dataKey={series.dataKey} 
                  stroke={series.color || COLORS[index % COLORS.length]} 
                  name={series.name || series.dataKey}
                />
              )) || (
                <Line 
                  type="monotone"
                  dataKey={config?.valueKey || 'value'} 
                  stroke={config?.color || COLORS[0]} 
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
                data={data}
                cx="50%"
                cy="50%"
                labelLine={config?.labelLine !== false}
                label={config?.label !== false}
                outerRadius={150}
                fill="#8884d8"
                dataKey={config?.valueKey || 'value'}
                nameKey={config?.nameKey || 'name'}
              >
                {data.map((entry, index) => (
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
      <h3 className="chart-title">{config?.title || 'Data Visualization'}</h3>
      {renderChart()}
    </div>
  );
};

export default ChartComponent;