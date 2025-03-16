import axios from 'axios';

/**
 * OpenAI API client for agent intelligence
 * Handles communication with OpenAI API for data analysis and report generation
 */

// Create axios instance for OpenAI API
const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Sets the API key for OpenAI requests
 * @param {string} apiKey - OpenAI API key
 */
export const setApiKey = (apiKey) => {
  if (!apiKey) {
    console.error('Invalid API key provided');
    return false;
  }
  
  openaiClient.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  return true;
};

/**
 * Transforms data for the OpenAI context window
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

Format your response as a JSON object with this exact structure:
{
  "summary": "Brief text analysis of the dataset",
  "insights": ["Insight 1", "Insight 2", "Insight 3"],
  "visualizations": [
    {
      "type": "bar",
      "title": "Chart Title",
      "data": [{"name": "Category1", "value": 10}, {"name": "Category2", "value": 20}],
      "config": {
        "xAxisKey": "name",
        "valueKey": "value",
        "series": [{"dataKey": "value", "name": "Value", "color": "#0088FE"}]
      }
    },
    {
      "type": "pie",
      "title": "Distribution Chart",
      "data": [{"name": "Category1", "value": 30}, {"name": "Category2", "value": 70}],
      "config": {
        "nameKey": "name",
        "valueKey": "value"
      }
    }
  ]
}`;
      
    case 'summarizer':
      return `${basePrompt}
Your task is to create a concise text summary of the dataset. You should:
1. Describe the overall structure and purpose of the dataset
2. Highlight the most important patterns and trends
3. Summarize key statistics in natural language
4. Provide actionable recommendations based on the data
5. Format your response as a report with sections

Format your response as a JSON object with this exact structure:
{
  "summary": "# Report Title\\n\\n## Overview\\n[Overview text]\\n\\n## Key Patterns\\n[Patterns text]\\n\\n## Recommendations\\n[Recommendations text]",
  "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "statistics": {
    "column1": {"mean": 50, "median": 48, "min": 10, "max": 100, "count": 500},
    "column2": {"mean": 25, "median": 22, "min": 5, "max": 60, "count": 450}
  },
  "visualizations": [
    {
      "type": "bar",
      "title": "Chart Title",
      "data": [{"name": "Category1", "value": 10}, {"name": "Category2", "value": 20}],
      "config": {
        "xAxisKey": "name",
        "valueKey": "value",
        "series": [{"dataKey": "value", "name": "Value", "color": "#0088FE"}]
      }
    }
  ]
}`;
      
    default:
      return `${basePrompt}
Analyze the provided dataset and return insights in a properly structured JSON format with the following sections:
- summary: A markdown-formatted text summary of your analysis
- insights: An array of key insights as strings
- statistics (optional): An object with statistics for numerical columns
- visualizations: An array of visualization objects, each with:
  - type: Chart type (bar, line, pie)
  - title: Chart title
  - data: Array of data objects with name/value pairs
  - config: Configuration object with xAxisKey, valueKey, and series information

Here's an example of the expected response format:
{
  "summary": "# Dataset Analysis\\n\\n## Overview\\n[Overview text]",
  "insights": ["Key insight 1", "Key insight 2"],
  "visualizations": [
    {
      "type": "bar",
      "title": "Key Metrics",
      "data": [{"name": "Category1", "value": 10}, {"name": "Category2", "value": 20}],
      "config": {
        "xAxisKey": "name",
        "valueKey": "value",
        "series": [{"dataKey": "value", "name": "Value", "color": "#0088FE"}]
      }
    }
  ]
}`;
  }
};

/**
 * Parses the response from OpenAI into a structured format
 * @param {string} responseContent - Raw response from OpenAI
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
    
    // Try to be more forgiving and extract any JSON-like structure from the text
    try {
      const jsonRegex = /(\{[\s\S]*\})/g;
      const possibleJson = responseContent.match(jsonRegex);
      
      if (possibleJson && possibleJson.length > 0) {
        // Try each possible JSON match
        for (const jsonCandidate of possibleJson) {
          try {
            const parsed = JSON.parse(jsonCandidate);
            console.log('Successfully extracted JSON object from response text');
            return parsed;
          } catch (e3) {
            // Continue to next candidate
          }
        }
      }
    } catch (e4) {
      console.error('Failed to extract JSON-like structure:', e4);
    }
    
    // Try to intelligently construct a JSON structure from the response
    try {
      const result = {
        summary: responseContent
      };
      
      // Extract insights from bullet points or numbered lists
      const insightsMatch = responseContent.match(/(?:Key Insights|Insights|Key Points):\s*\n((?:\d+\.\s+.*|\*\s+.*|\-\s+.*)\n)+/i);
      if (insightsMatch) {
        const insightsText = insightsMatch[0];
        const insights = insightsText.match(/(?:\d+\.\s+|\*\s+|\-\s+)(.*)/g)
          ?.map(line => line.replace(/(?:\d+\.\s+|\*\s+|\-\s+)/, '').trim())
          ?.filter(Boolean);
          
        if (insights && insights.length > 0) {
          result.insights = insights;
        }
      }
      
      return result;
    } catch (e5) {
      console.error('Failed to construct structured result from text:', e5);
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
 * Generates analysis for a dataset using OpenAI
 * @param {Array} data - The dataset rows
 * @param {Array} columns - Column names
 * @param {string} agentType - Type of agent (analyzer, visualizer, summarizer)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Analysis results
 */
export const generateAnalysis = async (data, columns, agentType, options = {}) => {
  if (!openaiClient.defaults.headers.common['Authorization']) {
    return {
      success: false,
      error: 'API key not configured. Please set your OpenAI API key.'
    };
  }
  
  try {
    // Transform data for context window
    const dataContext = transformDataForContext(data, columns);
    
    // Create appropriate system prompt based on agent type
    const systemPrompt = getSystemPromptForAgentType(agentType);
    
    // Set up API parameters
    const params = {
      model: options.model || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dataContext }
      ],
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 4000
    };
    
    // Make API request
    const response = await openaiClient.post('/chat/completions', params);
    
    // Parse and return the response
    const result = parseResponse(response.data.choices[0].message.content);
    
    return {
      success: true,
      result,
      usage: response.data.usage,
      model: response.data.model
    };
  } catch (error) {
    console.error('Error generating analysis:', error);
    
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