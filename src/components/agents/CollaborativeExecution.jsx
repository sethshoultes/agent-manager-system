import React, { useState, useEffect } from 'react';
import useAgentStore from '../../stores/agentStore';
import ExecutionProgress from './ExecutionProgress';
import './ExecutionProgress.css';

/**
 * Component for displaying collaborative execution progress
 * Shows execution status of multiple agents working together
 */
const CollaborativeExecution = ({
  collaborativeAgent,
  collaborators = [],
  onComplete,
  dataSource,
  logMessages = [],
  executionProgress = {},
  isExecuting = false
}) => {
  const agentStore = useAgentStore();
  const [collaboratorStatus, setCollaboratorStatus] = useState({});
  const [completedCount, setCompletedCount] = useState(0);
  const [synthesisStarted, setSynthesisStarted] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState(0);

  // Calculate overall progress based on individual agent progress
  const calculateOverallProgress = () => {
    if (!collaborators || collaborators.length === 0) return 0;
    
    const completedAgents = Object.values(collaboratorStatus).filter(status => status.completed);
    const inProgressAgents = Object.values(collaboratorStatus).filter(status => !status.completed);
    
    // Calculate progress for completed agents (100% each)
    const completedProgress = completedAgents.length * 100;
    
    // Calculate progress for in-progress agents (their current progress)
    const inProgressTotal = inProgressAgents.reduce((sum, status) => sum + (status.progress || 0), 0);
    
    // Calculate synthesis progress (only if all agents are complete)
    const synthesisContribution = synthesisStarted ? synthesisProgress * 0.2 : 0;
    
    // Combine all progress components
    const totalPossibleProgress = collaborators.length * 100 + 20; // agents + synthesis
    const currentProgress = completedProgress + inProgressTotal + synthesisContribution;
    
    return Math.min(100, Math.round((currentProgress / totalPossibleProgress) * 100));
  };

  // Update collaborator status when execution progress changes
  useEffect(() => {
    if (!isExecuting) return;
    
    // Update status for the collaborator that changed
    if (executionProgress.agentId && executionProgress.progress) {
      setCollaboratorStatus(prev => ({
        ...prev,
        [executionProgress.agentId]: {
          progress: executionProgress.progress,
          stage: executionProgress.stage,
          completed: executionProgress.progress >= 100
        }
      }));
      
      // Check if this completion means we've finished all collaborators
      if (executionProgress.progress >= 100) {
        const newCompletedCount = completedCount + 1;
        setCompletedCount(newCompletedCount);
        
        // Start synthesis when all collaborators are done
        if (newCompletedCount === collaborators.length && !synthesisStarted) {
          setSynthesisStarted(true);
          // Simulate synthesis progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            setSynthesisProgress(progress);
            if (progress >= 100) {
              clearInterval(interval);
              // Call onComplete callback when synthesis is done
              if (onComplete) onComplete();
            }
          }, 500);
        }
      }
    }
  }, [executionProgress, isExecuting, collaborators.length, completedCount, onComplete]);

  return (
    <div className="collaborative-execution">
      <h3>Collaborative Execution: {collaborativeAgent?.name}</h3>
      
      <div className="execution-overall-progress">
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${calculateOverallProgress()}%` }}
          ></div>
        </div>
        <div className="progress-text">
          Overall Progress: {calculateOverallProgress()}%
        </div>
      </div>
      
      <div className="collaborators-progress">
        <h4>Collaborator Agents</h4>
        
        {collaborators.map(agent => (
          <div key={agent.id} className="collaborator-progress-item">
            <div className="collaborator-info">
              <span className="collaborator-name">{agent.name}</span>
              <span className="collaborator-type">({agent.type})</span>
            </div>
            
            <div className="collaborator-status">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${collaboratorStatus[agent.id]?.progress || 0}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {collaboratorStatus[agent.id]?.stage || 'Waiting'} 
                ({collaboratorStatus[agent.id]?.progress || 0}%)
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {synthesisStarted && (
        <div className="synthesis-progress">
          <h4>Synthesizing Results</h4>
          <div className="progress-bar-container">
            <div 
              className="progress-bar synthesis" 
              style={{ width: `${synthesisProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Combining results from all collaborators ({synthesisProgress}%)
          </div>
        </div>
      )}
      
      <div className="execution-logs">
        <h4>Execution Logs</h4>
        <div className="log-container">
          {logMessages.map((log, index) => (
            <div key={index} className="log-entry">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeExecution;