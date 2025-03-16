// This script creates sample agents in localStorage for testing

// Sample agent data
const sampleAgents = [
  {
    id: 'test-agent-1',
    name: 'Data Analyzer Agent',
    description: 'Analyzes data sources and generates insights',
    type: 'analyzer',
    status: 'active',
    capabilities: ['data-analysis', 'insight-generation', 'statistical-analysis'],
    createdAt: new Date().toISOString(),
    lastRun: null
  },
  {
    id: 'test-agent-2',
    name: 'Visualization Agent',
    description: 'Creates charts and visualizations from data',
    type: 'visualizer',
    status: 'active',
    capabilities: ['chart-generation', 'data-visualization', 'pattern-detection'],
    createdAt: new Date().toISOString(),
    lastRun: null
  },
  {
    id: 'test-agent-3',
    name: 'Data Summarizer',
    description: 'Generates text summaries of data insights',
    type: 'summarizer',
    status: 'active',
    capabilities: ['text-generation', 'data-summarization'],
    createdAt: new Date().toISOString(),
    lastRun: null
  }
];

// Save to localStorage
try {
  // Check if we're in a browser environment
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agents', JSON.stringify(sampleAgents));
    console.log('Sample agents saved to localStorage');
  } else {
    // For Node.js environment
    console.log('Sample agents to add to localStorage:');
    console.log(JSON.stringify(sampleAgents, null, 2));
    console.log('\nCopy the above JSON and manually add it to localStorage with key "agents"');
  }
} catch (error) {
  console.error('Error saving agents:', error);
}