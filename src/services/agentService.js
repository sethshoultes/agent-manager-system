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
  
  // Determine execution mode (online/offline) for all collaborators
  const isOfflineMode = options.forceOffline || localStorage.getItem('offline_mode') === 'true';
  console.log('Collaborative agent execution mode:', isOfflineMode ? 'offline' : 'online');
  
  // Log start of collaborative execution
  if (onLog) {
    onLog(`Starting collaborative execution of ${agent.name}`);
    onLog(`Execution mode: ${executionMode}`);
    onLog(`Online/Offline mode: ${isOfflineMode ? 'offline' : 'online'}`);
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
        
        // Execute the collaborator with the same data source and execution mode
        return executeAgent(collaborator, dataSource, {
          ...options,
          onProgress: progressHandler,
          onLog: logHandler,
          isCollaborator: true,
          parentExecutionMode: isOfflineMode ? 'offline' : 'online',
          // Ensure same API key is used for all collaborators
          apiKey: options.apiKey
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
        
        // Execute the collaborator - pass parent execution mode
        const result = await executeAgent(collaborator, dataSource, {
          ...options,
          onProgress: progressHandler,
          onLog: logHandler,
          isCollaborator: true,
          parentExecutionMode: isOfflineMode ? 'offline' : 'online',
          // Ensure same API key is used for all collaborators
          apiKey: options.apiKey
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
      // Validate that we have full results from all collaborators
      const validResults = collaboratorResults.filter(r => r && r.success !== false);
      if (validResults.length < collaboratorResults.length) {
        if (onLog) onLog(`Warning: Only ${validResults.length} of ${collaboratorResults.length} collaborators returned valid results`);
      }
      
      if (validResults.length === 0) {
        throw new Error('No valid results from any collaborators to synthesize');
      }
      
      // Log the result structure to help with debugging
      if (onLog) {
        onLog(`Collaborator result structures: ${validResults.map(r => 
          `${Object.keys(r).join(',')}`
        ).join(' | ')}`);
      }
      
      const synthesizedResult = await synthesizeCollaboratorResults(
        agent, 
        validResults, // Only use valid results
        options
      );
      
      // Add success flag explicitly
      return {
        success: true,
        ...synthesizedResult,
        collaboratorResults: validResults,
        executedAt: new Date().toISOString(),
        executionMethod: 'collaborative'
      };
    } catch (error) {
      if (onLog) onLog(`Error synthesizing results: ${error.message}`);
      
      // Try to create a minimal valid result from collaborator pieces
      try {
        if (onLog) onLog('Attempting to create basic result from collaborator fragments');
        
        // Get any insights we can
        const allInsights = collaboratorResults
          .filter(r => r && Array.isArray(r.insights))
          .flatMap(r => r.insights);
          
        // Get any visualizations we can
        const allVisualizations = collaboratorResults
          .filter(r => r && Array.isArray(r.visualizations))
          .flatMap(r => r.visualizations);
          
        // Get any summary we can
        const summaries = collaboratorResults
          .filter(r => r && r.summary)
          .map(r => r.summary);
          
        const minimalResult = {
          success: true,
          agentId: agent.id,
          dataSourceId: dataSource.id,
          summary: summaries.length > 0 
            ? `# Combined Results\n\n${summaries.join('\n\n')}` 
            : '# Analysis Complete\n\nThe collaborative agent has completed its analysis.',
          insights: allInsights.length > 0 ? allInsights : ['Analysis completed successfully'],
          visualizations: allVisualizations,
          collaboratorResults,
          synthesisError: error.message,
          executedAt: new Date().toISOString(),
          executionMethod: 'collaborative-fallback'
        };
        
        if (onLog) onLog(`Created backup result with ${minimalResult.insights.length} insights and ${minimalResult.visualizations.length} visualizations`);
        return minimalResult;
      } catch (fallbackError) {
        if (onLog) onLog(`Fallback also failed: ${fallbackError.message}`);
        
        // Return error as a last resort
        return {
          success: false,
          error: `Failed to synthesize results: ${error.message}`,
          collaboratorResults,
          executedAt: new Date().toISOString(),
          executionMethod: 'error',
          synthesisError: error.message
        };
      }
    }
  } else {
    // Just return the raw collaborator results
    if (onLog) onLog('Returning raw collaborator results (no synthesis)');
    
    // Validate results first
    const validResults = collaboratorResults.filter(r => r && r.success !== false);
    if (validResults.length < collaboratorResults.length) {
      if (onLog) onLog(`Warning: Only ${validResults.length} of ${collaborators.length} collaborators returned valid results`);
    }
    
    // Even if some collaborators failed, try to create a valid result
    const allInsights = validResults.flatMap(r => r.insights || []);
    const allVisualizations = validResults.flatMap(r => r.visualizations || []);
    
    if (validResults.length === 0) {
      if (onLog) onLog('No valid results from any collaborators, returning error');
      return {
        success: false,
        error: 'No valid results from any collaborators',
        agentId: agent.id,
        dataSourceId: dataSource.id,
        executedAt: new Date().toISOString(),
        executionMethod: 'error'
      };
    }
    
    return {
      success: true,
      agentId: agent.id,
      dataSourceId: dataSource.id,
      summary: `Results from ${validResults.length} of ${collaborators.length} collaborator agents`,
      insights: allInsights.slice(0, 10),
      visualizations: allVisualizations,
      collaboratorResults: validResults,
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
  
  // Validate we have actual content before combining
  const summaries = collaboratorResults
    .filter(r => r.summary && r.summary.trim().length > 0)
    .map(r => r.summary);
    
  // Check if we have valid data to return
  if (summaries.length === 0 || allInsights.length === 0) {
    return {
      success: false,
      error: 'No valid summaries or insights available from collaborator agents',
      rawCollaboratorCount: collaboratorResults.length
    };
  }
  
  // Create a combined summary with actual content
  const combinedSummary = `# Combined Analysis Results\n\n${summaries.join('\n\n')}`;
  
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
  
  // Get API key from options or try both individual item and combined settings format
  let effectiveApiKey = apiKey;
  
  if (!effectiveApiKey) {
    // Try to load from the combined settings first
    try {
      const aiSettings = JSON.parse(localStorage.getItem('ai_settings') || '{}');
      if (aiSettings && aiSettings.providers && aiSettings.providers[provider]) {
        effectiveApiKey = aiSettings.providers[provider].key;
      }
    } catch (e) {
      console.error('Error parsing AI settings:', e);
    }
    
    // Fall back to individual key storage if needed
    if (!effectiveApiKey) {
      effectiveApiKey = provider === 'openai' 
        ? localStorage.getItem('openai_api_key') 
        : localStorage.getItem('openrouter_api_key');
    }
  }
      
  if (!effectiveApiKey) {
    throw new Error('API key required for result synthesis');
  }
  
  service.setApiKey(effectiveApiKey);
  
  if (onLog) onLog('Using AI to synthesize collaborator results');
  
  // Validate that collaborator results have actual content
  const validCollaborators = collaboratorResults.filter(result => 
    (result.insights && result.insights.length > 0) || 
    (result.summary && result.summary.trim().length > 0) ||
    (result.visualizations && result.visualizations.length > 0)
  );
  
  if (validCollaborators.length === 0) {
    throw new Error('No valid data found in any collaborator results');
  }
  
  // Format collaborator results for the synthesis prompt
  const formattedResults = validCollaborators.map((result, index) => {
    return `Agent ${index + 1} (${result.agentId || 'unknown'}) Results:
Insights: ${(result.insights || []).join('; ')}
Statistics: ${JSON.stringify(result.statistics || {})}
Visualizations: ${(result.visualizations || []).map(v => v.title).join(', ')}
Summary: ${result.summary || 'No summary provided'}
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
  // Force consistent execution mode across all agents
  const isOfflineMode = options.isCollaborator && options.parentExecutionMode 
    ? options.parentExecutionMode === 'offline' // Use parent mode when in collaborative execution
    : options.forceOffline || localStorage.getItem('offline_mode') === 'true'; // Otherwise use settings
  
  if (options.isCollaborator && options.parentExecutionMode) {
    console.log('Using collaborator execution mode from parent:', options.parentExecutionMode);
  }
  
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
        
        // Set a mock token if one doesn't exist (for testing)
        if (!localStorage.getItem('token')) {
          console.log('Setting mock token for API authentication');
          localStorage.setItem('token', 'mock-token-for-api-testing');
          if (onLog) {
            onLog('Setting mock authentication token for API access');
          }
        }
        
        // Ensure we're using a consistent API key for all requests
        const apiKey = options.apiKey || localStorage.getItem('openai_api_key');
        
        // Initialize API execution
        const response = await apiClient.post(`/agents/${agent.id}/execute`, {
          dataSourceId: dataSource.id,
          options: {
            provider,
            model: options.model,
            temperature: options.temperature || 0.2,
            apiKey: apiKey // Pass API key explicitly to backend
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
      
      // Get API key from options or try both individual item and combined settings format
      let apiKey = options.apiKey;
      
      if (!apiKey) {
        // Try to load from the combined settings first
        try {
          const aiSettings = JSON.parse(localStorage.getItem('ai_settings') || '{}');
          console.log('AI settings from localStorage:', JSON.stringify(aiSettings));
          if (aiSettings && aiSettings.providers && aiSettings.providers[provider]) {
            apiKey = aiSettings.providers[provider].key;
          }
        } catch (e) {
          console.error('Error parsing AI settings:', e);
        }
        
        // Fall back to individual key storage if needed
        if (!apiKey) {
          const individualKey = provider === 'openai' 
            ? localStorage.getItem('openai_api_key') 
            : localStorage.getItem('openrouter_api_key');
            
          console.log(`Individual ${provider} key from localStorage:`, individualKey ? 'Key found' : 'No key found');
          apiKey = individualKey;
        }
      }
      
      const effectiveApiKey = apiKey;
      
      console.log('Using API key for execution:', provider, effectiveApiKey ? 'Valid key found (length: ' + effectiveApiKey.length + ')' : 'No valid key found');
      let service = null;
      
      if (effectiveApiKey) {
        if (provider === 'openai') {
          console.log('Attempting to set OpenAI API key...');
          const success = openaiService.setApiKey(effectiveApiKey);
          if (success) {
            service = openaiService;
            console.log('Successfully configured OpenAI service for execution');
            if (onLog) {
              onLog('OpenAI service configured successfully');
            }
          } else {
            usingAI = false;
            console.log('Failed to set OpenAI API key. API calls will not work.');
            if (onLog) {
              onLog('Failed to set OpenAI API key. API calls will not work.');
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
        console.error('No API key found for execution. Reports cannot be generated.');
        if (onLog) {
          onLog('ERROR: No API key found. Please add an API key in Settings.');
          onLog('API-powered analysis is required for this application to function.');
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
            onLog(`Error using ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'}: ${response.error}`);
          }
          // Return error since we can't use AI services
          results = {
            success: false,
            agentId: agent.id,
            dataSourceId: dataSource.id,
            error: `Error using ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'}: ${response.error}`,
            executedAt: new Date().toISOString(),
            executionMethod: 'error'
          };
        }
      } else {
        // No API key or AI service available - return error
        if (onLog) {
          onLog('No API key provided or AI service unavailable');
          onLog('ERROR: This system requires a valid API key to function');
        }
        
        // Set error result
        results = {
          success: false,
          agentId: agent.id,
          dataSourceId: dataSource.id,
          error: 'API key required - this system does not support offline mode',
          executedAt: new Date().toISOString(),
          executionMethod: 'error'
        };
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
            onLog('No results were generated');
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
    }
    
    // Return error without falling back to mock data
    return {
      success: false,
      agentId: agent.id,
      dataSourceId: dataSource.id,
      error: error.message,
      executedAt: new Date().toISOString(),
      executionMethod: 'error'
    };
  }
  
  // Initialize results as null - it must be set during execution
  let results = null;
  
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
          
          // Save the report with enhanced logging
          console.log('Attempting to save report to store:', {
            reportId: reportId,
            agentName: agent.name,
            dataSource: dataSource.name,
            hasSummary: !!results.summary,
            insightsCount: (results.insights || []).length,
            visualizationsCount: (results.visualizations || []).length
          });
          
          reportStore.addReport(report)
            .then((savedReport) => {
              console.log('Report saved successfully from agent execution:', savedReport);
              
              // Verify it's in reports list
              const allReports = reportStore.getState().reports;
              console.log(`Current reports count: ${allReports.length}`);
              console.log(`Saved report found in store: ${!!allReports.find(r => r.id === reportId)}`);
              
              resolve(results);
            })
            .catch(error => {
              console.error('Error saving report from agent execution:', error);
              // Try direct localStorage save as fallback
              try {
                const currentReports = JSON.parse(localStorage.getItem('reports') || '[]');
                currentReports.push(report);
                localStorage.setItem('reports', JSON.stringify(currentReports));
                console.log('Saved report directly to localStorage as fallback');
              } catch (localStorageError) {
                console.error('Failed to save report to localStorage:', localStorageError);
              }
              resolve(results);
            });
        }).catch(error => {
          console.error('Error importing report store:', error);
          // Try direct localStorage save as fallback
          try {
            const currentReports = JSON.parse(localStorage.getItem('reports') || '[]');
            currentReports.push(report);
            localStorage.setItem('reports', JSON.stringify(currentReports));
            console.log('Saved report directly to localStorage after report store import error');
          } catch (localStorageError) {
            console.error('Failed to save report to localStorage:', localStorageError);
          }
          resolve(results);
        });
      } else {
        // Fail if no results were properly set
        console.error('No results were set during agent execution');
        resolve({
          success: false,
          agentId: agent.id,
          dataSourceId: dataSource.id,
          error: "Execution path did not properly set results",
          executedAt: new Date().toISOString(),
          executionMethod: 'error'
        });
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

// Removed generateMockResults function