/**
 * Simulates agent execution with mock processing and progress updates
 * In a real implementation, this would connect to an LLM or other AI service
 * 
 * @param {Object} agent - The agent to execute
 * @param {Object} dataSource - The data source to analyze
 * @param {Object} options - Execution options
 * @param {Function} options.onProgress - Callback for progress updates
 * @param {Function} options.onLog - Callback for log messages
 * @returns {Promise<Object>} - The execution results
 */
export const executeAgent = async (agent, dataSource, options = {}) => {
  if (!agent || !dataSource) {
    throw new Error('Agent and data source are required');
  }

  const { onProgress, onLog } = options;
  
  // Return a promise to simulate async processing
  return new Promise((resolve) => {
    // Define execution stages
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
    }

    // Execute stages sequentially
    let currentStageIndex = 0;

    const executeStage = () => {
      if (currentStageIndex >= stages.length) {
        // All stages completed, generate and return results
        const results = generateMockResults(agent, dataSource);
        if (onLog) {
          onLog('Execution completed successfully');
        }
        resolve(results);
        return;
      }

      const currentStage = stages[currentStageIndex];
      
      if (onProgress) {
        onProgress({
          progress: currentStage.progress,
          stage: currentStage.name
        });
      }

      if (onLog) {
        onLog(`Stage: ${currentStage.name}`);
        
        // Add specific log messages for certain stages
        switch (currentStage.name) {
          case 'Loading data':
            onLog(`Processing ${dataSource.metadata?.rowCount || 0} rows of data`);
            break;
          case 'Analyzing data structure':
            onLog(`Identified ${dataSource.metadata?.columnCount || 0} columns for analysis`);
            break;
          case 'Processing data':
            if (agent.capabilities.includes('statistical-analysis')) {
              onLog('Performing statistical analysis on numeric columns');
            }
            break;
          case 'Generating insights':
            onLog(`Applying ${agent.capabilities.length} capabilities to extract insights`);
            break;
          case 'Creating visualizations':
            if (agent.capabilities.includes('chart-generation')) {
              onLog('Generating appropriate charts for data visualization');
            }
            break;
          default:
            break;
        }
      }

      setTimeout(() => {
        currentStageIndex++;
        executeStage();
      }, currentStage.durationMs);
    };

    // Start execution
    executeStage();
  });
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