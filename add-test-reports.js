// This script adds test reports directly to localStorage for debugging
console.log('Creating test reports for localStorage...');

// Create sample reports
const testReports = [
  {
    id: 'test-report-1',
    name: 'Test Bar Chart Report',
    description: 'A test report with a bar chart',
    agentId: 'test-agent-1',
    dataSourceId: 'test-data-1',
    generatedAt: new Date().toISOString(),
    summary: 'This is a test report with a bar chart.',
    insights: [
      'Sample insight 1',
      'Sample insight 2'
    ],
    visualizations: [
      {
        type: 'bar',
        data: [
          { name: 'Category A', value: 450 },
          { name: 'Category B', value: 300 },
          { name: 'Category C', value: 150 },
          { name: 'Category D', value: 100 }
        ],
        config: {
          title: 'Sample Bar Chart',
          xAxisKey: 'name',
          valueKey: 'value'
        }
      }
    ]
  },
  {
    id: 'test-report-2',
    name: 'Test Line Chart Report',
    description: 'A test report with a line chart',
    agentId: 'test-agent-2',
    dataSourceId: 'test-data-1',
    generatedAt: new Date().toISOString(),
    summary: 'This is a test report with a line chart.',
    insights: [
      'Sample line chart insight 1',
      'Sample line chart insight 2'
    ],
    visualizations: [
      {
        type: 'line',
        data: [
          { name: 'Jan', value: 100 },
          { name: 'Feb', value: 200 },
          { name: 'Mar', value: 150 },
          { name: 'Apr', value: 300 },
          { name: 'May', value: 250 },
          { name: 'Jun', value: 350 }
        ],
        config: {
          title: 'Sample Line Chart',
          xAxisKey: 'name',
          valueKey: 'value'
        }
      }
    ]
  }
];

// For Node.js environment, just output the sample JSON
if (typeof localStorage === 'undefined') {
  console.log('Sample reports to add to localStorage:');
  console.log(JSON.stringify(testReports, null, 2));
  console.log('\nCopy this JSON and paste it into the browser console:');
  console.log('localStorage.setItem("reports", JSON.stringify(THE_PASTED_JSON))');
} else {
  // For browser environment, directly set in localStorage
  try {
    localStorage.setItem('reports', JSON.stringify(testReports));
    console.log('Test reports added to localStorage successfully!');
    console.log('Report count:', testReports.length);
  } catch (error) {
    console.error('Error adding test reports to localStorage:', error);
  }
}

// To use in browser console:
// 1. Copy everything between the START COPY and END COPY markers
// 2. Paste into the browser console
// 3. Press Enter to execute

/* START COPY

const testReports = [
  {
    id: 'test-report-1',
    name: 'Test Bar Chart Report',
    description: 'A test report with a bar chart',
    agentId: 'test-agent-1',
    dataSourceId: 'test-data-1',
    generatedAt: new Date().toISOString(),
    summary: 'This is a test report with a bar chart.',
    insights: [
      'Sample insight 1',
      'Sample insight 2'
    ],
    visualizations: [
      {
        type: 'bar',
        data: [
          { name: 'Category A', value: 450 },
          { name: 'Category B', value: 300 },
          { name: 'Category C', value: 150 },
          { name: 'Category D', value: 100 }
        ],
        config: {
          title: 'Sample Bar Chart',
          xAxisKey: 'name',
          valueKey: 'value'
        }
      }
    ]
  },
  {
    id: 'test-report-2',
    name: 'Test Line Chart Report',
    description: 'A test report with a line chart',
    agentId: 'test-agent-2',
    dataSourceId: 'test-data-1',
    generatedAt: new Date().toISOString(),
    summary: 'This is a test report with a line chart.',
    insights: [
      'Sample line chart insight 1',
      'Sample line chart insight 2'
    ],
    visualizations: [
      {
        type: 'line',
        data: [
          { name: 'Jan', value: 100 },
          { name: 'Feb', value: 200 },
          { name: 'Mar', value: 150 },
          { name: 'Apr', value: 300 },
          { name: 'May', value: 250 },
          { name: 'Jun', value: 350 }
        ],
        config: {
          title: 'Sample Line Chart',
          xAxisKey: 'name',
          valueKey: 'value'
        }
      }
    ]
  }
];

localStorage.setItem('reports', JSON.stringify(testReports));
console.log('Test reports added to localStorage successfully!');

END COPY */