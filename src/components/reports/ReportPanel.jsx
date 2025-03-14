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
                <li key={index}>{insight}</li>
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
                {Object.entries(report.statistics).map(([field, stats]) => (
                  <tr key={field}>
                    <td>{field}</td>
                    <td>{stats.mean.toFixed(2)}</td>
                    <td>{stats.median.toFixed(2)}</td>
                    <td>{stats.min.toFixed(2)}</td>
                    <td>{stats.max.toFixed(2)}</td>
                    <td>{stats.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReportPanel;