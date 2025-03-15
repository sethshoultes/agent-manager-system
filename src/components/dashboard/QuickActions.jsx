import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Button from '../shared/Button';
import './QuickActions.css';

const QuickActions = ({ onExecuteAgent, onUploadData }) => {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      <Card title="Quick Actions" className="quick-actions-card">
        <div className="actions-grid">
          <div className="action-item">
            <div className="action-icon">🤖</div>
            <div className="action-content">
              <h3>Execute Agent</h3>
              <p>Run an agent on your data</p>
              <Button onClick={onExecuteAgent}>
                Execute
              </Button>
            </div>
          </div>

          <div className="action-item">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h3>Upload Data</h3>
              <p>Add new data sources</p>
              <Button onClick={() => navigate('/data')}>
                Upload
              </Button>
            </div>
          </div>

          <div className="action-item">
            <div className="action-icon">🔍</div>
            <div className="action-content">
              <h3>View Reports</h3>
              <p>See your generated reports</p>
              <Button onClick={() => navigate('/reports')}>
                View
              </Button>
            </div>
          </div>

          <div className="action-item">
            <div className="action-icon">➕</div>
            <div className="action-content">
              <h3>Create Agent</h3>
              <p>Configure a new agent</p>
              <Button onClick={() => navigate('/agents')}>
                Create
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="actions-footer">
        <p>Need help getting started? <a href="#">Check the documentation</a></p>
      </div>
    </div>
  );
};

export default QuickActions;