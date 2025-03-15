/**
 * Debug script for testing the sample data generation
 * Run with: node debug-sample-data.cjs
 */

// Import from our CommonJS version of the utils file to test with Node.js
const createSampleDatasetModule = require('./src/utils/dataUtils.cjs');

/**
 * Test the sample data generation function
 */
function testSampleDataGeneration() {
  try {
    console.log('====== SAMPLE DATA GENERATION DEBUG TEST ======');
    console.log('Imported module:', createSampleDatasetModule);
    
    // Check if the function is available
    if (!createSampleDatasetModule || !createSampleDatasetModule.createSampleDataset) {
      console.error('ERROR: createSampleDataset function not found in module');
      console.error('Module contains:', Object.keys(createSampleDatasetModule));
      return;
    }
    
    const createSampleDataset = createSampleDatasetModule.createSampleDataset;
    console.log('Function found, attempting to create sample dataset...');
    
    // Create the sample dataset
    const sampleData = createSampleDataset();
    
    // Validate the result
    console.log('\n=== SAMPLE DATASET VALIDATION ===');
    console.log('Result type:', typeof sampleData);
    
    if (!sampleData || typeof sampleData !== 'object') {
      console.error('ERROR: Sample data is not an object');
      return;
    }
    
    // Check required properties
    const requiredProps = ['id', 'name', 'data', 'dataString', 'columns', 'metadata'];
    const missingProps = requiredProps.filter(prop => sampleData[prop] === undefined);
    
    if (missingProps.length > 0) {
      console.error(`ERROR: Sample data missing properties: ${missingProps.join(', ')}`);
    } else {
      console.log('✓ All required properties present');
    }
    
    // Check data array
    if (!Array.isArray(sampleData.data)) {
      console.error('ERROR: data property is not an array');
    } else {
      console.log(`✓ data is an array with ${sampleData.data.length} items`);
      
      // Show sample of first item
      if (sampleData.data.length > 0) {
        console.log('First data item:', sampleData.data[0]);
      }
    }
    
    // Check dataString
    if (typeof sampleData.dataString !== 'string') {
      console.error('ERROR: dataString is not a string');
    } else {
      console.log(`✓ dataString is a string with length ${sampleData.dataString.length}`);
      
      // Try to parse it
      try {
        const parsed = JSON.parse(sampleData.dataString);
        if (!Array.isArray(parsed)) {
          console.error('ERROR: dataString does not parse to an array');
        } else {
          console.log(`✓ dataString parses to an array with ${parsed.length} items`);
          
          // Check if parsed and data match in length
          if (sampleData.data.length !== parsed.length) {
            console.error(`ERROR: data length (${sampleData.data.length}) doesn't match parsed dataString length (${parsed.length})`);
          } else {
            console.log('✓ data and parsed dataString have matching lengths');
          }
        }
      } catch (e) {
        console.error('ERROR: Failed to parse dataString:', e);
      }
    }
    
    // Check columns
    if (!Array.isArray(sampleData.columns)) {
      console.error('ERROR: columns is not an array');
    } else {
      console.log(`✓ columns is an array with ${sampleData.columns.length} items:`, sampleData.columns);
      
      // Check if each column exists in the first data item
      if (sampleData.data.length > 0) {
        const firstItem = sampleData.data[0];
        const missingColumns = sampleData.columns.filter(col => !(col in firstItem));
        
        if (missingColumns.length > 0) {
          console.error(`ERROR: Some columns missing from data: ${missingColumns.join(', ')}`);
        } else {
          console.log('✓ All columns exist in data items');
        }
      }
    }
    
    console.log('\n==== TEST COMPLETED SUCCESSFULLY ====');
  } catch (error) {
    console.error('UNCAUGHT ERROR IN TEST:', error);
  }
}

// Run the test
testSampleDataGeneration();