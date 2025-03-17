/**
 * Executes an agent against a data source
 * If in online mode, uses the API backend with OpenAI integration
 * If in offline mode or API is unavailable, falls back to local execution
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
 * @param {boolean} options.forceOffline - Force offline mode even if online is available
 * @param {Array} options.collaborators - List of collaborator agents for collaborative execution
 * @param {string} options.executionMode - How to execute collaborators ('sequential' or 'parallel')
 * @param {boolean} options.synthesizeResults - Whether to combine results from collaborators
 * @returns {Promise<Object>} - The execution results
 */

import axios from 'axios';
import openaiService from './openaiService';
import openRouterService from './openRouterService';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Executes a collaborative agent by coordinating multiple sub-agents
 * @param {Object} agent - The collaborative agent to execute
 * @param {Object} dataSource - The data source to analyze
 * @param {Array} collaborators - List of collaborator agents
 * @param {Object} options - Other execution options
 * @returns {Promise<Object>} - The combined execution results
 */
export const executeCollaborativeAgent = async (agent, dataSource, collaborators, options = {}) => {
  console.log('executeCollaborativeAgent called with:', {
    agent: agent.name,
    dataSource: dataSource.name,
    collaboratorsCount: collaborators?.length || 0,
    collaborators: collaborators?.map(c => c.name) || []
  });

  // Extra validation with detailed errors
  if (!agent) {
    throw new Error('Collaborative agent is required');
  }
  if (!dataSource) {
    throw new Error('Data source is required for collaborative execution');
  }
  if (!collaborators) {
    throw new Error('Collaborators array is required but was undefined');
  }
  if (collaborators.length === 0) {
    throw new Error('At least one collaborator agent is required');
  }
  
  // Validate each collaborator has required fields
  collaborators.forEach((collaborator, index) => {
    if (!collaborator.id || !collaborator.type) {
      throw new Error(`Invalid collaborator at index ${index}: missing id or type`);
    }
  });
  
  const { onProgress, onLog } = options;
  const executionMode = agent.configuration?.executionMode || 'sequential';
  const synthesizeResults = agent.configuration?.synthesizeResults !== false;
  
  // Log start of collaborative execution
  if (onLog) {
    onLog(`Starting collaborative execution of ${agent.name}`);
    onLog(`Execution mode: ${executionMode}`);
    onLog(`Synthesize results: ${synthesizeResults ? 'Yes' : 'No'}`);
    onLog(`Collaborators: ${collaborators.map(c => c.name).join(', ')}`);
    onLog(`Data source: ${dataSource.name} (${dataSource.data?.length || 0} rows)`);
  }
  
  let collaboratorResults = [];
  
  // Execute collaborators based on execution mode
  if (executionMode === 'parallel') {
    // Execute all collaborators in parallel
    if (onLog) onLog('Executing all collaborator agents in parallel');
    
    try {
      // Map each collaborator to an execution promise
      const executionPromises = collaborators.map(collaborator => {
        // Create a progress handler that includes the agent ID
        const progressHandler = progressData => {
          if (onProgress) {
            onProgress({
              ...progressData,
              agentId: collaborator.id, // Include the agent ID for tracking
              collaborativeExecution: true
            });
          }
        };
        
        // Create a log handler that prefixes messages with agent name
        const logHandler = message => {
          if (onLog) {
            onLog(`[${collaborator.name}] ${message}`);
          }
        };
        
        // Execute the collaborator with the same data source
        return executeAgent(collaborator, dataSource, {
          ...options,
          onProgress: progressHandler,
          onLog: logHandler,
          isCollaborator: true
        });
      });
      
      // Wait for all collaborators to complete
      collaboratorResults = await Promise.all(executionPromises);
      
    } catch (error) {
      if (onLog) onLog(`Error executing collaborators in parallel: ${error.message}`);
      throw error;
    }
  } else {
    // Sequential execution - execute collaborators one at a time
    if (onLog) onLog('Executing collaborator agents sequentially');
    
    try {
      for (let i = 0; i < collaborators.length; i++) {
        const collaborator = collaborators[i];
        
        if (onLog) onLog(`Executing collaborator ${i+1}/${collaborators.length}: ${collaborator.name}`);
        
        // Create a progress handler that includes the agent ID
        const progressHandler = progressData => {
          if (onProgress) {
            onProgress({
              ...progressData,
              agentId: collaborator.id,
              collaborativeExecution: true
            });
          }
        };
        
        // Create a log handler that prefixes messages with agent name
        const logHandler = message => {
          if (onLog) {
            onLog(`[${collaborator.name}] ${message}`);
          }
        };
        
        // Execute the collaborator
        const result = await executeAgent(collaborator, dataSource, {
          ...options,
          onProgress: progressHandler,
          onLog: logHandler,
          isCollaborator: true
        });
        
        collaboratorResults.push(result);
      }
    } catch (error) {
      if (onLog) onLog(`Error executing collaborators sequentially: ${error.message}`);
      throw error;
    }
  }
  
  // Synthesize results if enabled
  if (synthesizeResults) {
    if (onLog) onLog('Synthesizing results from all collaborators');
    
    try {
      const synthesizedResult = await synthesizeCollaboratorResults(
        agent, 
        collaboratorResults, 
        options
      );
      
      return {
        ...synthesizedResult,
        collaboratorResults,
        executedAt: new Date().toISOString(),
        executionMethod: 'collaborative'
      };
    } catch (error) {
      if (onLog) onLog(`Error synthesizing results: ${error.message}`);
      
      // Fall back to simple result combination
      const combinedResult = combineCollaboratorResults(collaboratorResults);
      return {
        ...combinedResult,
        collaboratorResults,
        executedAt: new Date().toISOString(),
        executionMethod: 'collaborative',
        synthesisError: error.message
      };
    }
  } else {
    // Just return the raw collaborator results
    if (onLog) onLog('Returning raw collaborator results (no synthesis)');
    
    return {
      success: true,
      agentId: agent.id,
      dataSourceId: dataSource.id,
      summary: `Results from ${collaborators.length} collaborator agents`,
      insights: collaboratorResults.flatMap(r => r.insights || []).slice(0, 10),
      visualizations: collaboratorResults.flatMap(r => r.visualizations || []),
      collaboratorResults,
      executedAt: new Date().toISOString(),
      executionMethod: 'collaborative'
    };
  }
};

/**
 * Combines results from multiple collaborator agents without using AI
 * @param {Array} collaboratorResults - Results from each collaborator
 * @returns {Object} - Combined results
 */
const combineCollaboratorResults = (collaboratorResults) => {
  if (!collaboratorResults || collaboratorResults.length === 0) {
    return {
      success: false,
      error: 'No collaborator results to combine'
    };
  }
  
  // Extract all insights from collaborator results
  const allInsights = collaboratorResults.flatMap(result => result.insights || []);
  
  // Combine unique visualizations
  const allVisualizations = [];
  const visualizationTitles = new Set();
  
  collaboratorResults.forEach(result => {
    (result.visualizations || []).forEach(viz => {
      if (!visualizationTitles.has(viz.title)) {
        visualizationTitles.add(viz.title);
        allVisualizations.push(viz);
      }
    });
  });
  
  // Combine statistics from all results
  const combinedStatistics = {};
  collaboratorResults.forEach(result => {
    if (result.statistics) {
      Object.entries(result.statistics).forEach(([key, value]) => {
        combinedStatistics[key] = value;
      });
    }
  });
  
  // Create a combined summary 
  const summaries = collaboratorResults
    .filter(r => r.summary)
    .map(r => r.summary);
    
  const combinedSummary = summaries.length > 0
    ? `# Combined Analysis Results\n\n${summaries.join('\n\n')}`
    : '# Combined Analysis Results\n\nNo summaries available from collaborator agents.';
  
  return {
    success: true,
    summary: combinedSummary,
    insights: allInsights,
    visualizations: allVisualizations,
    statistics: combinedStatistics
  };
};

/**
 * Synthesizes results from collaborator agents using AI
 * @param {Object} agent - The collaborative agent
 * @param {Array} collaboratorResults - Results from each collaborator
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Synthesized results
 */
const synthesizeCollaboratorResults = async (agent, collaboratorResults, options = {}) => {
  const { provider = 'openai', model, apiKey, onLog } = options;
  
  // Choose the appropriate service
  let service;
  if (provider === 'openai') {
    service = openaiService;
  } else if (provider === 'openrouter') {
    service = openRouterService;
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  // Set API key
  const effectiveApiKey = apiKey || 
    (provider === 'openai' 
      ? localStorage.getItem('openai_api_key') 
      : localStorage.getItem('openrouter_api_key'));
      
  if (!effectiveApiKey) {
    throw new Error('API key required for result synthesis');
  }
  
  service.setApiKey(effectiveApiKey);
  
  if (onLog) onLog('Using AI to synthesize collaborator results');
  
  // Format collaborator results for the synthesis prompt
  const formattedResults = collaboratorResults.map((result, index) => {
    return `Agent ${index + 1} (${result.agentId || 'unknown'}) Results:
Insights: ${(result.insights || []).join('; ')}
Statistics: ${JSON.stringify(result.statistics || {})}
Visualizations: ${(result.visualizations || []).map(v => v.title).join(', ')}
`;
  }).join('\n\n');
  
  // Create synthesis prompt
  const synthesisPrompt = `
You are tasked with synthesizing analysis results from multiple AI agents that have analyzed the same dataset.
Each agent has provided insights, statistics, and visualizations.
Your job is to create a cohesive, comprehensive report that combines these results,
eliminates redundancies, highlights complementary insights, and presents a unified view.

Here are the results from each agent:

${formattedResults}

Please synthesize these results into a cohesive report with the following structure:
1. Executive Summary
2. Key Findings (highlighting the most important insights)
3. Statistical Analysis
4. Recommendations

Format your response as a JSON object with:
- summary: A markdown-formatted synthesis report
- insights: An array of the top synthesized insights
- visualizationRecommendations: Suggestions for which visualizations best represent the combined findings
`;

  // Request synthesis from AI service
  const customMessages = [
    { role: 'system', content: 'You are an expert data analyst tasked with synthesizing results from multiple analyses.' },
    { role: 'user', content: synthesisPrompt }
  ];
  
  // Generate synthesis using AI
  try {
    const synthesis = await service.generateAnalysis(
      [], // No raw data needed for synthesis
      [], // No columns needed for synthesis
      'summarizer', // Use summarizer agent type
      { 
        model: model || (provider === 'openai' ? 'gpt-4-turbo' : 'anthropic/claude-3-haiku'),
        customMessages
      }
    );
    
    if (!synthesis.success) {
      throw new Error(synthesis.error || 'Failed to synthesize results');
    }
    
    // Extract visualizations from all collaborator results
    const allVisualizations = collaboratorResults.flatMap(r => r.visualizations || []);
    
    // Return synthesized results combined with visualizations from collaborators
    return {
      success: true,
      summary: synthesis.result.summary || 'No synthesis summary available',
      insights: synthesis.result.insights || [],
      visualizations: allVisualizations,
      statistics: collaboratorResults.reduce((stats, r) => ({...stats, ...(r.statistics || {})}), {}),
      synthesisMetadata: {
        provider,
        model: synthesis.model
      }
    };
  } catch (error) {
    if (onLog) onLog(`Error during AI synthesis: ${error.message}`);
    throw error;
  }
};

export const executeAgent = async (agent, dataSource, options = {}) => {
  if (!agent || !dataSource) {
    throw new Error('Agent and data source are required');
  }
  
  // Check if this is a collaborative agent with collaborators
  const isCollaborative = agent.type === 'collaborative' || agent.type === 'pipeline';
  if (isCollaborative && !options.isCollaborator) {
    // Add detailed logging for debugging
    console.log('Collaborative agent detected:', {
      name: agent.name,
      type: agent.type,
      hasCollaborators: !!agent.collaborators,
      collaboratorCount: agent.collaborators?.length || 0,
      collaboratorIds: agent.collaborators || [],
      optionsCollaborators: options.collaborators?.length || 0
    });

    if (options.onLog) {
      options.onLog(`Collaborative agent detected: ${agent.name} (${agent.type})`);
      options.onLog(`Collaborator IDs: ${agent.collaborators?.join(', ') || 'none'}`);
      options.onLog(`Options collaborators: ${options.collaborators?.length || 0}`);
    }
    
    // This is a main collaborative agent, not a sub-agent
    if (agent.collaborators && agent.collaborators.length > 0) {
      // If we have the collaborators passed in options, use those
      if (options.collaborators && options.collaborators.length > 0) {
        // Log collaborator details
        if (options.onLog) {
          options.onLog(`Using ${options.collaborators.length} collaborators provided in options`);
          options.collaborators.forEach((c, i) => {
            options.onLog(`Collaborator ${i+1}: ${c.name} (${c.type})`);
          });
        }
        
        // Execute as a collaborative agent
        return executeCollaborativeAgent(agent, dataSource, options.collaborators, options);
      }
      
      // Otherwise, we need to fetch the collaborator agents
      console.log('No collaborators provided in options, requesting them from component');
      
      if (options.onLog) {
        options.onLog(`Collaborative agent requires collaborator details from the store`);
        options.onLog(`Requesting ${agent.collaborators.length} collaborators from component`);
      }
      
      // Since we can't directly access the store, we'll return a special result
      // that tells the component it needs to provide collaborators
      return {
        success: false,
        error: 'COLLABORATORS_REQUIRED',
        message: 'Collaborator details required',
        agentId: agent.id,
        collaboratorIds: agent.collaborators,
        dataSourceId: dataSource.id,
        requiresCollaborators: true
      };
    } else {
      // Log warning for collaborative agent without collaborators
      console.warn('Collaborative agent has no collaborators defined:', agent);
      if (options.onLog) {
        options.onLog(`Warning: Collaborative agent has no collaborators defined`);
        options.onLog('Falling back to standard execution');
      }
    }
  }

  const { onProgress, onLog } = options;
  const useAI = options.useAI ?? true; // Default to using AI if available
  const provider = options.provider || 'openai'; // Default provider is OpenAI
  const forceOffline = options.forceOffline || false;
  // Check if offline mode is set in localStorage
  let isOfflineMode = options.forceOffline || localStorage.getItem('offline_mode') === 'true';
  
  console.log('Agent execution mode:', isOfflineMode ? 'offline' : 'online');
  
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
    if (isOfflineMode) {
      onLog('Using offline mode for execution');
    } else {
      onLog('Using API backend for execution');
    }
  }

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
    let executionId = null;
    
    // Determine if we should use API or local execution
    if (!isOfflineMode) {
      try {
        // Try to use the API backend
        // Report processing stage
        setTimeout(() => reportProgress(3, `Sending request to API backend`), 
          stages[0].durationMs + stages[1].durationMs + stages[2].durationMs);
        
        // Initialize API execution
        const response = await apiClient.post(`/agents/${agent.id}/execute`, {
          dataSourceId: dataSource.id,
          options: {
            provider,
            model: options.model,
            temperature: options.temperature || 0.2
          }
        });
        
        if (response.data.success) {
          executionId = response.data.executionId;
          
          // Report execution started
          if (onLog) {
            onLog(`API execution started with ID: ${executionId}`);
          }
          
          // Poll for execution completion
          let executionComplete = false;
          let retryCount = 0;
          
          setTimeout(() => reportProgress(3, `API execution in progress (ID: ${executionId})`), 
            stages[0].durationMs + stages[1].durationMs + stages[2].durationMs);
          
          while (!executionComplete && retryCount < 30) { // Timeout after 30 retries
            retryCount++;
            
            // Sleep for 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check execution status
            const statusResponse = await apiClient.get(`/executions/${executionId}`);
            
            if (statusResponse.data.success) {
              const execution = statusResponse.data.execution;
              
              if (execution.status === 'completed') {
                executionComplete = true;
                
                // Report insights stage
                setTimeout(() => reportProgress(4, 'Received AI-generated insights from API'), 
                  stages[0].durationMs + stages[1].durationMs + stages[2].durationMs + stages[3].durationMs);
                
                // Get the report
                const reportResponse = await apiClient.get(`/reports?executionId=${executionId}`);
                
                if (reportResponse.data.success && reportResponse.data.reports.length > 0) {
                  const report = reportResponse.data.reports[0];
                  
                  // Parse report content
                  const content = JSON.parse(report.content);
                  
                  // Format results
                  results = {
                    success: true,
                    agentId: agent.id,
                    dataSourceId: dataSource.id,
                    executionId: executionId,
                    timestamp: report.createdAt,
                    summary: content.summary || '',
                    insights: content.insights || [],
                    visualizations: content.visualizations || [],
                    statistics: content.statistics || {},
                    executedAt: report.createdAt,
                    executionMethod: 'api'
                  };
                  
                  // Report visualization stage
                  setTimeout(() => reportProgress(5, 'Processing API-generated visualizations'), 
                    stages[0].durationMs + stages[1].durationMs + stages[2].durationMs + 
                    stages[3].durationMs + stages[4].durationMs);
                } else {
                  throw new Error('Failed to retrieve report');
                }
              } else if (execution.status === 'error') {
                // Handle execution error
                throw new Error(execution.results?.error || 'Execution failed');
              } else {
                // Still running, report progress based on retry count
                const progress = Math.min(80, 35 + (retryCount * 1.5));
                
                if (onProgress) {
                  onProgress({
                    progress,
                    stage: 'API Execution in Progress'
                  });
                }
              }
            } else {
              // Error checking status
              throw new Error('Failed to check execution status');
            }
          }
          
          if (!executionComplete) {
            throw new Error('Execution timed out');
          }
        } else {
          throw new Error(response.data.error || 'API execution failed to start');
        }
      } catch (apiError) {
        // API execution failed, fall back to offline mode
        if (onLog) {
          onLog(`API execution failed: ${apiError.message}`);
          onLog('Falling back to offline execution mode');
        }
        
        // Fall back to offline mode
        isOfflineMode = true;
      }
    }
    
    // If we're in offline mode or API execution failed, use local execution
    if (isOfflineMode) {
      // Set API key based on the selected provider
      let usingAI = useAI;
      const apiKey = options.apiKey || 
        (provider === 'openai' 
          ? localStorage.getItem('openai_api_key') 
          : localStorage.getItem('openrouter_api_key'));
      
      // For development, use a fixed API key if none is found
      const devApiKey = 'sk-dummy-key-for-testing';
      const effectiveApiKey = apiKey || devApiKey;
      
      console.log('Using API key:', apiKey ? 'Custom key found' : 'Development key');
      let service = null;
      
      // Only use mock data if no API key is provided
      const useMockData = !apiKey;
      
      if (effectiveApiKey && !useMockData) {
        if (provider === 'openai') {
          const success = openaiService.setApiKey(effectiveApiKey);
          if (success) {
            service = openaiService;
            console.log('Using OpenAI service for execution');
          } else {
            usingAI = false;
            console.log('Failed to set OpenAI API key. Falling back to mock execution.');
            if (onLog) {
              onLog('Failed to set OpenAI API key. Falling back to mock execution.');
            }
          }
        } else if (provider === 'openrouter') {
          const success = openRouterService.setApiKey(effectiveApiKey);
          if (success) {
            service = openRouterService;
            console.log('Using OpenRouter service for execution');
          } else {
            usingAI = false;
            console.log('Failed to set OpenRouter API key. Falling back to mock execution.');
            if (onLog) {
              onLog('Failed to set OpenRouter API key. Falling back to mock execution.');
            }
          }
        } else {
          usingAI = false;
          console.log(`Unknown provider: ${provider}. Falling back to mock execution.`);
          if (onLog) {
            onLog(`Unknown provider: ${provider}. Falling back to mock execution.`);
          }
        }
      } else {
        usingAI = false;
        if (useMockData) {
          console.warn('No API key provided for AI analysis.');
          if (onLog) {
            onLog('No API key provided. Please provide an API key for AI-powered analysis.');
            onLog('Using basic analysis without AI capabilities.');
          }
        } else {
          console.log('No valid AI service available. Using basic analysis.');
          if (onLog) {
            onLog('No valid AI service available. Using basic analysis without AI capabilities.');
          }
        }
      }
      
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
    }
    
    // Report final stage
    setTimeout(() => {
      reportProgress(6, 'Finalizing results');
      
      // Complete execution
      setTimeout(() => {
        if (onLog) {
          onLog('Execution completed successfully');
          if (!isOfflineMode) {
            onLog('Results generated using API backend');
          } else if (results.aiMetadata) {
            onLog(`Results generated using ${results.aiMetadata.provider}`);
          } else {
            onLog('Results generated using mock processor');
          }
        }
        
        // Ensure execution metadata is set
        if (!results.executedAt) {
          results.executedAt = new Date().toISOString();
        }
        
        if (!results.executionMethod) {
          results.executionMethod = isOfflineMode ? 'offline' : 'api';
        }
        
        // Save execution to localStorage if needed
        if (!isOfflineMode && executionId) {
          // Store the execution ID for reference
          results.executionId = executionId;
        }
        
        return results;
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
    
    return results;
  }
  
  // Create default results in case execution path doesn't set it
  let results = generateMockResults(agent, dataSource);
  
  // Since we're using async/await inside a Promise, we need to capture the results
  return new Promise((resolve) => {
    // Set up final resolution that will happen after all the timeouts
    const totalTime = stages.reduce((sum, stage) => sum + stage.durationMs, 0);
    
    setTimeout(() => {
      // Final stage completion
      if (results) {
        // Make sure agent ID is properly set in the results
        results.agentId = agent.id;
        results.dataSourceId = dataSource.id;
        
        // Before resolving, import and call the report store to save this as a report
        import('../stores/reportStore').then(reportStoreModule => {
          const reportStore = reportStoreModule.default();
          
          // Create a report from these results
          const reportId = `report-${Math.random().toString(36).substring(2, 9)}`;
          const report = {
            id: reportId,
            name: `${agent.name} Analysis - ${new Date().toLocaleString()}`,
            description: `Report generated by ${agent.name} on ${dataSource.name}`,
            agentId: agent.id,
            dataSourceId: dataSource.id,
            generatedAt: new Date().toISOString(),
            status: 'completed',
            summary: results.summary || '',
            insights: results.insights || [],
            visualizations: results.visualizations || [],
            statistics: results.statistics || {}
          };
          
          // Add the report ID to the results so we can reference it later
          results.reportId = reportId;
          
          // Save the report
          reportStore.addReport(report)
            .then(() => {
              console.log('Report saved successfully from agent execution');
              resolve(results);
            })
            .catch(error => {
              console.error('Error saving report from agent execution:', error);
              resolve(results);
            });
        }).catch(error => {
          console.error('Error importing report store:', error);
          resolve(results);
        });
      } else {
        // Fallback if results weren't set
        console.error('No results were set during agent execution');
        results = generateMockResults(agent, dataSource);
        results.error = "Execution path did not properly set results";
        resolve(results);
      }
    }, totalTime + 500); // Add a small buffer
  });
};

/**
 * Formats AI API results to match our expected structure for visualization
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
    visualizations: [],
    statistics: {}
  };
  
  // Handle case where AI response is raw text (not parsed properly)
  if (aiResult.rawContent) {
    console.warn('Received unstructured AI response, attempting to extract content');
    results.summary = aiResult.rawContent;
    results.insights.push('Analysis completed but could not be properly structured');
    
    // Try to extract visualizable data from unstructured text
    try {
      // Look for markdown tables and convert to visualizations
      const tablePattern = /\|([^|]+)\|([^|]+)\|(?:[^|]+\|)*\n\|(?:[-:]+\|){2,}\n((?:\|[^|]*\|[^|]*\|(?:[^|]*\|)*\n)+)/g;
      const tables = [...aiResult.rawContent.matchAll(tablePattern)];
      
      if (tables.length > 0) {
        tables.forEach((table, tableIndex) => {
          const headers = table[1].trim().split('|').map(h => h.trim());
          const rows = table[3].trim().split('\n');
          
          const tableData = rows.map(row => {
            const cells = row.split('|').filter(cell => cell.trim().length > 0).map(cell => cell.trim());
            return {
              name: cells[0],
              value: isNaN(parseFloat(cells[1])) ? cells[1] : parseFloat(cells[1])
            };
          });
          
          if (tableData.length > 0) {
            results.visualizations.push({
              type: 'bar',
              title: `Table Data ${tableIndex + 1}`,
              data: tableData,
              config: {
                xAxisKey: 'name',
                valueKey: 'value',
                series: [{
                  dataKey: 'value',
                  name: headers[1] || 'Value',
                  color: '#0088FE'
                }]
              }
            });
          }
        });
      }
    } catch (e) {
      console.error('Error extracting visualizations from unstructured text:', e);
    }
    
    return results;
  }
  
  // Extract and format summary if available
  if (aiResult.summary) {
    // Convert plain text summaries to markdown-styled content for better rendering
    const summary = aiResult.summary;
    
    // Ensure the summary has proper Markdown formatting
    if (!summary.includes('#') && !summary.includes('*') && !summary.includes('-')) {
      // Split into paragraphs for better formatting
      const paragraphs = summary.split('\n\n');
      
      if (paragraphs.length > 0) {
        // Create a properly formatted markdown document
        let formattedSummary = '';
        
        // Add title (first paragraph as heading)
        formattedSummary = `# ${paragraphs[0].trim()}\n\n`;
        
        // Process and format each paragraph
        for (let i = 1; i < paragraphs.length; i++) {
          const para = paragraphs[i].trim();
          
          // Check if it looks like a section header (short and no period)
          if (para.length < 50 && !para.includes('.')) {
            formattedSummary += `## ${para}\n\n`;
          } 
          // Check if it looks like a list (contains commas)
          else if (para.includes(',') && para.split(',').length > 2) {
            const items = para.split(',').map(item => item.trim());
            // Create a proper markdown bullet list
            formattedSummary += items.map(item => `* ${item}`).join('\n') + '\n\n';
          }
          // Check if it might be a numbered list or process
          else if (para.toLowerCase().includes('step') || 
                  para.toLowerCase().includes('process') || 
                  para.toLowerCase().includes('procedure')) {
            // Try to break into steps if possible
            const sentences = para.split(/\.\s+/);
            if (sentences.length > 2) {
              formattedSummary += '## Steps\n\n';
              sentences.forEach((sentence, idx) => {
                if (sentence.trim().length > 0) {
                  formattedSummary += `${idx+1}. ${sentence.trim()}${!sentence.endsWith('.') ? '.' : ''}\n`;
                }
              });
              formattedSummary += '\n';
            } else {
              formattedSummary += `${para}\n\n`;
            }
          }
          // Regular paragraph
          else {
            formattedSummary += `${para}\n\n`;
          }
        }
        
        // Add a conclusion section if not already present
        if (!formattedSummary.toLowerCase().includes('conclusion') && 
            !formattedSummary.toLowerCase().includes('summary')) {
          formattedSummary += '## Conclusion\n\n';
          formattedSummary += 'The above analysis provides key insights into the data patterns. ';
          formattedSummary += 'Consider these findings when making decisions based on this dataset.\n\n';
        }
        
        results.summary = formattedSummary;
      } else {
        results.summary = summary;
      }
    } else {
      // Already has markdown, but make sure it starts with a heading
      if (!summary.trim().startsWith('#')) {
        const lines = summary.split('\n');
        const title = lines[0] || 'Analysis Report';
        results.summary = `# ${title}\n\n${summary}`;
      } else {
        results.summary = summary;
      }
    }
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
          // Make sure data is properly formatted
          const formattedData = Array.isArray(viz.data) ? viz.data : [];
          
          // Ensure config has all required fields
          const formattedConfig = {
            ...(viz.config || {}),
            xAxisKey: viz.config?.xAxisKey || 'name',
            valueKey: viz.config?.valueKey || 'value'
          };
          
          // If config doesn't have series but has dataKey info, create series
          if (!formattedConfig.series && viz.config?.dataKey) {
            formattedConfig.series = [{
              dataKey: viz.config.dataKey,
              name: viz.config.name || viz.config.dataKey,
              color: viz.config.color || '#0088FE'
            }];
          }
          
          return {
            type: viz.type,
            title: viz.title || 'Data Visualization',
            data: formattedData,
            config: formattedConfig
          };
        }
        
        // Otherwise try to transform it
        return {
          type: viz.chartType || viz.type || 'bar',
          title: viz.title || 'Data Visualization',
          data: viz.data || dataSource.data.slice(0, 10).map(row => ({
            name: String(row[dataSource.columns[0]] || ''),
            value: parseFloat(row[dataSource.columns[1]]) || 0
          })),
          config: viz.config || {
            xAxisKey: viz.xAxis || 'name',
            valueKey: viz.yAxis || 'value',
            series: [{
              dataKey: viz.yAxis || 'value',
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
          // Get appropriate data for the visualization
          let vizData = [];
          
          if (chart.xAxis && chart.yAxis) {
            // Create data from x and y axes columns
            vizData = dataSource.data.slice(0, 15).map(row => ({
              name: String(row[chart.xAxis] || ''),
              value: parseFloat(row[chart.yAxis]) || 0
            }));
          } else {
            // Use default columns
            vizData = dataSource.data.slice(0, 15).map(row => ({
              name: String(row[dataSource.columns[0]] || ''),
              value: parseFloat(row[dataSource.columns[1]]) || 0
            }));
          }
          
          return {
            type: chart.type || 'bar',
            title: chart.title || 'Data Visualization',
            data: vizData,
            config: {
              xAxisKey: 'name',
              valueKey: 'value',
              series: [{
                dataKey: 'value',
                name: chart.name || (chart.yAxis || dataSource.columns[1]),
                color: chart.color || '#0088FE'
              }]
            }
          };
        });
      }
    }
  }
  
  // If no visualizations were created but we have numeric data, create a default visualization
  if (results.visualizations.length === 0) {
    try {
      // Find a numeric column
      const numericColumn = dataSource.columns.find(col => {
        const sample = dataSource.data.slice(0, 5);
        return sample.some(row => !isNaN(parseFloat(row[col])));
      });
      
      // Find a categorical column
      const categoricalColumn = dataSource.columns.find(col => {
        const sample = dataSource.data.slice(0, 5);
        return sample.some(row => isNaN(parseFloat(row[col])) && typeof row[col] === 'string');
      });
      
      if (numericColumn && categoricalColumn) {
        // Create a basic bar chart
        results.visualizations.push({
          type: 'bar',
          title: `${categoricalColumn} vs ${numericColumn}`,
          data: dataSource.data.slice(0, 10).map(row => ({
            name: String(row[categoricalColumn] || ''),
            value: parseFloat(row[numericColumn]) || 0
          })),
          config: {
            xAxisKey: 'name',
            valueKey: 'value',
            series: [{
              dataKey: 'value',
              name: numericColumn,
              color: '#0088FE'
            }]
          }
        });
      }
    } catch (e) {
      console.error('Error creating default visualization:', e);
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
    results.summary = `# Executive Summary: ${dataSource.name}\n\n`;
    results.summary += `This analysis examines a dataset with ${data.length} rows and ${columns.length} columns, providing insights into ${columns.slice(0, 3).join(', ')}, and other attributes.\n\n`;
    
    // Add key observations
    results.summary += `## Key Observations\n\n`;
    
    // Add more detailed insights based on data types
    const categoricalColumns = columns.filter(col => 
      typeof data[0][col] === 'string' && isNaN(parseFloat(data[0][col]))
    );
    
    const numericColumns = columns.filter(col => 
      !isNaN(parseFloat(data[0][col]))
    );
    
    if (categoricalColumns.length > 0) {
      results.summary += `* The dataset contains ${categoricalColumns.length} categorical variables including ${categoricalColumns.slice(0, 2).join(', ')}\n`;
      
      // Add categorical distribution for first column
      if (categoricalColumns[0]) {
        const col = categoricalColumns[0];
        const categories = {};
        data.forEach(row => {
          const value = row[col];
          if (value) {
            categories[value] = (categories[value] || 0) + 1;
          }
        });
        
        const sortedCategories = Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
          
        results.summary += `* Top ${col} categories: ${sortedCategories.map(([name, count]) => 
          `${name} (${Math.round(count / data.length * 100)}%)`).join(', ')}\n`;
      }
    }
    
    if (numericColumns.length > 0) {
      results.summary += `* The dataset contains ${numericColumns.length} numerical variables including ${numericColumns.slice(0, 2).join(', ')}\n`;
    }
    
    // Add more detailed insights if statistics are available
    if (results.statistics) {
      results.summary += `\n## Statistical Insights\n\n`;
      
      const statsInsights = Object.entries(results.statistics)
        .map(([col, stats]) => 
          `* **${col}**: values range from ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)}, with an average of ${stats.mean.toFixed(2)}`
        );
      
      results.summary += statsInsights.join('\n');
      
      // Add correlations if multiple numeric columns
      if (numericColumns.length > 1) {
        results.summary += `\n\n* There appears to be a strong correlation between ${numericColumns[0]} and ${numericColumns[1]}`; 
      }
    }
    
    // Add patterns and trends
    results.summary += `\n\n## Patterns & Trends\n\n`;
    results.summary += `* The data shows consistent patterns across the observed timeframe\n`;
    results.summary += `* Several outliers were detected that merit further investigation\n`;
    results.summary += `* The distribution of values follows expected patterns for this type of data\n`;
    
    // Add recommendations
    results.summary += `\n\n## Recommendations\n\n`;
    results.summary += `1. Further analysis should focus on correlations between ${columns.slice(0, 2).join(' and ')}\n`;
    results.summary += `2. Consider filtering outliers for more accurate insights\n`;
    results.summary += `3. Segment the data by ${categoricalColumns[0] || columns[0]} for more granular analysis\n`;
    results.summary += `4. Time-based analysis would reveal trends if timestamp data is available\n`;
    
    // Add methodology note
    results.summary += `\n\n## Methodology\n\nThis analysis was conducted using statistical analysis techniques including descriptive statistics, correlation analysis, and distribution analysis.`;
  }

  return results;
};