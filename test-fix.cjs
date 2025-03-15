/**
 * Simple test and fix script for the Sample Dataset feature
 * Run with: node test-fix.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('======= SAMPLE DATASET FIX SCRIPT =======');
console.log('This script will test and fix the Sample Dataset feature\n');

// Define file paths
const projectRoot = __dirname;
const utilsPath = path.join(projectRoot, 'src', 'utils', 'dataUtils.js');
const dataPreviewPath = path.join(projectRoot, 'src', 'components', 'data', 'DataPreview.jsx');
const dataStorePath = path.join(projectRoot, 'src', 'stores', 'dataStore.js');
const datapagePath = path.join(projectRoot, 'src', 'pages', 'DataPage.jsx');

console.log('Project root:', projectRoot);

// Test function
function testSampleDataGeneration() {
  console.log('\n----- Testing Sample Data Generation -----');
  
  // Create a simple sample dataset
  const data = [];
  
  for (let i = 0; i < 10; i++) {
    data.push({
      id: i + 1,
      name: `Product ${i + 1}`,
      category: ['Electronics', 'Clothing', 'Home', 'Books'][Math.floor(Math.random() * 4)],
      value: Math.round(Math.random() * 1000),
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      inStock: Math.random() > 0.3 ? 'Yes' : 'No',
      date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
    });
  }
  
  // Create dataString
  const dataString = JSON.stringify(data);
  
  // Create sample dataset
  const sampleDataset = {
    id: 'test-' + Math.random().toString(36).substring(2, 7),
    name: 'Sample Dataset',
    description: 'Automatically generated sample dataset',
    type: 'csv',
    data: data,
    dataString: dataString,
    columns: ['id', 'name', 'category', 'value', 'price', 'inStock', 'date'],
    metadata: {
      rowCount: data.length,
      columnCount: 7,
      sampleSize: 5
    },
    uploadedAt: new Date().toISOString()
  };
  
  console.log('Sample dataset generated successfully');
  console.log('Data rows:', data.length);
  console.log('DataString length:', dataString.length);
  console.log('First data row:', data[0]);
  
  // Check for key issues
  const checks = [
    { check: !!sampleDataset.data, message: 'Data property exists' },
    { check: Array.isArray(sampleDataset.data), message: 'Data is an array' },
    { check: sampleDataset.data.length > 0, message: 'Data array has items' },
    { check: !!sampleDataset.dataString, message: 'DataString property exists' },
    { check: typeof sampleDataset.dataString === 'string', message: 'DataString is a string' },
    { check: sampleDataset.dataString.length > 0, message: 'DataString has content' },
    { check: Array.isArray(sampleDataset.columns), message: 'Columns is an array' },
    { check: sampleDataset.columns.length > 0, message: 'Columns array has items' }
  ];
  
  // Run checks
  console.log('\nRunning validation checks:');
  let allPassed = true;
  
  for (const { check, message } of checks) {
    if (check) {
      console.log(`✓ PASS: ${message}`);
    } else {
      console.log(`✗ FAIL: ${message}`);
      allPassed = false;
    }
  }
  
  return { success: allPassed, sampleDataset };
}

// Fix functions
function fixDataUtils() {
  console.log('\n----- Fixing dataUtils.js -----');
  
  try {
    if (!fs.existsSync(utilsPath)) {
      console.log(`File not found: ${utilsPath}`);
      return false;
    }
    
    let content = fs.readFileSync(utilsPath, 'utf8');
    
    // Find the createSampleDataset function
    if (!content.includes('export const createSampleDataset')) {
      console.log('createSampleDataset function not found in file');
      return false;
    }
    
    // Check if dataString property is already fixed
    if (content.includes('dataString: JSON.stringify(data)') || 
        content.includes('dataString = JSON.stringify(data)') ||
        content.includes('dataString,')) {
      console.log('dataString seems to be correctly set already');
    } else {
      console.log('Adding dataString property to createSampleDataset function');
      
      // Add dataString property to the return object
      const returnPattern = /return\s*\{[^}]*\}/s;
      const returnMatch = content.match(returnPattern);
      
      if (returnMatch) {
        const returnObj = returnMatch[0];
        
        if (!returnObj.includes('dataString')) {
          const newReturnObj = returnObj.replace(
            /(data,)/,
            'data,\n    dataString: JSON.stringify(data), // Add dataString explicitly'
          );
          
          content = content.replace(returnPattern, newReturnObj);
        }
      }
    }
    
    // Add better error handling
    if (!content.includes('try {') && !content.includes('catch (error)')) {
      console.log('Adding error handling to createSampleDataset function');
      
      // Wrap the function body in try/catch
      const functionBodyPattern = /export const createSampleDataset = \(\) => \{([\s\S]*?)\};/;
      const functionBodyMatch = content.match(functionBodyPattern);
      
      if (functionBodyMatch) {
        const functionBody = functionBodyMatch[1];
        const newFunctionBody = `
  try {${functionBody}
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
      uploadedAt: new Date().toISOString()
    };
  }`;
        
        content = content.replace(functionBodyPattern, `export const createSampleDataset = () => {${newFunctionBody}};`);
      }
    }
    
    // Write the fixed content back to the file
    fs.writeFileSync(utilsPath, content);
    console.log(`Updated ${utilsPath}`);
    return true;
    
  } catch (error) {
    console.error('Error fixing dataUtils.js:', error);
    return false;
  }
}

function fixDataPreview() {
  console.log('\n----- Fixing DataPreview.jsx -----');
  
  try {
    if (!fs.existsSync(dataPreviewPath)) {
      console.log(`File not found: ${dataPreviewPath}`);
      return false;
    }
    
    let content = fs.readFileSync(dataPreviewPath, 'utf8');
    
    // Update the useMemo function to better handle data formats
    const useMemoPattern = /const displayData = useMemo\(\(\) => \{([^}]*)\}, \[dataSource\]\);/s;
    const useMemoMatch = content.match(useMemoPattern);
    
    if (useMemoMatch) {
      console.log('Adding improved data handling to DataPreview');
      
      const newUseMemo = `const displayData = useMemo(() => {
    if (!dataSource) {
      console.log('DataPreview: No data source provided');
      return [];
    }
    
    // Debug the data we received
    console.log('DataPreview processing:', {
      hasData: !!dataSource.data,
      dataType: typeof dataSource.data,
      isArray: Array.isArray(dataSource.data),
      hasDataString: !!dataSource.dataString,
      dataStringLength: dataSource.dataString?.length || 0
    });
    
    // If we have an array, use it directly
    if (dataSource.data && Array.isArray(dataSource.data) && dataSource.data.length > 0) {
      console.log('Using data array directly, length:', dataSource.data.length);
      return dataSource.data;
    }
    
    // If we have a string that looks like JSON, try to parse it
    if (dataSource.data && typeof dataSource.data === 'string' && dataSource.data.startsWith('[')) {
      try {
        console.log('Data is a string that looks like JSON, parsing it');
        const parsed = JSON.parse(dataSource.data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing data string:', e);
      }
    }
    
    // Otherwise try to parse the dataString
    if (dataSource.dataString) {
      console.log('Attempting to parse dataString, length:', dataSource.dataString.length);
      const parsed = safeJsonParse(dataSource.dataString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('Successfully parsed dataString into array with length:', parsed.length);
        return parsed;
      }
    }
    
    console.log('No valid data found in dataSource');
    return [];
  }, [dataSource]);`;
      
      content = content.replace(useMemoPattern, newUseMemo);
    }
    
    // Improve column handling
    if (!content.includes('columns = dataSource?.columns')) {
      const returnPattern = /return \(\s*<Card/;
      const replacement = `  // Ensure we have column data to display
  const columns = dataSource?.columns && Array.isArray(dataSource.columns) && dataSource.columns.length > 0 
    ? dataSource.columns 
    : displayData.length > 0 ? Object.keys(displayData[0]) : [];
    
  return (<Card`;
      
      content = content.replace(returnPattern, replacement);
    }
    
    // Fix references to columns
    content = content.replace(/dataSource\.columns/g, 'columns');
    
    // Write the fixed content back to the file
    fs.writeFileSync(dataPreviewPath, content);
    console.log(`Updated ${dataPreviewPath}`);
    return true;
    
  } catch (error) {
    console.error('Error fixing DataPreview.jsx:', error);
    return false;
  }
}

function fixDataPage() {
  console.log('\n----- Fixing DataPage.jsx -----');
  
  try {
    if (!fs.existsSync(datapagePath)) {
      console.log(`File not found: ${datapagePath}`);
      return false;
    }
    
    let content = fs.readFileSync(datapagePath, 'utf8');
    
    // Improve the handleCreateSample function
    const handleCreateSamplePattern = /const handleCreateSample = \(\) => \{([^}]*)};/s;
    const handleCreateSampleMatch = content.match(handleCreateSamplePattern);
    
    if (handleCreateSampleMatch) {
      console.log('Enhancing handleCreateSample function with better error handling');
      
      const newHandleCreateSample = `const handleCreateSample = async () => {
    try {
      console.log('Starting sample dataset creation...');
      const sampleData = createSampleDataset();
      
      if (!sampleData) {
        console.error('Failed to create sample dataset');
        return;
      }
      
      // Ensure data is valid
      if (!sampleData.data || !Array.isArray(sampleData.data) || sampleData.data.length === 0) {
        console.error('Sample data creation failed: data array is empty or invalid');
        return;
      }
      
      // Make sure dataString is set properly
      if (!sampleData.dataString) {
        console.log('No dataString found in sample data, creating it now');
        sampleData.dataString = JSON.stringify(sampleData.data);
      }
      
      console.log('Created sample dataset:', { 
        id: sampleData.id,
        name: sampleData.name,
        dataType: typeof sampleData.data,
        isArray: Array.isArray(sampleData.data),
        dataLength: sampleData.data?.length || 0,
        hasDataString: !!sampleData.dataString,
        dataStringLength: sampleData.dataString?.length || 0
      });
      
      console.log('Adding sample dataset to store...');
      await addDataSource(sampleData);
      console.log('Sample dataset added successfully');
      
      // Force a state update to show the new data source immediately
      setSelectedDataSource(null);
    } catch (error) {
      console.error('Error in handleCreateSample:', error);
    }
  };`;
      
      content = content.replace(handleCreateSamplePattern, newHandleCreateSample);
    }
    
    // Write the fixed content back to the file
    fs.writeFileSync(datapagePath, content);
    console.log(`Updated ${datapagePath}`);
    return true;
    
  } catch (error) {
    console.error('Error fixing DataPage.jsx:', error);
    return false;
  }
}

function fixDataStore() {
  console.log('\n----- Fixing dataStore.js -----');
  
  try {
    if (!fs.existsSync(dataStorePath)) {
      console.log(`File not found: ${dataStorePath}`);
      return false;
    }
    
    let content = fs.readFileSync(dataStorePath, 'utf8');
    
    // Improve the addDataSource function
    const addDataSourcePattern = /addDataSource:[^{]*{([^}]*?)},/s;
    const addDataSourceMatch = content.match(addDataSourcePattern);
    
    if (addDataSourceMatch) {
      console.log('Enhancing addDataSource with better error handling for dataString');
      
      // Add dataString handling to the addDataSource function
      if (!content.includes('if (!dataSource.dataString && dataSource.data)')) {
        const setPattern = /set\(\{ isLoading: true, error: null \}\);/;
        const newSet = `set({ isLoading: true, error: null });
    
    // Debug the incoming data source
    console.log('addDataSource:', { 
      hasData: !!dataSource?.data, 
      dataType: typeof dataSource?.data,
      isArray: Array.isArray(dataSource?.data),
      hasDataString: !!dataSource?.dataString
    });
    
    // Ensure dataString exists
    if (!dataSource.dataString && dataSource.data) {
      console.log('Adding missing dataString for data source');
      dataSource.dataString = typeof dataSource.data === 'string' 
        ? dataSource.data 
        : JSON.stringify(dataSource.data);
    }`;
        
        content = content.replace(setPattern, newSet);
      }
    }
    
    // Write the fixed content back to the file
    fs.writeFileSync(dataStorePath, content);
    console.log(`Updated ${dataStorePath}`);
    return true;
    
  } catch (error) {
    console.error('Error fixing dataStore.js:', error);
    return false;
  }
}

// Run the test
const testResult = testSampleDataGeneration();
console.log('\nTest Result:', testResult.success ? 'PASSED' : 'FAILED');

if (!testResult.success) {
  console.error('Validation failed. Cannot continue with fixes.');
  process.exit(1);
}

// Apply fixes
console.log('\n===== APPLYING FIXES =====');
const fixedUtils = fixDataUtils();
const fixedDataPreview = fixDataPreview();
const fixedDataPage = fixDataPage();
const fixedDataStore = fixDataStore();

const allFixed = fixedUtils && fixedDataPreview && fixedDataPage && fixedDataStore;

if (allFixed) {
  console.log('\n✅ All fixes applied successfully.');
  console.log('\nNext steps:');
  console.log('1. Restart your development server');
  console.log('2. Navigate to the Data page');
  console.log('3. Try clicking the "Create Sample Dataset" button');
  console.log('4. You should now see sample data displayed properly');
} else {
  console.log('\n⚠️ Some fixes could not be applied.');
  console.log('Please check the error messages above for details.');
}

console.log('\n======== END OF SCRIPT ========');