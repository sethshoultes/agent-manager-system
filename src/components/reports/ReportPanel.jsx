import React from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import ChartComponent from './ChartComponent';
import { exportReportToJson } from '../../services/reportService';

const ReportPanel = ({ report, onClose }) => {
  if (!report) {
    return (
      <div className="empty-state">
        <p>No report selected</p>
      </div>
    );
  }

  const handleExport = () => {
    exportReportToJson(report);
  };

  return (
    <Card
      title={report.name}
      className="report-panel"
      footer={
        <div className="report-actions">
          <Button
            variant="secondary"
            onClick={handleExport}
          >
            Export as JSON
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
      <div className="report-content">
        <div className="report-metadata">
          <p><strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}</p>
          <p><strong>Description:</strong> {report.description}</p>
        </div>

        {report.summary && (
          <div className="report-summary">
            <h3>Summary</h3>
            <pre>{report.summary}</pre>
          </div>
        )}

        {report.insights && report.insights.length > 0 && (
          <div className="report-insights">
            <h3>Key Insights</h3>
            <ul>
              {report.insights.map((insight, index) => (
                <li key={index}>
                  {typeof insight === 'string' 
                    ? insight 
                    : insight.description || insight.title || JSON.stringify(insight)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.visualizations && report.visualizations.length > 0 && (
          <div className="report-visualizations">
            <h3>Visualizations</h3>
            {report.visualizations.map((visualization, index) => (
              <div key={index} className="visualization-container">
                <ChartComponent
                  type={visualization.type}
                  data={visualization.data}
                  config={visualization.config}
                />
              </div>
            ))}
          </div>
        )}

        {report.statistics && Object.keys(report.statistics).length > 0 && (
          <div className="report-statistics">
            <h3>Statistical Analysis</h3>
            <table className="statistics-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.statistics).map(([field, stats]) => {
                  // Skip non-object stats entries or invalid stats
                  if (!stats || typeof stats !== 'object') return null;
                  
                  // Handle case where stats values might be missing
                  const mean = typeof stats.mean === 'number' ? stats.mean.toFixed(2) : 'N/A';
                  const median = typeof stats.median === 'number' ? stats.median.toFixed(2) : 'N/A';
                  const min = typeof stats.min === 'number' ? stats.min.toFixed(2) : 'N/A';
                  const max = typeof stats.max === 'number' ? stats.max.toFixed(2) : 'N/A';
                  const count = typeof stats.count === 'number' ? stats.count : 'N/A';
                  
                  return (
                    <tr key={field}>
                      <td>{field}</td>
                      <td>{mean}</td>
                      <td>{median}</td>
                      <td>{min}</td>
                      <td>{max}</td>
                      <td>{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReportPanel;