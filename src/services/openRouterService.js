import axios from 'axios';

/**
 * OpenRouter API client for agent intelligence
 * Provides access to multiple AI models through a single API
 */

// Create axios instance for OpenRouter API
const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://agent-manager-system.local', // Required by OpenRouter
    'X-Title': 'Agent Manager System'                     // Recommended by OpenRouter
  }
});

/**
 * Sets the API key for OpenRouter requests
 * @param {string} apiKey - OpenRouter API key
 */
export const setApiKey = (apiKey) => {
  if (!apiKey) {
    console.error('Invalid API key provided');
    return false;
  }
  
  openRouterClient.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  return true;
};

/**
 * Transforms data for the AI context window
 * @param {Array} data - The dataset rows
 * @param {Array} columns - Column names
 * @returns {string} - Formatted data for context
 */
export const transformDataForContext = (data, columns) => {
  if (!data || !columns || data.length === 0) {
    return 'No data available for analysis.';
  }
  
  // Create a header with metadata
  const header = `Dataset with ${data.length} rows and ${columns.length} columns (${columns.join(', ')}).\n\n`;
  
  // Sample the data to fit context window (max 20 rows for preview)
  const sampleSize = Math.min(data.length, 20);
  const sampledData = data.slice(0, sampleSize);
  
  // Format data as a table
  const formattedRows = sampledData.map(row => 
    columns.map(col => String(row[col] || '')).join('\t')
  );
  
  const table = [
    columns.join('\t'),
    ...formattedRows
  ].join('\n');
  
  return `${header}${table}\n\nPlease analyze this data based on the instructions.`;
};

/**
 * Gets the appropriate system prompt based on agent type
 * @param {string} agentType - Type of agent (analyzer, visualizer, summarizer)
 * @returns {string} - System prompt for the agent
 */
export const getSystemPromptForAgentType = (agentType) => {
  const basePrompt = `You are an AI data analyst assistant that helps analyze and interpret data. 
You will be given a dataset and are expected to provide insights based on your capabilities.`;
  
  switch (agentType) {
    case 'analyzer':
      return `${basePrompt}
Your task is to perform statistical analysis on the dataset. You should:
1. Identify the data types of each column
2. Calculate key statistics for numerical columns (mean, median, min, max, standard deviation)
3. Identify correlations between numerical columns
4. Detect outliers and anomalies
5. Report the top insights you've discovered
Respond with a JSON object containing your analysis results.`;
      
    case 'visualizer':
      return `${basePrompt}
Your task is to recommend appropriate visualizations for the dataset. You should:
1. Identify which columns would be most insightful to visualize
2. Recommend specific chart types (bar, line, pie, scatter, etc.) for different aspects of the data
3. Explain why each visualization would be helpful
4. Provide configuration suggestions for each visualization (axes, colors, grouping)
Respond with a JSON object containing visualization recommendations.`;
      
    case 'summarizer':
      return `${basePrompt}
Your task is to create a concise text summary of the dataset. You should:
1. Describe the overall structure and purpose of the dataset
2. Highlight the most important patterns and trends
3. Summarize key statistics in natural language
4. Provide actionable recommendations based on the data
5. Format your response as a report with sections
Respond with a JSON object containing your summary text.`;
      
    default:
      return `${basePrompt}
Analyze the provided dataset and return insights in JSON format.`;
  }
};

/**
 * Parses the response from OpenRouter into a structured format
 * @param {string} responseContent - Raw response from OpenRouter
 * @returns {Object} - Structured response object
 */
export const parseResponse = (responseContent) => {
  try {
    // First try to parse as JSON directly
    return JSON.parse(responseContent);
  } catch (e) {
    // If not valid JSON, try to extract JSON from markdown code blocks
    const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        console.error('Failed to parse JSON from code block:', e2);
      }
    }
    
    // If all parsing fails, return a structured error with the original text
    return {
      success: false,
      error: 'Failed to parse response as JSON',
      rawContent: responseContent
    };
  }
};

/**
 * Generates analysis for a dataset using OpenRouter's AI models
 * @param {Array} data - The dataset rows
 * @param {Array} columns - Column names
 * @param {string} agentType - Type of agent (analyzer, visualizer, summarizer)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Analysis results
 */
export const generateAnalysis = async (data, columns, agentType, options = {}) => {
  if (!openRouterClient.defaults.headers.common['Authorization']) {
    return {
      success: false,
      error: 'API key not configured. Please set your OpenRouter API key.'
    };
  }
  
  try {
    // Transform data for context window
    const dataContext = transformDataForContext(data, columns);
    
    // Create appropriate system prompt based on agent type
    const systemPrompt = getSystemPromptForAgentType(agentType);
    
    // Set up API parameters - OpenRouter is compatible with OpenAI API format
    const params = {
      model: options.model || 'anthropic/claude-3-haiku', // Default model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dataContext }
      ],
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 4000
    };
    
    // Make API request
    const response = await openRouterClient.post('/chat/completions', params);
    
    // Parse and return the response
    const result = parseResponse(response.data.choices[0].message.content);
    
    return {
      success: true,
      result,
      usage: response.data.usage,
      model: response.data.model
    };
  } catch (error) {
    console.error('Error generating analysis with OpenRouter:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to generate analysis',
      details: error.response?.data
    };
  }
};

export default {
  setApiKey,
  generateAnalysis,
  transformDataForContext,
  getSystemPromptForAgentType
};