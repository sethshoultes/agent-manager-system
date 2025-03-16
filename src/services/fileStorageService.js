/**
 * File Storage Service
 * 
 * Handles saving and loading data to/from JSON files in the local environment
 * Also manages temporary file storage and AI-based file processing
 */

/**
 * Save data to local storage with a specific key
 * @param {string} key - The storage key (e.g., 'agents', 'dataSources', 'reports')
 * @param {Array|Object} data - The data to save
 */
export const saveToLocalStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to local storage:`, error);
    return false;
  }
};

/**
 * Load data from local storage by key
 * @param {string} key - The storage key to retrieve
 * @param {*} defaultValue - Default value if the key doesn't exist
 * @returns {Array|Object} The retrieved data or default value
 */
export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading ${key} from local storage:`, error);
    return defaultValue;
  }
};

/**
 * Export data as a JSON file for download
 * @param {string} filename - Name of the file to download
 * @param {Array|Object} data - Data to export
 */
export const exportToJsonFile = (filename, data) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error(`Error exporting data to ${filename}:`, error);
    return false;
  }
};

/**
 * Import data from a JSON file
 * @param {File} file - The file to import
 * @returns {Promise<Object>} The parsed data
 */
export const importFromJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Check file type (should be JSON)
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      reject(new Error('File must be a valid JSON file'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        console.log('Reading file content...');
        const fileContent = event.target.result;
        
        // Debug the content
        console.log('File content preview:', fileContent.substring(0, 100) + '...');
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(fileContent);
          console.log('Successfully parsed JSON. Type:', typeof data);
          if (Array.isArray(data)) {
            console.log('Array data with length:', data.length);
          } else if (typeof data === 'object') {
            console.log('Object data with keys:', Object.keys(data));
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          reject(new Error('Invalid JSON format: ' + parseError.message));
          return;
        }
        
        // Check if this is a report file instead of a data source file
        if (data && typeof data === 'object' && !Array.isArray(data) && 
            (data.summary || data.insights || data.visualizations)) {
          console.log('Detected a report file instead of a data source file');
          
          // Create a mock dataset based on the report summary if no dataset is available
          let extractedData = [];
          let columns = [];
          
          // Try to extract the original dataset from report statistics
          if (data.statistics && data.statistics.dataset) {
            console.log('Found original dataset in report statistics');
            extractedData = data.statistics.dataset;
          }
          
          // Try to extract columns from statistics
          if (data.statistics && data.statistics.columns) {
            columns = data.statistics.columns;
          }
          
          // If no data is available, create a synthetic dataset based on the report
          if (extractedData.length === 0) {
            console.log('No dataset found in report, creating synthetic data');
            
            // Create at least one row with placeholder data
            const mockData = {
              report_id: data.id || 'unknown',
              report_name: data.name || 'Unnamed report',
              generated_at: data.generatedAt || new Date().toISOString(),
              data_source_id: data.dataSourceId || 'unknown',
              has_insights: data.insights && data.insights.length > 0 ? 'Yes' : 'No',
              has_visualizations: data.visualizations && data.visualizations.length > 0 ? 'Yes' : 'No',
              summary_preview: data.summary ? data.summary.substring(0, 100) + '...' : 'No summary'
            };
            
            extractedData = [mockData];
            columns = Object.keys(mockData);
          }
          
          console.log('Final extracted data:', extractedData);
          console.log('Final columns:', columns);
          
          // Get sample size for the data preview
          const sampleSize = extractedData.length > 0 ? Math.min(5, extractedData.length) : 0;
          
          // Add date string to the name for uniqueness
          const dateStr = new Date().toLocaleString();
          
          // Handle importing of reports - convert to array format for consistency
          resolve([{
            id: `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: data.name || `Imported Report: ${dateStr}`,
            description: data.description || 'Imported from report file',
            type: 'report',
            // If there's dataSourceId in the report, we can try to reference it
            dataSourceId: data.dataSourceId,
            // Add the report data for reference
            reportData: data,
            // Include the extracted data - now guaranteed to have at least synthetic data
            data: extractedData,
            // Add CSV-like structure for compatibility with DataPreview component
            rows: extractedData,
            columns: columns,
            // Add the summary as data string for potential fallback
            dataString: JSON.stringify(extractedData),
            // Add timestamp 
            uploadedAt: new Date().toISOString(),
            // Add metadata for UI display
            metadata: {
              rowCount: extractedData.length,
              columnCount: columns.length,
              importedFrom: 'report',
              reportId: data.id,
              reportDate: data.generatedAt,
              sampleSize: sampleSize,
              synthetic: extractedData.length === 1 && !!extractedData[0].report_id
            }
          }]);
          return;
        }
        
        // Normal data source file processing
        if (Array.isArray(data)) {
          // Make sure each item has at least a name property
          const validData = data.filter(item => item && typeof item === 'object' && item.name);
          if (validData.length === 0) {
            console.warn('No valid data items found in the file');
            reject(new Error('File contains no valid data items'));
            return;
          }
          
          console.log(`Found ${validData.length} valid data items`);
          
          // Convert any data items that might be strings back to objects
          for (let i = 0; i < validData.length; i++) {
            if (validData[i].data && typeof validData[i].data === 'string') {
              try {
                validData[i].data = JSON.parse(validData[i].data);
                console.log(`Parsed string data for item ${i} into object`);
              } catch (e) {
                // If it can't be parsed as JSON, keep it as a string
                console.warn(`Could not parse data for item ${validData[i].name}`, e);
              }
            }
          }
          
          resolve(validData);
        } else if (data && typeof data === 'object') {
          // Individual item case (wrap in an array)
          if (data.name) {
            console.log('Single object with name property detected');
            resolve([data]);
          } else {
            console.warn('Object missing name property, trying to create one');
            
            // Try to create a name from the file name or object properties
            let generatedName = 'Imported Data';
            
            // Get filename without extension
            if (file && file.name) {
              generatedName = file.name.replace(/\.[^/.]+$/, '');
            }
            
            // If object has keys that might indicate what it is, use that
            if (data.ext_name || data.title || data.id || data.label) {
              const possibleName = data.ext_name?.message || data.title || data.id || data.label;
              if (possibleName) {
                generatedName += `: ${possibleName}`;
              }
            }
            
            // Create a new object with a name property
            const dataWithName = {
              ...data,
              name: generatedName,
              description: 'Automatically named during import',
              auto_named: true
            };
            
            console.log('Created name for data:', generatedName);
            resolve([dataWithName]);
          }
        } else {
          console.warn('Invalid data format, expected array or object');
          reject(new Error('Invalid data format: expected an array or object'));
        }
      } catch (error) {
        console.error('Error processing JSON file:', error);
        reject(new Error('Failed to process file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Creates a temporary URL for a file (in-memory only)
 * @param {File} file - The file to create a URL for
 * @returns {string} - The temporary URL
 */
export const createTempFileUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revokes a temporary file URL to free up memory
 * @param {string} url - The temporary URL to revoke
 */
export const revokeTempFileUrl = (url) => {
  URL.revokeObjectURL(url);
};

/**
 * Process a report file using AI to convert it to a structured format
 * @param {Object} reportData - The report data object
 * @param {string} outputFormat - Desired output format: 'csv', 'markdown', or 'mermaid'
 * @param {Object} options - Additional options for AI processing
 * @returns {Promise<Object>} - The processed result
 */
export const processReportWithAI = async (reportData, outputFormat = 'autodetect', options = {}) => {
  // Import OpenAI service dynamically to avoid circular dependencies
  const openaiService = await import('./openaiService');
  
  if (!openaiService.default) {
    throw new Error('Failed to load OpenAI service');
  }
  
  console.log('Processing report with AI:', {
    reportName: reportData.name,
    outputFormat,
    options
  });
  
  // Build additional instructions based on options
  let additionalInstructions = '';
  
  // Handle column selection
  if (options.columns && options.columns.length > 0) {
    additionalInstructions += `\n\nUSE ONLY THESE COLUMNS: ${options.columns.join(', ')}\n`;
  }
  
  // Handle chart type selection
  if (options.chartType && options.chartType !== 'auto') {
    if (outputFormat === 'mermaid') {
      additionalInstructions += `\nCREATE A ${options.chartType.toUpperCase()} DIAGRAM.\n`;
    } else if (outputFormat === 'csv') {
      additionalInstructions += `\nORGANIZE DATA FOR A ${options.chartType.toUpperCase()} CHART.\n`;
    }
  }
  
  // Create a proper system prompt for the task
  const systemPrompt = `You are an AI assistant that processes report data and converts it to structured formats.
You will be provided with a report object containing data analysis. Your task is to process this report and 
convert it to the most appropriate structured format: CSV, markdown, or mermaid diagram.

${outputFormat === 'autodetect' ? 
  'Choose the most appropriate output format based on the report content:' :
  `Convert the report to ${outputFormat} format as requested by the user:`}

1. For tabular data, use CSV format
2. For narrative content with headings, use markdown
3. For relationships, flows, or hierarchies, use mermaid diagrams
${additionalInstructions}

Respond with a JSON object with the following structure:
{
  "format": "csv|markdown|mermaid", // The format you've chosen
  "title": "Title for the content",
  "content": "The converted content as a string",
  "explanation": "Brief explanation of why you chose this format"
}`;

  try {
    // Prepare the report data in a user-friendly format
    const userPrompt = `Here is the report data to process:
\`\`\`json
${JSON.stringify(reportData, null, 2)}
\`\`\`

${outputFormat === 'autodetect' ? 
  'Please convert this to the most appropriate format (CSV, markdown, or mermaid).' : 
  `Please convert this to ${outputFormat} format.`}
`;

    // Setup the API request
    const params = {
      model: options.model || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 4000
    };

    // Use the OpenAI service to process the data
    const response = await openaiService.default.generateAnalysis(
      null, 
      null, 
      'custom',
      {
        ...options,
        customMessages: params.messages
      }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to process report with AI');
    }
    
    return response.result;
  } catch (error) {
    console.error('Error processing report with AI:', error);
    throw error;
  }
};

export default {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportToJsonFile,
  importFromJsonFile,
  createTempFileUrl,
  revokeTempFileUrl,
  processReportWithAI
};