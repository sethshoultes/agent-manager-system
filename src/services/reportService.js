import { v4 as uuidv4 } from 'uuid';

// Get file type extension from name
const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// Extract categorical and numerical columns for visualizations
const extractColumnsFromData = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { categoricalColumns: [], numericalColumns: [] };
  }

  const firstRow = data[0];
  const columnsAnalysis = Object.keys(firstRow).map(column => {
    // Sample some values from the data
    const sampleSize = Math.min(5, data.length);
    const samples = data.slice(0, sampleSize);
    
    // Check if column contains numbers
    const numericValues = samples.filter(row => 
      !isNaN(parseFloat(row[column])) && 
      row[column] !== null && 
      row[column] !== ''
    );
    
    // Check if it's a date column
    const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}|^\d{2}-\d{2}-\d{4}/;
    const dateValues = samples.filter(row => 
      typeof row[column] === 'string' && 
      datePattern.test(row[column])
    );
    
    const isNumeric = numericValues.length >= sampleSize / 2;
    const isDate = dateValues.length >= sampleSize / 2;
    
    return {
      name: column,
      isNumeric,
      isDate,
      type: isDate ? 'date' : (isNumeric ? 'numeric' : 'categorical')
    };
  });
  
  const categoricalColumns = columnsAnalysis
    .filter(col => col.type === 'categorical' || col.type === 'date')
    .map(col => col.name);
    
  const numericalColumns = columnsAnalysis
    .filter(col => col.type === 'numeric')
    .map(col => col.name);
    
  return { categoricalColumns, numericalColumns };
};

// Generate appropriate visualizations based on data
const generateVisualizations = (data, dataSource) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const visualizations = [];
  const { categoricalColumns, numericalColumns } = extractColumnsFromData(data);
  
  // If we have both categorical and numerical columns, create a bar chart
  if (categoricalColumns.length > 0 && numericalColumns.length > 0) {
    const categoryCol = categoricalColumns[0];
    const valueCol = numericalColumns[0];
    
    // Count categories and aggregate values
    const categoryData = {};
    data.forEach(row => {
      const category = String(row[categoryCol] || 'Unknown');
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += parseFloat(row[valueCol]) || 0;
    });
    
    // Convert to visualization data format
    const chartData = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .slice(0, 8); // Limit to top 8 categories
      
    visualizations.push({
      type: 'bar',
      data: chartData,
      config: {
        title: `${valueCol} by ${categoryCol}`,
        xAxisKey: 'name',
        valueKey: 'value'
      }
    });
  }
  
  // If we have dates and a numerical column, create a line chart
  const dateColumns = categoricalColumns.filter(col => 
    data.some(row => row[col] && /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/.test(row[col]))
  );
  
  if (dateColumns.length > 0 && numericalColumns.length > 0) {
    const dateCol = dateColumns[0];
    const valueCol = numericalColumns[0];
    
    // Aggregate by date
    const dateData = {};
    data.forEach(row => {
      if (!row[dateCol]) return;
      
      // Simplify date to just month/year for better aggregation
      let dateKey;
      try {
        const date = new Date(row[dateCol]);
        dateKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      } catch (e) {
        dateKey = String(row[dateCol]);
      }
      
      if (!dateData[dateKey]) {
        dateData[dateKey] = 0;
      }
      dateData[dateKey] += parseFloat(row[valueCol]) || 0;
    });
    
    // Convert to visualization data format
    const chartData = Object.entries(dateData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort by date
      .slice(0, 12); // Limit to reasonable number of points
      
    visualizations.push({
      type: 'line',
      data: chartData,
      config: {
        title: `${valueCol} trend over time`,
        xAxisKey: 'name',
        valueKey: 'value' 
      }
    });
  }
  
  // If we have only one categorical column, create a pie chart
  if (categoricalColumns.length > 0) {
    const categoryCol = categoricalColumns[0];
    
    // Count occurrences of each category
    const categoryData = {};
    data.forEach(row => {
      const category = String(row[categoryCol] || 'Unknown');
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category]++;
    });
    
    // Convert to visualization data format
    const chartData = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Sort by count descending
      .slice(0, 6); // Limit to top 6 categories
      
    visualizations.push({
      type: 'pie',
      data: chartData,
      config: {
        title: `Distribution by ${categoryCol}`,
        nameKey: 'name',
        valueKey: 'value'
      }
    });
  }
  
  return visualizations;
};

/**
 * Generates a report from agent execution results
 */
export const generateReport = (agentResults, agent, dataSource) => {
  if (!agentResults || !agentResults.success) {
    throw new Error('Invalid agent results');
  }

  // Generate visualizations if needed
  let visualizations = agentResults.visualizations || [];
  
  // If no visualizations and the agent is a visualizer or has visualization capabilities
  if (visualizations.length === 0 &&
      (agent.type === 'visualizer' || 
       (agent.capabilities && 
        (Array.isArray(agent.capabilities) ? 
         agent.capabilities.includes('chart-generation') ||
         agent.capabilities.includes('data-visualization') : 
         typeof agent.capabilities === 'string' &&
         (agent.capabilities.includes('chart-generation') ||
          agent.capabilities.includes('data-visualization')))))) {
    
    // Try to parse data if it's a string
    let data;
    try {
      data = typeof dataSource.data === 'string' ? 
        JSON.parse(dataSource.data) : 
        dataSource.data;
    } catch (e) {
      console.error('Error parsing data for visualization:', e);
      data = [];
    }
      
    // Generate visualizations based on data
    const generatedVisualizations = generateVisualizations(data, dataSource);
    if (generatedVisualizations.length > 0) {
      visualizations = generatedVisualizations;
    } else {
      // Fallback to sample visualizations if we couldn't create any
      visualizations = [
        {
          type: 'bar',
          data: [
            { name: 'Category A', value: 430 },
            { name: 'Category B', value: 370 },
            { name: 'Category C', value: 280 },
            { name: 'Category D', value: 120 }
          ],
          config: {
            title: 'Sample Distribution',
            xAxisKey: 'name',
            valueKey: 'value'
          }
        }
      ];
    }
  }

  return {
    id: uuidv4(),
    name: `Report: ${dataSource.name} - ${new Date().toLocaleDateString()}`,
    description: `Generated by ${agent.name} agent`,
    agentId: agent.id,
    dataSourceId: dataSource.id,
    summary: agentResults.summary || 'No summary available',
    insights: agentResults.insights || [],
    visualizations: visualizations,
    statistics: agentResults.statistics || {},
    generatedAt: new Date().toISOString() // Store as ISO string for consistent serialization
  };
};

/**
 * Export report to JSON format
 */
export const exportReportToJson = (report) => {
  const jsonString = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};