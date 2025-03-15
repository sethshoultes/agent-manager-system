/**
 * CommonJS version of dataUtils for testing with Node.js directly
 */

/**
 * Creates a sample dataset for testing with improved error handling
 * @returns {Object} A sample dataset object with data array and dataString
 */
function createSampleDataset() {
  console.log('Creating sample dataset - debugging version (CJS)');
  
  try {
    const data = [];
    
    // Generate a smaller dataset - 10 rows for testing
    for (let i = 0; i < 10; i++) {
      const product = {
        id: i + 1,
        name: `Product ${i + 1}`,
        category: ['Electronics', 'Clothing', 'Home', 'Books'][Math.floor(Math.random() * 4)],
        value: Math.round(Math.random() * 1000),
        price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
        inStock: Math.random() > 0.3 ? 'Yes' : 'No',
        date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
      };
      
      // Verify the product object has all expected fields
      const requiredFields = ['id', 'name', 'category', 'value', 'price', 'inStock', 'date'];
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
    
    // Generate a unique ID for the dataset
    const randomId = Math.random().toString(36).substring(2, 9);
    
    // Define column names exactly matching the object properties
    const columns = ['id', 'name', 'category', 'value', 'price', 'inStock', 'date'];
    
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
}

// Export the functions using CommonJS module syntax
module.exports = {
  createSampleDataset,
  analyzeData: () => ({}),  // Dummy function for testing
  detectOutliers: () => ([])  // Dummy function for testing
};