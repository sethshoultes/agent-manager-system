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
    },
    canCollaborate: true
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
    },
    canCollaborate: true
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
    },
    canCollaborate: true
  },
  {
    id: 'multi-agent-analysis',
    name: 'Collaborative Analyzer',
    description: 'Coordinates multiple agents for comprehensive data analysis',
    type: 'collaborative',
    capabilities: ['agent-collaboration', 'workflow-coordination', 'result-synthesis'],
    defaultConfiguration: {
      maxCollaborators: 3,
      executionMode: 'sequential', // or 'parallel'
      synthesizeResults: true
    },
    isCollaborative: true
  },
  {
    id: 'data-pipeline',
    name: 'Analysis Pipeline',
    description: 'Creates a multi-stage data processing pipeline for complex analysis',
    type: 'pipeline',
    capabilities: ['agent-collaboration', 'workflow-coordination', 'data-transformation'],
    defaultConfiguration: {
      maxStages: 4,
      executionMode: 'sequential',
      passThroughResults: true
    },
    isCollaborative: true
  }
];

// List of capabilities that agents can have
export const agentCapabilities = [
  {
    id: 'statistical-analysis',
    name: 'Statistical Analysis',
    description: 'Calculates statistical measures like mean, median, variance, etc.'
  },
  {
    id: 'trend-detection',
    name: 'Trend Detection',
    description: 'Identifies patterns and trends in time-series data'
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection',
    description: 'Identifies outliers and anomalous data points'
  },
  {
    id: 'chart-generation',
    name: 'Chart Generation',
    description: 'Creates visual charts and graphs based on data'
  },
  {
    id: 'text-summarization',
    name: 'Text Summarization',
    description: 'Produces concise natural language summaries'
  },
  {
    id: 'agent-collaboration',
    name: 'Agent Collaboration',
    description: 'Coordinates work between multiple specialized agents'
  },
  {
    id: 'workflow-coordination',
    name: 'Workflow Coordination',
    description: 'Manages multi-step analysis workflows'
  },
  {
    id: 'result-synthesis',
    name: 'Result Synthesis',
    description: 'Combines outputs from multiple agents into a cohesive result'
  },
  {
    id: 'data-transformation',
    name: 'Data Transformation',
    description: 'Processes and transforms data between analysis steps'
  }
];