import React, { useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { useReportContext } from '../context/ReportContext';
import { useDataContext } from '../context/DataContext';
import ReportPanel from '../components/reports/ReportPanel';
import VisualizationSelector from '../components/reports/VisualizationSelector';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';

const ReportsPage = () => {
  const { reports, deleteReport, selectReport, selectedReport, addReport, exportReports, importReports } = useReportContext();
  const { dataSources } = useDataContext();
  const [showVisualizerModal, setShowVisualizerModal] = useState(false);
  const [dataSourceForViz, setDataSourceForViz] = useState(null);
  const fileInputRef = useRef(null);

  const handleViewReport = (report) => {
    selectReport(report);
  };

  const handleCreateVisualization = () => {
    if (dataSources.length > 0) {
      setDataSourceForViz(dataSources[0]);
      setShowVisualizerModal(true);
    }
  };

  const handleAddVisualization = (visualization) => {
    // Create a custom report with just the visualization
    const customReport = {
      name: `Custom Visualization: ${visualization.config.title}`,
      description: 'User-created visualization',
      agentId: null,
      dataSourceId: dataSourceForViz.id,
      summary: 'This visualization was manually created by the user.',
      insights: [],
      visualizations: [visualization],
      generatedAt: new Date()
    };

    addReport(customReport);
    setShowVisualizerModal(false);
    selectReport(customReport);
  };

  const handleExportReports = () => {
    exportReports();
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportReports = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const success = await importReports(file);
      if (success) {
        // Reset the file input so the same file can be selected again if needed
        event.target.value = null;
      }
    }
  };

  return (
    <Layout>
      <div className="reports-page">
        <div className="page-header">
          <h1>Reports & Visualizations</h1>
          <div className="header-actions">
            {dataSources.length > 0 && (
              <Button onClick={handleCreateVisualization} className="mr-2">
                Create Visualization
              </Button>
            )}
            <Button 
              onClick={handleExportReports} 
              variant="secondary"
              disabled={reports.length === 0}
              className="mr-2"
            >
              Export Reports
            </Button>
            <Button onClick={handleImportClick} variant="secondary">
              Import Reports
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportReports} 
            />
          </div>
        </div>

        <div className="reports-content">
          {selectedReport ? (
            <div className="report-detail">
              <ReportPanel 
                report={selectedReport} 
                onClose={() => selectReport(null)} 
              />
            </div>
          ) : (
            <div className="reports-list">
              <h2>Available Reports</h2>
              
              {reports.length === 0 ? (
                <div className="empty-state">
                  <p>No reports available. Execute an agent to generate reports or create a custom visualization.</p>
                  <div className="empty-actions">
                    {dataSources.length > 0 && (
                      <Button onClick={handleCreateVisualization} className="mr-2">
                        Create Your First Visualization
                      </Button>
                    )}
                    <Button onClick={handleImportClick} variant="secondary">
                      Import Reports
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="reports-grid">
                  {reports.map(report => (
                    <Card 
                      key={report.id}
                      title={report.name}
                      className="report-card"
                      footer={
                        <div className="card-actions">
                          <Button 
                            onClick={() => handleViewReport(report)}
                            variant="primary"
                          >
                            View
                          </Button>
                          <Button 
                            onClick={() => deleteReport(report.id)}
                            variant="danger"
                          >
                            Delete
                          </Button>
                        </div>
                      }
                    >
                      <div className="report-info">
                        <p>{report.description}</p>
                        <p><strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}</p>
                        {report.insights && report.insights.length > 0 && (
                          <p><strong>Insights:</strong> {report.insights.length}</p>
                        )}
                        {report.visualizations && report.visualizations.length > 0 && (
                          <p><strong>Visualizations:</strong> {report.visualizations.length}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visualization Creator Modal */}
        <Modal
          show={showVisualizerModal}
          onClose={() => setShowVisualizerModal(false)}
          title="Create Custom Visualization"
          size="large"
        >
          <div className="data-source-selector">
            <label>Select Data Source:</label>
            <select 
              value={dataSourceForViz?.id || ''}
              onChange={(e) => {
                const selectedDs = dataSources.find(ds => ds.id === e.target.value);
                setDataSourceForViz(selectedDs);
              }}
            >
              {dataSources.map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.metadata?.rowCount || 0} rows)
                </option>
              ))}
            </select>
          </div>

          {dataSourceForViz && (
            <VisualizationSelector 
              dataSource={dataSourceForViz}
              onCreateVisualization={handleAddVisualization}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default ReportsPage;