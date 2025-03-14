export const agentTemplates = [
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyzes datasets to identify patterns, trends, and statistical insights',
    type: 'analyzer',
    capabilities: ['statistical-analysis', 'trend-detection', 'anomaly-detection'],
    defaultConfiguration: {
      analysisDepth: 'standard',
      statisticalMethods: ['mean', 'median', 'correlation'],
      outputFormat: 'summary'
    }
  },
  {
    id: 'data-visualizer',
    name: 'Data Visualizer',
    description: 'Creates visual representations of data using charts and graphs',
    type: 'visualizer',
    capabilities: ['chart-generation'],
    defaultConfiguration: {
      chartTypes: ['bar', 'line', 'pie'],
      colorScheme: 'default',
      autoSelectVisualization: true
    }
  },
  {
    id: 'data-summarizer',
    name: 'Data Summarizer',
    description: 'Generates concise text summaries of data insights and findings',
    type: 'summarizer',
    capabilities: ['text-summarization'],
    defaultConfiguration: {
      summaryLength: 'medium',
      keyPointsCount: 5,
      includeRecommendations: true
    }
  }
];