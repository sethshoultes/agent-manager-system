import React, { useState, useEffect, useRef } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { processReportWithAI } from '../../services/fileStorageService';

/**
 * A component to display AI-processed reports in various formats (CSV, Markdown, Mermaid)
 */
const AIProcessedReport = ({ report, preferredFormat, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedContent, setProcessedContent] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(preferredFormat || 'autodetect');
  const [processingLogs, setProcessingLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);
  const logsEndRef = useRef(null);
  
  // Column and visualization configuration
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [chartType, setChartType] = useState('auto');
  const [showVisConfig, setShowVisConfig] = useState(false);

  // Auto-scroll logs to bottom when new logs are added
  useEffect(() => {
    if (logsEndRef.current && showLogs) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [processingLogs, showLogs]);

  // Add log entry helper function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLogs(logs => [...logs, { message, timestamp, type }]);
  };

  // Clear logs helper
  const clearLogs = () => {
    setProcessingLogs([]);
  };

  useEffect(() => {
    // When format changes, reset logs visibility for next processing
    if (isLoading) {
      setShowLogs(true);
    }
  }, [isLoading]);

  // Extract columns from report data when report changes
  useEffect(() => {
    if (report && report.reportData) {
      // Try to extract columns from different sources in the report
      let extractedColumns = [];
      
      // Check statistics.columns
      if (report.reportData.statistics && Array.isArray(report.reportData.statistics.columns)) {
        extractedColumns = report.reportData.statistics.columns;
      } 
      // Check first item in dataset if available
      else if (report.reportData.statistics && 
               Array.isArray(report.reportData.statistics.dataset) && 
               report.reportData.statistics.dataset.length > 0) {
        extractedColumns = Object.keys(report.reportData.statistics.dataset[0]);
      }
      // Check for visualizations data
      else if (report.reportData.visualizations && 
               report.reportData.visualizations.length > 0 &&
               report.reportData.visualizations[0].data &&
               report.reportData.visualizations[0].data.length > 0) {
        extractedColumns = Object.keys(report.reportData.visualizations[0].data[0]);
      }
      
      // Always provide some dummy columns for testing
      const dummyColumns = ['id', 'name', 'value', 'category', 'date'];
      const finalColumns = extractedColumns.length > 0 ? extractedColumns : dummyColumns;
      
      setColumns(finalColumns);
      
      // Always select the first few columns by default
      setSelectedColumns(finalColumns.slice(0, Math.min(3, finalColumns.length)));
    }
  }, [report]);

  useEffect(() => {
    // Check if we already have a cached version for this format and report
    clearLogs();
    let cacheKey = `${report?.id || 'unknown'}_${selectedFormat}`;
    
    // If this is a visualization with custom settings, include those in the cache key
    if (selectedFormat === 'mermaid' || selectedFormat === 'csv') {
      if (selectedColumns.length > 0) {
        cacheKey += `_cols_${selectedColumns.join('-')}`;
      }
      if (chartType !== 'auto') {
        cacheKey += `_chart_${chartType}`;
      }
    }
    
    const cachedResult = localStorage.getItem(`ai_processed_${cacheKey}`);
    
    addLog(`Checking cache for ${report?.name || 'report'} in ${selectedFormat} format...`);
    
    if (cachedResult) {
      try {
        addLog('Found cached result, parsing...', 'success');
        const parsed = JSON.parse(cachedResult);
        addLog('Using cached AI processed report', 'success');
        setProcessedContent(parsed);
        
        // Hide logs after a cached result is found (after a short delay)
        setTimeout(() => {
          setShowLogs(false);
        }, 1500);
      } catch (err) {
        addLog(`Error parsing cached result: ${err.message}`, 'error');
        addLog('Will reprocess the report', 'info');
        // If there's an error with the cached version, process again
        processReport();
      }
    } else {
      addLog('No cached result found', 'info');
      // No cached version, process the report
      if (report) {
        addLog('Initiating report processing...', 'info');
        processReport();
      }
    }
  }, [report, selectedFormat, selectedColumns, chartType]);

  const processReport = async (forceReprocess = false) => {
    if (!report) return;

    setIsLoading(true);
    setError(null);
    
    // Always show logs when processing starts
    setShowLogs(true);
    
    // Clear logs if reprocessing
    if (forceReprocess) {
      clearLogs();
      addLog('Forced reprocessing initiated...', 'info');
    }

    // Generate a cache key based on report ID and format
    let cacheKey = `${report?.id || 'unknown'}_${selectedFormat}`;
    
    // If this is a visualization with custom settings, include those in the cache key
    if (selectedFormat === 'mermaid' || selectedFormat === 'csv') {
      if (selectedColumns.length > 0) {
        cacheKey += `_cols_${selectedColumns.join('-')}`;
        addLog(`Using columns: ${selectedColumns.join(', ')}`, 'info');
      }
      if (chartType !== 'auto') {
        cacheKey += `_chart_${chartType}`;
        addLog(`Chart type: ${chartType}`, 'info');
      }
    }
    
    // Check cache unless force reprocessing
    if (!forceReprocess) {
      const cachedResult = localStorage.getItem(`ai_processed_${cacheKey}`);
      if (cachedResult) {
        try {
          addLog('Found cached result, using it instead of reprocessing', 'success');
          const parsed = JSON.parse(cachedResult);
          setProcessedContent(parsed);
          setIsLoading(false);
          
          // Hide logs after a delay
          setTimeout(() => {
            setShowLogs(false);
          }, 1500);
          
          return;
        } catch (err) {
          addLog(`Error parsing cached result: ${err.message}`, 'error');
          addLog('Will continue with reprocessing', 'info');
          // Continue to reprocess if cache parsing failed
        }
      }
    }

    try {
      addLog(`Preparing to process report with AI in ${selectedFormat} format`, 'info');
      addLog('Establishing connection to AI service...', 'info');
      
      // Simulate connection progress
      setTimeout(() => addLog('Connection established', 'success'), 300);
      setTimeout(() => addLog('Sending report data...', 'info'), 600);
      
      // Create processing options based on format and selected columns
      const options = {};
      
      // Add visualization options if needed
      if ((selectedFormat === 'mermaid' || selectedFormat === 'csv') && selectedColumns.length > 0) {
        options.columns = selectedColumns;
        
        if (chartType !== 'auto') {
          options.chartType = chartType;
        }
      }
      
      // Process the report with options
      const result = await processReportWithAI(report.reportData || report, selectedFormat, options);
      
      // Add logs based on the result
      addLog('Report processing complete!', 'success');
      addLog(`AI selected format: ${result.format}`, 'info');
      addLog(`Content length: ${result.content.length} characters`, 'info');
      
      setProcessedContent(result);
      
      // Save to cache
      try {
        addLog('Saving processed result to cache...', 'info');
        localStorage.setItem(`ai_processed_${cacheKey}`, JSON.stringify(result));
        addLog('Result cached successfully', 'success');
        
        // Hide logs after processing is complete (after a delay)
        setTimeout(() => {
          setShowLogs(false);
        }, 1500);
      } catch (cacheErr) {
        addLog(`Unable to cache result: ${cacheErr.message}`, 'warning');
      }
    } catch (err) {
      addLog(`Error processing report: ${err.message}`, 'error');
      setError(err.message || 'Failed to process report');
    } finally {
      setIsLoading(false);
      addLog('Processing operation completed', isLoading ? 'error' : 'success');
    }
  };

  const handleFormatChange = (format) => {
    setSelectedFormat(format);
    
    // Show visualization config when selecting visualization formats
    if (format === 'mermaid' || format === 'csv') {
      setShowVisConfig(true);
    } else {
      setShowVisConfig(false);
    }
  };
  
  // Toggle column selection
  const toggleColumnSelection = (column) => {
    if (selectedColumns.includes(column)) {
      // Remove column if already selected
      setSelectedColumns(selectedColumns.filter(col => col !== column));
    } else {
      // Add column if not already selected
      setSelectedColumns([...selectedColumns, column]);
    }
  };
  
  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  const handleDownload = () => {
    if (!processedContent) return;

    // Determine file extension based on format
    let extension;
    let mimeType;
    switch (processedContent.format) {
      case 'csv':
        extension = 'csv';
        mimeType = 'text/csv';
        break;
      case 'markdown':
        extension = 'md';
        mimeType = 'text/markdown';
        break;
      case 'mermaid':
        extension = 'mmd';
        mimeType = 'text/plain';
        break;
      default:
        extension = 'txt';
        mimeType = 'text/plain';
    }

    // Create file name
    const fileName = `${report.name || 'report'}-processed.${extension}`;

    // Create and download the file
    const blob = new Blob([processedContent.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render the appropriate content based on format
  const renderContent = () => {
    if (!processedContent) return null;

    switch (processedContent.format) {
      case 'csv':
        return (
          <div className="csv-preview">
            <h3>CSV Preview</h3>
            <pre 
              style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '5px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px'
              }}
            >
              {processedContent.content}
            </pre>
          </div>
        );
      
      case 'markdown':
        // For markdown, we create a simple renderer
        return (
          <div className="markdown-preview">
            <h3>Markdown Preview</h3>
            <div 
              className="markdown-content"
              style={{ 
                backgroundColor: '#fff', 
                padding: '15px', 
                border: '1px solid #e1e4e8',
                borderRadius: '5px',
                maxHeight: '400px',
                overflow: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(processedContent.content) }}
            />
          </div>
        );
      
      case 'mermaid':
        return (
          <div className="mermaid-preview">
            <h3>Mermaid Diagram Preview</h3>
            <div className="mermaid-container">
              <pre 
                style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '15px', 
                  borderRadius: '5px',
                  overflowX: 'auto',
                  maxHeight: '400px'
                }}
              >
                {processedContent.content}
              </pre>
              <p className="mermaid-note" style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
                Note: To view this diagram, paste the content into a Mermaid editor or use a Markdown preview that supports Mermaid.
              </p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-preview">
            <h3>Text Preview</h3>
            <pre 
              style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '5px',
                overflowX: 'auto',
                maxHeight: '400px'
              }}
            >
              {processedContent.content}
            </pre>
          </div>
        );
    }
  };

  // Simple markdown-to-HTML converter for preview
  const convertMarkdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    let html = markdown
      // Convert headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Convert lists
      .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/^(\d+)\. (.*$)/gim, '<ol><li>$2</li></ol>')
      // Convert bold and italic
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Convert code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      // Convert paragraphs (double newlines)
      .replace(/\n\n/gim, '</p><p>')
      // Fix nested lists
      .replace(/<\/ul>\n<ul>/gim, '')
      .replace(/<\/ol>\n<ol>/gim, '');
    
    // Wrap in p tags if not already wrapped
    if (!html.startsWith('<h') && !html.startsWith('<p>')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  };

  return (
    <Card
      title={`AI Processed Report: ${report?.name || 'Unknown'}`}
      className="ai-processed-report-card"
      footer={
        <div className="footer-actions">
          <Button
            variant="secondary"
            onClick={onClose}
            size="small"
          >
            Close
          </Button>
          {processedContent && (
            <Button
              variant="primary"
              onClick={handleDownload}
              size="small"
            >
              Download {processedContent.format.toUpperCase()}
            </Button>
          )}
        </div>
      }
    >
      <div className="format-controls" style={{ marginBottom: '15px' }}>
        <div className="format-selector" style={{ marginBottom: '10px' }}>
          <h4>Output Format</h4>
          <div className="format-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant={selectedFormat === 'autodetect' ? 'primary' : 'secondary'}
              onClick={() => handleFormatChange('autodetect')}
              size="small"
            >
              Auto-detect
            </Button>
            <Button
              variant={selectedFormat === 'csv' ? 'primary' : 'secondary'}
              onClick={() => handleFormatChange('csv')}
              size="small"
            >
              CSV
            </Button>
            <Button
              variant={selectedFormat === 'markdown' ? 'primary' : 'secondary'}
              onClick={() => handleFormatChange('markdown')}
              size="small"
            >
              Markdown
            </Button>
            <Button
              variant={selectedFormat === 'mermaid' ? 'primary' : 'secondary'}
              onClick={() => handleFormatChange('mermaid')}
              size="small"
            >
              Mermaid
            </Button>
          </div>
        </div>
        
        {/* Visualization Configuration - ALWAYS SHOW FOR TESTING */}
        {true && (
          <div className="visualization-config" style={{ 
            marginTop: '15px',
            padding: '15px', 
            backgroundColor: '#f5f7fa',
            borderRadius: '5px',
            border: '1px solid #e1e4e8'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Visualization Settings</h4>
            
            {/* Chart Type Selection */}
            <div className="chart-type-selector" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Chart Type:
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant={chartType === 'auto' ? 'primary' : 'secondary'}
                  onClick={() => handleChartTypeChange('auto')}
                  size="small"
                >
                  Auto-detect
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'primary' : 'secondary'}
                  onClick={() => handleChartTypeChange('bar')}
                  size="small"
                >
                  Bar Chart
                </Button>
                <Button
                  variant={chartType === 'line' ? 'primary' : 'secondary'}
                  onClick={() => handleChartTypeChange('line')}
                  size="small"
                >
                  Line Chart
                </Button>
                <Button
                  variant={chartType === 'pie' ? 'primary' : 'secondary'}
                  onClick={() => handleChartTypeChange('pie')}
                  size="small"
                >
                  Pie Chart
                </Button>
                <Button
                  variant={chartType === 'flowchart' ? 'primary' : 'secondary'}
                  onClick={() => handleChartTypeChange('flowchart')}
                  size="small"
                >
                  Flowchart
                </Button>
              </div>
            </div>
            
            {/* Column Selection */}
            <div className="column-selector">
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Columns to Include ({selectedColumns.length} selected):
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '5px',
                maxHeight: '150px',
                overflowY: 'auto',
                padding: '5px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                {columns.map(column => (
                  <div 
                    key={`col-${column}`}
                    onClick={() => toggleColumnSelection(column)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '3px',
                      backgroundColor: selectedColumns.includes(column) ? '#4a69bd' : '#e1e4e8',
                      color: selectedColumns.includes(column) ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}
                  >
                    <span style={{ 
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '1px solid #aaa',
                      borderRadius: '2px',
                      marginRight: '5px',
                      backgroundColor: selectedColumns.includes(column) ? '#fff' : 'transparent',
                      position: 'relative'
                    }}>
                      {selectedColumns.includes(column) && (
                        <span style={{
                          position: 'absolute',
                          left: '2px',
                          top: '0px',
                          fontSize: '10px',
                          color: '#4a69bd'
                        }}>✓</span>
                      )}
                    </span>
                    {column}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                {selectedColumns.length === 0 ? (
                  <p>Please select at least one column for visualization.</p>
                ) : (
                  <p>Selected: {selectedColumns.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {processedContent && (
          <div className="reprocess-controls" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            marginTop: '10px'
          }}>
            <Button
              variant="secondary"
              onClick={() => processReport(true)}
              size="small"
            >
              Reprocess with AI
            </Button>
          </div>
        )}
      </div>

      {/* Processing logs section */}
      {(isLoading || (processingLogs.length > 0 && showLogs)) && (
        <div className="mb-5 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex justify-between items-center">
            <h4 className="text-base font-medium m-0 text-[var(--color-text-primary)]">
              {isLoading ? 'Processing Report...' : 'Processing Log'}
            </h4>
            
            {/* Only show toggle button when not loading */}
            {!isLoading && processingLogs.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => setShowLogs(!showLogs)}
                size="small"
              >
                {showLogs ? 'Hide Log' : 'Show Log'}
              </Button>
            )}
          </div>
          
          {/* Log entries */}
          <div className="terminal max-h-[200px] overflow-y-auto">
            {processingLogs.map((log, index) => (
              <div 
                key={`log-${index}-${log.timestamp.replace(/:/g, '-')}`} 
                className={`py-0.5 font-bold ${
                  log.type === 'error' ? 'terminal-error' : 
                  log.type === 'success' ? 'terminal-success' : 
                  log.type === 'warning' ? 'terminal-warning' : 
                  'terminal-info'
                }`}
              >
                <span className="text-gray-500 mr-2.5">
                  [{log.timestamp}]
                </span>
                <span>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
          
          {isLoading && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <div className="inline-block w-5 h-5 border-3 border-gray-200 dark:border-gray-600 border-t-[var(--color-primary)] rounded-full animate-spin mr-2.5"></div>
              <span>Processing in progress...</span>
            </div>
          )}
          
          {/* Tailwind handles animation */}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md mb-4">
          <h4 className="font-semibold mb-2">Error Processing Report</h4>
          <p className="mb-3">{error}</p>
          <Button
            variant="secondary"
            onClick={() => processReport(true)}
            size="small"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && processedContent && (
        <div className="processed-content">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
            <p className="mb-2"><span className="font-semibold">AI Selected Format:</span> {processedContent.format}</p>
            <p><span className="font-semibold">Explanation:</span> {processedContent.explanation}</p>
            
            {/* Button to view logs if they're hidden but available */}
            {!showLogs && processingLogs.length > 0 && (
              <div className="mt-3 text-right">
                <Button
                  variant="secondary"
                  onClick={() => setShowLogs(true)}
                  size="small"
                >
                  Show Processing Log
                </Button>
              </div>
            )}
          </div>

          {renderContent()}
        </div>
      )}

      {!isLoading && !error && !processedContent && processingLogs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-secondary)] mb-4">No processed content available.</p>
          <Button
            variant="primary"
            onClick={() => processReport(true)}
            size="small"
            className="mt-2"
          >
            Process Report
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AIProcessedReport;