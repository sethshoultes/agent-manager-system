import React, { useState, useCallback } from 'react';
import useInterval from '../../hooks/useInterval';
import './ExecutionProgress.css';

/**
 * Component to display real-time agent execution progress
 */
const ExecutionProgress = ({ progress }) => {
  const {
    progress: percentage = 0,
    stage = 'Starting...',
    logs = [],
    startTime,
    estimatedCompletionTime
  } = progress || {};

  // State for time display
  const [, setTimeUpdate] = useState(0);
  
  // Force component to update every second to show accurate time
  const updateTime = useCallback(() => {
    setTimeUpdate(Date.now());
  }, []);
  
  // Setup the interval for time updates
  useInterval(updateTime, 1000);

  // Calculate elapsed time
  const elapsedMs = startTime ? (new Date() - new Date(startTime)) : 0;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedFormatted = elapsedMinutes > 0 
    ? `${elapsedMinutes}m ${elapsedSeconds % 60}s` 
    : `${elapsedSeconds}s`;
  
  // Format estimated remaining time
  const getEstimatedRemaining = () => {
    if (!estimatedCompletionTime) return 'Calculating...';
    
    const remainingMs = new Date(estimatedCompletionTime) - new Date();
    if (remainingMs <= 0) return 'Completing...';
    
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    
    return remainingMinutes > 0 
      ? `~${remainingMinutes}m ${remainingSeconds % 60}s remaining` 
      : `~${remainingSeconds}s remaining`;
  };

  return (
    <div className="execution-progress">
      <div className="progress-header">
        <h3>Execution Progress</h3>
        <div className="time-info">
          <span className="elapsed-time">
            Elapsed: {elapsedFormatted}
          </span>
          <span className="remaining-time">
            {getEstimatedRemaining()}
          </span>
        </div>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}>
          <span className="progress-percentage">{percentage}%</span>
        </div>
      </div>
      
      <div className="stage-indicator">
        <span className="stage-label">Current stage:</span>
        <span className="stage-name">{stage}</span>
      </div>
      
      <div className="execution-logs">
        <h4>Execution Logs</h4>
        <div className="logs-container">
          {Array.isArray(logs) && logs.map((log, index) => (
            <div key={index} className="log-entry">
              <span className="log-timestamp">{new Date().toLocaleTimeString()}</span>
              <span className="log-message">{log || ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutionProgress;