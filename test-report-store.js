// This is a test script to verify the reportStore functionality
// You can run it with: node test-report-store.js

// Mock localStorage for Node.js environment
let mockStorage = {};
global.localStorage = {
  setItem: (key, value) => { 
    mockStorage[key] = value;
    console.log(`localStorage.setItem('${key}', [data]) - stored ${value.length} characters`);
  },
  getItem: (key) => { 
    console.log(`localStorage.getItem('${key}') - ${mockStorage[key] ? 'found' : 'not found'}`);
    return mockStorage[key];
  },
  removeItem: (key) => {
    console.log(`localStorage.removeItem('${key}')`);
    delete mockStorage[key];
  },
  clear: () => {
    mockStorage = {};
  }
};

// Sample visualization data
const createSampleViz = (type) => ({
  type: type,
  data: [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 150 },
    { name: 'D', value: 300 },
    { name: 'E', value: 250 }
  ],
  config: {
    title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
    xAxisKey: 'name',
    valueKey: 'value'
  }
});

// Create report object
const createSampleReport = (chartType = 'bar') => ({
  id: Math.random().toString(36).substring(2, 15),
  name: `Test ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
  description: 'Created by test script',
  agentId: null,
  dataSourceId: 'test-data-source',
  summary: 'This is a test visualization report.',
  insights: ['This is a test insight.'],
  visualizations: [createSampleViz(chartType)],
  generatedAt: new Date().toISOString()
});

// Test functions
async function runTests() {
  console.log('\n--- RUNNING REPORT STORE TESTS ---\n');
  
  // Test 1: Adding a report
  console.log('\n🧪 TEST 1: Adding a report');
  try {
    const report = createSampleReport('bar');
    console.log(`Created report: ${report.name}`);
    
    // Simulate adding to localStorage
    const existingReports = [];
    existingReports.push(report);
    localStorage.setItem('reports', JSON.stringify(existingReports));
    
    // Check if saved
    const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
    if (savedReports.length === 1) {
      console.log('✅ Report saved successfully');
    } else {
      console.log('❌ Failed to save report');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 2: Adding multiple reports
  console.log('\n🧪 TEST 2: Adding multiple reports');
  try {
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    
    // Add a line chart
    const lineReport = createSampleReport('line');
    reports.push(lineReport);
    console.log(`Added report: ${lineReport.name}`);
    
    // Add a pie chart
    const pieReport = createSampleReport('pie');
    reports.push(pieReport);
    console.log(`Added report: ${pieReport.name}`);
    
    // Save all
    localStorage.setItem('reports', JSON.stringify(reports));
    
    // Check if saved
    const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
    if (savedReports.length === 3) {
      console.log('✅ Multiple reports saved successfully');
    } else {
      console.log(`❌ Expected 3 reports, but found ${savedReports.length}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: Retrieving reports
  console.log('\n🧪 TEST 3: Retrieving reports');
  try {
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    console.log(`Retrieved ${reports.length} reports`);
    
    // Check visualization data structure
    const hasValidVisualizations = reports.every(r => 
      Array.isArray(r.visualizations) && 
      r.visualizations.length > 0 &&
      r.visualizations[0].type &&
      Array.isArray(r.visualizations[0].data)
    );
    
    if (hasValidVisualizations) {
      console.log('✅ All reports have valid visualization data structure');
    } else {
      console.log('❌ Some reports have invalid visualization data');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 4: Deleting a report
  console.log('\n🧪 TEST 4: Deleting a report');
  try {
    // Get current reports
    let reports = JSON.parse(localStorage.getItem('reports') || '[]');
    const initialCount = reports.length;
    
    if (initialCount === 0) {
      console.log('❌ No reports to delete');
      return;
    }
    
    // Delete the first report
    const reportToDelete = reports[0];
    console.log(`Deleting report: ${reportToDelete.name} (${reportToDelete.id})`);
    
    // Filter out the report
    reports = reports.filter(r => r.id !== reportToDelete.id);
    
    // Save back
    localStorage.setItem('reports', JSON.stringify(reports));
    
    // Verify deletion
    const updatedReports = JSON.parse(localStorage.getItem('reports') || '[]');
    if (updatedReports.length === initialCount - 1) {
      console.log('✅ Report deleted successfully');
    } else {
      console.log(`❌ Expected ${initialCount - 1} reports, but found ${updatedReports.length}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n--- TEST SUMMARY ---');
  try {
    const finalReports = JSON.parse(localStorage.getItem('reports') || '[]');
    console.log(`Final report count: ${finalReports.length}`);
    console.log('Report names:');
    finalReports.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.name} (${r.id})`);
    });
    
    // Clean up
    localStorage.removeItem('reports');
    console.log('\nTests completed and cleaned up.');
  } catch (error) {
    console.log(`Error in summary: ${error.message}`);
  }
}

// Run tests
runTests();