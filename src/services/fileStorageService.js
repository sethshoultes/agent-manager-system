/**
 * File Storage Service
 * 
 * Handles saving and loading data to/from JSON files in the local environment
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
        const data = JSON.parse(event.target.result);
        
        // Extra validation to ensure the data is in the expected format
        if (Array.isArray(data)) {
          // Make sure each item has at least a name property
          const validData = data.filter(item => item && typeof item === 'object' && item.name);
          if (validData.length === 0) {
            reject(new Error('File contains no valid data items'));
            return;
          }
          
          // Convert any data items that might be strings back to objects
          for (let i = 0; i < validData.length; i++) {
            if (validData[i].data && typeof validData[i].data === 'string') {
              try {
                validData[i].data = JSON.parse(validData[i].data);
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
            resolve([data]);
          } else {
            reject(new Error('Invalid data format: missing required "name" property'));
          }
        } else {
          reject(new Error('Invalid data format: expected an array or object'));
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        reject(new Error('Invalid JSON file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};