/**
 * Simple test script for the sample data generator
 * Run with: node test-sample-data.js
 */

// Sample data generation function (copy from your utility file)
function createSampleDataset() {
    const data = [];
    
    // Generate 25 rows of sample data
    for (let i = 0; i < 25; i++) {
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
    
    const randomId = Math.random().toString(36).substring(2, 15);
    
    // Create dataString for compatibility
    const dataString = JSON.stringify(data);
    
    return {
        id: randomId,
        name: 'Sample Dataset',
        description: 'Automatically generated sample dataset',
        type: 'csv',
        data,
        dataString, // Add dataString explicitly
        columns: ['id', 'name', 'category', 'value', 'price', 'inStock', 'date'],
        metadata: {
            rowCount: data.length,
            columnCount: 7,
            sampleSize: 5
        },
        uploadedAt: new Date().toISOString()
    };
}

// Test function
function testSampleDataGeneration() {
    console.log('Starting sample dataset creation test...');
    
    // Create the sample dataset
    const sampleData = createSampleDataset();
    
    // Check if the dataset has the expected properties
    console.log('Dataset properties:');
    console.log('- ID:', sampleData.id);
    console.log('- Name:', sampleData.name);
    console.log('- Type:', sampleData.type);
    console.log('- Data type:', typeof sampleData.data);
    console.log('- Is data array:', Array.isArray(sampleData.data));
    console.log('- Data length:', sampleData.data ? sampleData.data.length : 0);
    console.log('- Has dataString:', !!sampleData.dataString);
    console.log('- DataString length:', sampleData.dataString ? sampleData.dataString.length : 0);
    console.log('- Columns:', sampleData.columns);
    console.log('- Row count:', sampleData.metadata.rowCount);
    console.log('- Column count:', sampleData.metadata.columnCount);
    
    // Show the first 3 rows of data
    console.log('\nSample data preview (first 3 rows):');
    if (sampleData.data && sampleData.data.length > 0) {
        for (let i = 0; i < Math.min(3, sampleData.data.length); i++) {
            console.log(`Row ${i+1}:`, sampleData.data[i]);
        }
    } else {
        console.log('No data available');
    }
    
    // Validate that dataString property exists and contains valid JSON
    console.log('\nValidating dataString property:');
    if (!sampleData.dataString) {
        console.log('❌ FAIL: dataString property is missing');
    } else {
        try {
            const parsedData = JSON.parse(sampleData.dataString);
            console.log('✅ SUCCESS: dataString contains valid JSON data');
            console.log('- Parsed data length:', parsedData.length);
            
            // Check if parsed data matches original data
            const isEquivalent = JSON.stringify(parsedData) === JSON.stringify(sampleData.data);
            console.log('- Data equivalence check:', isEquivalent ? '✅ Match' : '❌ Mismatch');
        } catch (error) {
            console.log('❌ FAIL: dataString contains invalid JSON data');
            console.log('Error:', error.message);
        }
    }
    
    console.log('\nTest completed');
}

// Run the test
testSampleDataGeneration();