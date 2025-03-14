/**
 * Utility functions for data processing and manipulation
 */

/**
 * Analyzes a dataset and returns basic descriptive statistics
 */
export const analyzeData = (data, columns) => {
  if (!data || !columns || data.length === 0 || columns.length === 0) {
    return {};
  }

  const numericColumns = columns.filter(column => {
    // Find numeric columns
    const values = data
      .map(row => row[column])
      .filter(value => value !== null && value !== undefined && value !== '');
    
    const numericValues = values.filter(value => !isNaN(parseFloat(value)));
    return numericValues.length > values.length / 2;
  });

  const categoricalColumns = columns.filter(column => {
    // Find categorical columns
    const values = data
      .map(row => row[column])
      .filter(value => value !== null && value !== undefined && value !== '');
    
    const uniqueValues = new Set(values);
    // Heuristic: if there are fewer than 20% unique values, it's likely categorical
    return uniqueValues.size < values.length * 0.2 || uniqueValues.size < 15;
  });

  const statistics = {};

  // Calculate numeric statistics
  numericColumns.forEach(column => {
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(value => !isNaN(value));
    
    if (values.length === 0) return;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    statistics[column] = { 
      mean, 
      median, 
      min, 
      max, 
      stdDev,
      count: values.length 
    };
  });

  // Calculate categorical statistics
  const categoricalStats = {};
  categoricalColumns.forEach(column => {
    const valueMap = {};
    data.forEach(row => {
      const value = row[column];
      if (value !== null && value !== undefined && value !== '') {
        valueMap[value] = (valueMap[value] || 0) + 1;
      }
    });
    
    const sortedEntries = Object.entries(valueMap).sort((a, b) => b[1] - a[1]);
    const topCategories = sortedEntries.slice(0, 10);
    
    categoricalStats[column] = {
      uniqueCount: Object.keys(valueMap).length,
      topCategories: topCategories.map(([category, count]) => ({ 
        category, 
        count, 
        percentage: (count / data.length * 100).toFixed(1) + '%' 
      }))
    };
  });

  return {
    rowCount: data.length,
    columnCount: columns.length,
    numericColumns,
    categoricalColumns,
    numericStats: statistics,
    categoricalStats
  };
};

/**
 * Detects outliers in a dataset using the IQR method
 */
export const detectOutliers = (data, column) => {
  if (!data || !column || data.length === 0) {
    return [];
  }

  const values = data
    .map(row => parseFloat(row[column]))
    .filter(value => !isNaN(value));
  
  if (values.length === 0) return [];
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  // Find outlier indices
  const outlierIndices = [];
  data.forEach((row, index) => {
    const value = parseFloat(row[column]);
    if (!isNaN(value) && (value < lowerBound || value > upperBound)) {
      outlierIndices.push(index);
    }
  });
  
  return outlierIndices;
};

/**
 * Creates a sample dataset for testing
 */
export const createSampleDataset = () => {
  const data = [];
  
  // Generate 100 rows of sample data
  for (let i = 0; i < 100; i++) {
    data.push({
      id: i + 1,
      name: `Sample ${i + 1}`,
      category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      value: Math.round(Math.random() * 1000),
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      inStock: Math.random() > 0.3,
      date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
    });
  }
  
  return {
    name: 'sample_data.csv',
    type: 'csv',
    data,
    columns: ['id', 'name', 'category', 'value', 'price', 'inStock', 'date'],
    metadata: {
      rowCount: data.length,
      columnCount: 7,
      sampleSize: 5
    },
    uploadedAt: new Date().toISOString()
  };
};