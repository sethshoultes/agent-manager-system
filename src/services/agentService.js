/**
 * Executes an agent against a data source using either OpenAI, OpenRouter,
 * or falls back to mock processing
 * 
 * @param {Object} agent - The agent to execute
 * @param {Object} dataSource - The data source to analyze
 * @param {Object} options - Execution options
 * @param {Function} options.onProgress - Callback for progress updates
 * @param {Function} options.onLog - Callback for log messages
 * @param {boolean} options.useOpenAI - Whether to use AI providers (default: true if API key is set)
 * @param {string} options.apiKey - API key to use for this execution
 * @param {string} options.provider - Provider to use ('openai' or 'openrouter')
 * @param {string} options.model - Model to use for this execution
 * @returns {Promise<Object>} - The execution results
 */
import openaiService from './openaiService';
import openRouterService from './openRouterService';

export const executeAgent = async (agent, dataSource, options = {}) => {
  if (!agent || !dataSource) {
    throw new Error('Agent and data source are required');
  }

  const { onProgress, onLog } = options;
  const useAI = options.useAI ?? true; // Default to using AI if available
  const provider = options.provider || 'openai'; // Default provider is OpenAI
  
  // Stages for execution progress reporting
  const stages = [
    { name: 'Initializing', durationMs: 500, progress: 10 },
    { name: 'Loading data', durationMs: 800, progress: 20 },
    { name: 'Analyzing data structure', durationMs: 700, progress: 35 },
    { name: 'Processing data', durationMs: 1500, progress: 60 },
    { name: 'Generating insights', durationMs: 1200, progress: 80 },
    { name: 'Creating visualizations', durationMs: 1000, progress: 95 },
    { name: 'Finalizing', durationMs: 300, progress: 100 }
  ];

  // Calculate estimated completion time
  const totalDuration = stages.reduce((sum, stage) => sum + stage.durationMs, 0);
  const startTime = new Date();
  const estimatedCompletionTime = new Date(startTime.getTime() + totalDuration);

  if (onProgress) {
    onProgress({
      progress: 0,
      stage: 'Starting',
      estimatedCompletionTime
    });
  }

  if (onLog) {
    onLog(`Starting execution of ${agent.name}`);
    onLog(`Estimated completion time: ${estimatedCompletionTime.toLocaleTimeString()}`);
    if (useAI) {
      onLog(`Using ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'} for AI analysis`);
    }
  }

  // Set API key based on the selected provider
  let usingAI = useAI;
  const apiKey = options.apiKey;
  let service = null;
  
  if (apiKey) {
    if (provider === 'openai') {
      const success = openaiService.setApiKey(apiKey);
      if (success) {
        service = openaiService;
      } else {
        usingAI = false;
        if (onLog) {
          onLog('Failed to set OpenAI API key. Falling back to mock execution.');
        }
      }
    } else if (provider === 'openrouter') {
      const success = openRouterService.setApiKey(apiKey);
      if (success) {
        service = openRouterService;
      } else {
        usingAI = false;
        if (onLog) {
          onLog('Failed to set OpenRouter API key. Falling back to mock execution.');
        }
      }
    } else {
      usingAI = false;
      if (onLog) {
        onLog(`Unknown provider: ${provider}. Falling back to mock execution.`);
      }
    }
  } else {
    usingAI = false;
    if (onLog) {
      onLog('No API key provided. Using mock execution.');
    }
  }

  return new Promise(async (resolve) => {
    // Function to report progress
    const reportProgress = (stageIndex, customMessage = null) => {
      if (stageIndex >= stages.length) return;
      
      const stage = stages[stageIndex];
      
      if (onProgress) {
        onProgress({
          progress: stage.progress,
          stage: stage.name
        });
      }
      
      if (onLog) {
        onLog(`Stage: ${stage.name}`);
        if (customMessage) {
          onLog(customMessage);
        }
      }
    };

    // Report initial stages (loading and analysis)
    reportProgress(0);
    setTimeout(() => reportProgress(1, 
      `Processing ${dataSource.metadata?.rowCount || dataSource.data?.length || 0} rows of data`), 
      stages[0].durationMs);
    
    setTimeout(() => reportProgress(2, 
      `Identified ${dataSource.metadata?.columnCount || dataSource.columns?.length || 0} columns for analysis`), 
      stages[0].durationMs + stages[1].durationMs);

    // Execute the agent
    try {
      let results;
      
      if (usingAI && service) {
        // Report processing stage
        setTimeout(() => reportProgress(3, `Sending data to ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'} for analysis`), 
          stages[0].durationMs + stages[1].durationMs + stages[2].durationMs);
        
        // Process with selected AI service
        const agentType = agent.type || 'analyzer';
        const response = await service.generateAnalysis(
          dataSource.data,
          dataSource.columns,
          agentType,
          { 
            model: options.model || (provider === 'openai' ? 'gpt-4-turbo' : 'anthropic/claude-3-haiku'),
            temperature: options.temperature || 0.2
          }
        );
        
        // Report insights stage
        setTimeout(() => reportProgress(4, 'Received AI-generated insights'), 
          stages[0].durationMs + stages[1].durationMs + stages[2].durationMs + stages[3].durationMs);
        
        if (response.success) {
          // Format AI results to match our expected structure
          results = formatAIResults(response.result, agent, dataSource);
          
          // Include AI usage data
          results.aiMetadata = {
            provider,
            model: response.model,
            usage: response.usage
          };
          
          // Report visualization stage
          setTimeout(() => reportProgress(5, 'Processing AI-generated visualizations'), 
            stages[0].durationMs + stages[1].durationMs + stages[2].durationMs + 
            stages[3].durationMs + stages[4].durationMs);
        } else {
          if (onLog) {
            onLog(`Error using ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'}: ${response.error}. Falling back to mock results.`);
          }
          // Fall back to mock results
          results = generateMockResults(agent, dataSource);
        }
      } else {
        // Use mock processing if OpenAI is not available
        // Report processing stages sequentially for mock execution
        setTimeout(() => reportProgress(3, 'Processing data with local analysis tools'), 
          stages[0].durationMs + stages[1].durationMs + stages[2].durationMs);
        
        setTimeout(() => reportProgress(4, `Applying ${agent.capabilities?.length || 0} capabilities to extract insights`), 
          stages[0].durationMs + stages[1].durationMs + stages[2].durationMs + stages[3].durationMs);
          
        setTimeout(() => reportProgress(5, 'Generating appropriate charts for data visualization'), 
          stages[0].durationMs + stages[1].durationMs + stages[2].durationMs + 
          stages[3].durationMs + stages[4].durationMs);
        
        // Generate mock results
        results = generateMockResults(agent, dataSource);
      }
      
      // Report final stage
      setTimeout(() => {
        reportProgress(6, 'Finalizing results');
        
        // Complete execution
        setTimeout(() => {
          if (onLog) {
            onLog('Execution completed successfully');
            if (usingAI) {
              onLog(`Results generated using ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'}`);
            } else {
              onLog('Results generated using mock processor');
            }
          }
          
          // Add execution metadata
          results.executedAt = new Date().toISOString();
          results.executionMethod = usingAI ? provider : 'mock';
          
          resolve(results);
        }, stages[6].durationMs);
      }, 
      stages[0].durationMs + stages[1].durationMs + stages[2].durationMs + 
      stages[3].durationMs + stages[4].durationMs + stages[5].durationMs);
    } catch (error) {
      if (onLog) {
        onLog(`Error during execution: ${error.message}`);
        onLog('Falling back to mock results');
      }
      
      // Fall back to mock results in case of any error
      const results = generateMockResults(agent, dataSource);
      results.error = error.message;
      
      setTimeout(() => {
        resolve(results);
      }, 1000);
    }
  });
};

/**
 * Formats AI API results to match our expected structure
 */
const formatAIResults = (aiResult, agent, dataSource) => {
  // Start with basic result structure
  const results = {
    success: true,
    agentId: agent.id,
    dataSourceId: dataSource.id,
    timestamp: new Date().toISOString(),
    summary: '',
    insights: [],
    visualizations: []
  };
  
  // Handle case where AI response is raw text (not parsed properly)
  if (aiResult.rawContent) {
    results.summary = aiResult.rawContent;
    results.insights.push('Analysis completed but could not be properly structured');
    return results;
  }
  
  // Extract summary if available
  if (aiResult.summary) {
    results.summary = aiResult.summary;
  }
  
  // Extract insights if available
  if (aiResult.insights) {
    results.insights = Array.isArray(aiResult.insights) 
      ? aiResult.insights 
      : [aiResult.insights];
  }
  
  // Extract statistics if available
  if (aiResult.statistics) {
    results.statistics = aiResult.statistics;
  }
  
  // Extract or transform visualizations if available
  if (aiResult.visualizations) {
    if (Array.isArray(aiResult.visualizations)) {
      // Transform each visualization to match our expected format
      results.visualizations = aiResult.visualizations.map(viz => {
        // If visualization is already in expected format, use it
        if (viz.type && viz.data) {
          return viz;
        }
        
        // Otherwise try to transform it
        return {
          type: viz.chartType || 'bar',
          title: viz.title || 'Data Visualization',
          data: viz.data || dataSource.data.slice(0, 10),
          config: viz.config || {
            xAxisKey: viz.xAxis || dataSource.columns[0],
            series: [{
              dataKey: viz.yAxis || dataSource.columns[1],
              name: viz.name || dataSource.columns[1],
              color: viz.color || '#0088FE'
            }]
          }
        };
      });
    } else if (typeof aiResult.visualizations === 'object') {
      // Handle case where visualizations is an object with recommendations
      results.visualizationRecommendations = aiResult.visualizations;
      
      // Try to create visualizations from recommendations
      const recommendations = aiResult.visualizations;
      
      // Map visualization recommendations to actual visualizations
      if (recommendations.charts) {
        results.visualizations = recommendations.charts.slice(0, 3).map(chart => {
          return {
            type: chart.type || 'bar',
            title: chart.title || 'Data Visualization',
            // Use sample data for visualization
            data: dataSource.data.slice(0, 10),
            config: {
              xAxisKey: chart.xAxis || dataSource.columns[0],
              series: [{
                dataKey: chart.yAxis || dataSource.columns[1],
                name: chart.name || dataSource.columns[1],
                color: chart.color || '#0088FE'
              }]
            }
          };
        });
      }
    }
  }
  
  return results;
};

/**
 * Generates mock results based on agent type and data
 */
const generateMockResults = (agent, dataSource) => {
  const { type, capabilities } = agent;
  const { data, columns } = dataSource;

  // Basic validation
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return {
      success: false,
      error: 'Invalid data source: no data or columns found'
    };
  }

  // Basic results object
  const results = {
    success: true,
    agentId: agent.id,
    dataSourceId: dataSource.id,
    timestamp: new Date().toISOString(),
    summary: '',
    insights: [],
    visualizations: []
  };

  // Add statistical analysis if agent has that capability
  if (capabilities.includes('statistical-analysis')) {
    const numericColumns = columns.filter(col => {
      // Check if at least 50% of values are numbers
      const numericCount = data
        .filter(row => row[col] !== null && row[col] !== undefined)
        .filter(row => !isNaN(parseFloat(row[col])))
        .length;
      
      return numericCount > data.length * 0.5;
    });

    if (numericColumns.length > 0) {
      results.statistics = numericColumns.reduce((stats, col) => {
        const values = data
          .map(row => parseFloat(row[col]))
          .filter(val => !isNaN(val));
        
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        stats[col] = { mean, median, min, max, count: values.length };
        return stats;
      }, {});

      results.insights.push(
        `Found ${numericColumns.length} numeric columns for analysis`,
        `Average values range from ${Math.min(...Object.values(results.statistics).map(s => s.mean)).toFixed(2)} to ${Math.max(...Object.values(results.statistics).map(s => s.mean)).toFixed(2)}`
      );
    }
  }

  // Generate visualizations if agent is a visualizer
  if (type === 'visualizer' || capabilities.includes('chart-generation')) {
    // Find a numeric column for demonstration
    const numericCol = columns.find(col => 
      !isNaN(parseFloat(data[0][col]))
    );
    
    // Find a categorical column for demonstration
    const categoricalCol = columns.find(col => 
      isNaN(parseFloat(data[0][col])) && 
      typeof data[0][col] === 'string'
    );
    
    if (numericCol && categoricalCol) {
      // Add bar chart configuration
      results.visualizations.push({
        type: 'bar',
        title: `${categoricalCol} vs ${numericCol}`,
        data: data.slice(0, 10), // Limit to 10 rows for demo
        config: {
          xAxisKey: categoricalCol,
          series: [{
            dataKey: numericCol,
            name: numericCol,
            color: '#0088FE'
          }]
        }
      });
      
      // Add pie chart if value distribution makes sense
      results.visualizations.push({
        type: 'pie',
        title: `Distribution of ${categoricalCol}`,
        // Aggregate data for pie chart
        data: Object.entries(
          data.reduce((acc, row) => {
            const value = row[categoricalCol];
            acc[value] = (acc[value] || 0) + 1;
            return acc;
          }, {})
        ).map(([name, value]) => ({ name, value })).slice(0, 5), // Top 5 categories
        config: {
          nameKey: 'name',
          valueKey: 'value'
        }
      });
    }
  }

  // Generate text summary if agent is a summarizer
  if (type === 'summarizer' || capabilities.includes('text-summarization')) {
    results.summary = `Analysis of ${dataSource.name} (${data.length} rows, ${columns.length} columns):\n\n`;
    
    // Add insights based on data
    results.summary += `The dataset contains information about ${columns.join(', ')}.\n`;
    
    // Add more detailed insights if statistics are available
    if (results.statistics) {
      const statsInsights = Object.entries(results.statistics)
        .map(([col, stats]) => 
          `${col}: values range from ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)}, with an average of ${stats.mean.toFixed(2)}`
        );
      
      results.summary += `\nStatistical summary:\n${statsInsights.join('\n')}`;
    }
    
    // Add recommendations
    results.summary += `\n\nRecommendations:\n`;
    results.summary += `- Further analysis could focus on correlations between columns\n`;
    results.summary += `- Consider filtering outliers for more accurate insights\n`;
    results.summary += `- Time-based analysis might reveal trends if timestamp data is available`;
  }

  return results;
};