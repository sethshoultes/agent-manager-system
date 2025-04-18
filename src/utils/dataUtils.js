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
/**
 * Creates a sample dataset for testing with improved error handling
 * @returns {Object} A sample dataset object with data array and dataString
 */
export const createSampleDataset = () => {
  console.log('Creating sample dataset - debugging version');
  
  try {
    const data = [];
    
    // Generate a more visualization-friendly dataset - 25 rows for testing
    const categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Toys'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const years = [2021, 2022, 2023, 2024, 2025];
    
    // Generate structured data with clear patterns for better visualizations
    for (let i = 0; i < 25; i++) {
      const category = categories[i % categories.length];
      const region = regions[Math.floor(i / 5) % regions.length];
      const year = years[Math.floor(i / (25/years.length))];
      
      // Create values with patterns based on category and region
      let baseValue = 0;
      if (category === 'Electronics') baseValue = 800;
      else if (category === 'Clothing') baseValue = 400;
      else if (category === 'Home') baseValue = 600;
      else if (category === 'Books') baseValue = 200;
      else baseValue = 300;
      
      // Regional variations
      if (region === 'North') baseValue *= 1.2;
      else if (region === 'South') baseValue *= 0.9;
      else if (region === 'West') baseValue *= 1.4;
      else if (region === 'East') baseValue *= 1.1;
      
      // Year trend - increasing over time
      const yearMultiplier = 1 + ((year - 2021) * 0.05);
      
      const value = Math.round(baseValue * yearMultiplier);
      const sales = Math.round(value * (0.8 + Math.random() * 0.4));
      
      const product = {
        id: i + 1,
        name: `Product ${i + 1}`,
        category: category,
        region: region,
        year: year,
        value: value,
        sales: sales,
        price: parseFloat((baseValue / 10 + Math.random() * 20).toFixed(2)),
        inStock: Math.random() > 0.2 ? 'Yes' : 'No',
        rating: Math.min(5, Math.max(1, Math.round(3 + (Math.random() * 4 - 2)) + (region === 'West' ? 0.5 : 0))),
        date: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
      };
      
      // Verify the product object has all expected fields
      const requiredFields = ['id', 'name', 'category', 'region', 'year', 'value', 'sales', 'price', 'inStock', 'rating', 'date'];
      const missingFields = requiredFields.filter(field => product[field] === undefined);
      
      if (missingFields.length > 0) {
        console.error(`Product ${i} is missing fields: ${missingFields.join(', ')}`);
      } else {
        data.push(product);
      }
    }
    
    // Check if we generated any data
    if (data.length === 0) {
      console.error('Failed to generate any valid product data');
      throw new Error('Sample data generation failed: no valid product data');
    }
    
    console.log(`Generated ${data.length} rows of sample data`);
    
    // Generate a unique ID for the dataset with a timestamp to ensure uniqueness
    const timestamp = Date.now();
    const randomId = `ds-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Define column names exactly matching the object properties
    const columns = ['id', 'name', 'category', 'region', 'year', 'value', 'sales', 'price', 'inStock', 'rating', 'date'];
    
    // Create dataString for compatibility with DataPreview component
    const dataString = JSON.stringify(data);
    console.log(`Created dataString with length ${dataString.length}`);
    
    // Check if dataString is valid JSON by attempting to parse it back
    try {
      const test = JSON.parse(dataString);
      if (!Array.isArray(test) || test.length !== data.length) {
        console.error('DataString validation failed - not a proper array or length mismatch');
      } else {
        console.log('DataString validation passed');
      }
    } catch (e) {
      console.error('DataString validation failed - invalid JSON:', e);
      throw new Error('Invalid JSON in dataString');
    }
    
    // Build and return the complete dataset object
    const sampleDataset = {
      id: randomId,
      name: 'Sample Dataset',
      description: 'Automatically generated sample dataset',
      type: 'csv',
      data: data,  // Explicit assignment of data array
      dataString: dataString,  // Explicit assignment of dataString
      columns: columns,
      metadata: {
        rowCount: data.length,
        columnCount: columns.length,
        sampleSize: Math.min(5, data.length)
      },
      uploadedAt: new Date().toISOString()
    };
    
    // Verify the dataset has all required properties
    const requiredProps = ['id', 'name', 'data', 'dataString', 'columns'];
    const missingProps = requiredProps.filter(prop => sampleDataset[prop] === undefined);
    
    if (missingProps.length > 0) {
      console.error(`Sample dataset is missing properties: ${missingProps.join(', ')}`);
      throw new Error(`Sample dataset missing required properties: ${missingProps.join(', ')}`);
    }
    
    console.log('Successfully created sample dataset:', {
      id: sampleDataset.id,
      name: sampleDataset.name,
      rows: sampleDataset.data.length,
      columns: sampleDataset.columns.length,
      dataStringLength: sampleDataset.dataString.length
    });
    
    return sampleDataset;
  } catch (error) {
    console.error('Error in createSampleDataset:', error);
    // Return a minimal valid dataset so the app doesn't crash
    return {
      id: 'error-' + Math.random().toString(36).substring(2, 7),
      name: 'Error Dataset',
      description: 'Error occurred while generating dataset: ' + error.message,
      type: 'error',
      data: [{ error: 'Data generation failed', message: error.message }],
      dataString: JSON.stringify([{ error: 'Data generation failed', message: error.message }]),
      columns: ['error', 'message'],
      metadata: {
        rowCount: 1,
        columnCount: 2,
        sampleSize: 1,
        error: error.message
      },
      uploadedAt: new Date().toISOString(),
      error: error.message
    };
  }
};