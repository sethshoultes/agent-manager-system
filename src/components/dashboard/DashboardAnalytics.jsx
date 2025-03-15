import React, { useMemo } from 'react';
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, 
  Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';
import Card from '../shared/Card';
import './DashboardAnalytics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B'];

const DashboardAnalytics = ({ agents, dataSources, reports }) => {
  // Calculate agent stats by type
  const agentsByType = useMemo(() => {
    if (!Array.isArray(agents)) return [];
    
    const typeCount = agents.reduce((acc, agent) => {
      if (!agent || !agent.type) return acc;
      acc[agent.type] = (acc[agent.type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  }, [agents]);

  // Calculate agent stats by status
  const agentsByStatus = useMemo(() => {
    if (!Array.isArray(agents)) return [];
    
    const statusCount = agents.reduce((acc, agent) => {
      if (!agent || !agent.status) return acc;
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [agents]);

  // Calculate data source stats
  const dataSourceStats = useMemo(() => {
    if (!Array.isArray(dataSources)) return [];
    
    return dataSources
      .filter(ds => ds && ds.metadata && ds.metadata.rowCount)
      .map(ds => ({
        name: ds.name || 'Unnamed',
        rows: ds.metadata.rowCount || 0
      }))
      .sort((a, b) => b.rows - a.rows)
      .slice(0, 5); // Top 5 by size
  }, [dataSources]);

  // Calculate recent activity
  const recentActivity = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    
    return reports
      .filter(report => report && report.generatedAt)
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
      .slice(0, 5); // Most recent 5
  }, [reports]);

  return (
    <div className="dashboard-analytics">
      <div className="analytics-row">
        <Card title="Agent Types" className="analytics-card">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={agentsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {agentsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} agent(s)`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Agent Status" className="analytics-card">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={agentsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {agentsByStatus.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.name === 'running' ? '#FFBB28' : 
                      entry.name === 'completed' ? '#00C49F' : 
                      entry.name === 'error' ? '#FF6B6B' : 
                      '#0088FE'
                    } 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} agent(s)`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="analytics-row">
        <Card title="Top Data Sources (by row count)" className="analytics-card">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataSourceStats}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} rows`, 'Size']} />
              <Bar dataKey="rows" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Recent Activity" className="analytics-card">
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((report, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">📊</div>
                <div className="activity-content">
                  <div className="activity-title">{report.name}</div>
                  <div className="activity-meta">
                    <span className="activity-time">
                      {new Date(report.generatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No recent activity</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;