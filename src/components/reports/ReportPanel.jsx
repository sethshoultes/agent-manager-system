import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import ChartComponent from './ChartComponent';
import AIProcessedReport from './AIProcessedReportNew';
import { exportReportToJson } from '../../services/reportService';

const ReportPanel = ({ report, onClose }) => {
  const [showAiProcessing, setShowAiProcessing] = useState(false);
  
  if (!report) {
    return (
      <div className="empty-state">
        <p>No report selected</p>
      </div>
    );
  }

  // If AI processing is active, show the AI processing component
  if (showAiProcessing) {
    return (
      <div>
        <AIProcessedReport 
          report={report} 
          onClose={() => setShowAiProcessing(false)} 
          preferredFormat="autodetect"
        />
      </div>
    );
  }

  const handleExport = () => {
    exportReportToJson(report);
  };
  
  const handleProcessWithAI = () => {
    setShowAiProcessing(true);
  };

  return (
    <Card
      title={report.name}
      className="w-full max-w-4xl mx-auto"
      footer={
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={handleExport}
          >
            Export as JSON
          </Button>
          <Button
            variant="primary"
            onClick={handleProcessWithAI}
          >
            Process with AI
          </Button>
          {onClose && (
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      }
    >
      <div className="font-sans text-base leading-relaxed">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-5 border-l-4 border-[var(--color-primary)]">
          <p><strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}</p>
          <p><strong>Description:</strong> {report.description}</p>
        </div>

        {report.summary && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 mb-6 shadow">
            <h3 className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
              Summary
            </h3>
            <div 
              className="markdown-content"
              style={{
                width: "100%",
                overflow: "auto"
              }}
              dangerouslySetInnerHTML={{ 
                __html: report.summary
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/\n\n/gm, '</p><p>')
                  .replace(/^\* (.*$)/gm, '<li>$1</li>')
                  .replace(/^- (.*$)/gm, '<li>$1</li>')
                  .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
                  .replace(/<li>/g, '<ul><li>')
                  .replace(/<\/li>(?!\n<li>)/g, '</li></ul>')
                  .replace(/<\/ul><ul>/g, '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code>$1</code>')
                  .replace(/^\s*$/gm, '<br />')
                  .replace(/^(.+)$/gm, '<p>$1</p>')
                  .replace(/<p><h([1-6])>/g, '<h$1>')
                  .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
                  .replace(/<p><ul>/g, '<ul>')
                  .replace(/<\/ul><\/p>/g, '</ul>')
              }}
            />
          </div>
        )}

        {report.insights && report.insights.length > 0 && (
          <div className="report-insights" style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              borderBottom: '2px solid #eaecef',
              paddingBottom: '8px',
              marginBottom: '16px',
              color: '#24292e'
            }}>Key Insights</h3>
            <ul style={{
              paddingLeft: '20px',
              margin: '15px 0'
            }}>
              {report.insights.map((insight, index) => (
                <li key={index} style={{
                  padding: '8px 0',
                  borderBottom: index < report.insights.length - 1 ? '1px solid #eee' : 'none',
                  color: '#444'
                }}>
                  {typeof insight === 'string' 
                    ? insight 
                    : insight.description || insight.title || JSON.stringify(insight)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.visualizations && report.visualizations.length > 0 && (
          <div className="report-visualizations" style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              borderBottom: '2px solid #eaecef',
              paddingBottom: '8px',
              marginBottom: '16px',
              color: '#24292e'
            }}>Visualizations</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {report.visualizations.map((visualization, index) => (
                <div key={index} className="visualization-container" style={{
                  border: '1px solid #e1e4e8',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h4 style={{
                    marginTop: 0,
                    marginBottom: '12px',
                    color: '#444',
                    fontSize: '16px'
                  }}>{visualization.title || `Visualization ${index + 1}`}</h4>
                  <div style={{ height: '300px' }}>
                    <ChartComponent
                      type={visualization.type}
                      data={visualization.data}
                      config={visualization.config}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.statistics && Object.keys(report.statistics).length > 0 && (
          <div className="report-statistics" style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              borderBottom: '2px solid #eaecef',
              paddingBottom: '8px',
              marginBottom: '16px',
              color: '#24292e'
            }}>Statistical Analysis</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                marginTop: '10px'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      backgroundColor: '#f1f8ff',
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dfe2e5',
                      fontWeight: 'bold',
                      color: '#24292e'
                    }}>Field</th>
                    <th style={{
                      backgroundColor: '#f1f8ff',
                      padding: '10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #dfe2e5',
                      fontWeight: 'bold',
                      color: '#24292e'
                    }}>Mean</th>
                    <th style={{
                      backgroundColor: '#f1f8ff',
                      padding: '10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #dfe2e5',
                      fontWeight: 'bold',
                      color: '#24292e'
                    }}>Median</th>
                    <th style={{
                      backgroundColor: '#f1f8ff',
                      padding: '10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #dfe2e5',
                      fontWeight: 'bold',
                      color: '#24292e'
                    }}>Min</th>
                    <th style={{
                      backgroundColor: '#f1f8ff',
                      padding: '10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #dfe2e5',
                      fontWeight: 'bold',
                      color: '#24292e'
                    }}>Max</th>
                    <th style={{
                      backgroundColor: '#f1f8ff',
                      padding: '10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #dfe2e5',
                      fontWeight: 'bold',
                      color: '#24292e'
                    }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.statistics).map(([field, stats], rowIndex) => {
                    // Skip non-object stats entries or invalid stats
                    if (!stats || typeof stats !== 'object') return null;
                    
                    // Handle case where stats values might be missing
                    const mean = typeof stats.mean === 'number' ? stats.mean.toFixed(2) : 'N/A';
                    const median = typeof stats.median === 'number' ? stats.median.toFixed(2) : 'N/A';
                    const min = typeof stats.min === 'number' ? stats.min.toFixed(2) : 'N/A';
                    const max = typeof stats.max === 'number' ? stats.max.toFixed(2) : 'N/A';
                    const count = typeof stats.count === 'number' ? stats.count : 'N/A';
                    
                    return (
                      <tr key={field} style={{
                        backgroundColor: rowIndex % 2 === 0 ? '#f6f8fa' : '#fff',
                      }}>
                        <td style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #dfe2e5',
                          fontWeight: 'bold',
                        }}>{field}</td>
                        <td style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #dfe2e5',
                          textAlign: 'right',
                        }}>{mean}</td>
                        <td style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #dfe2e5',
                          textAlign: 'right',
                        }}>{median}</td>
                        <td style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #dfe2e5',
                          textAlign: 'right',
                        }}>{min}</td>
                        <td style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #dfe2e5',
                          textAlign: 'right',
                        }}>{max}</td>
                        <td style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #dfe2e5',
                          textAlign: 'right',
                        }}>{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReportPanel;