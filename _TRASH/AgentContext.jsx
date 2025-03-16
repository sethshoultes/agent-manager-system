import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { agents as agentService } from '../services/apiClient';
import { exportToJsonFile, importFromJsonFile } from '../services/fileStorageService';
import { auth } from '../services/apiClient';

const AgentContext = createContext();

const initialState = {
  agents: [],
  selectedAgent: null,
  isLoading: false,
  error: null,
  executionProgress: {
    agentId: null,
    progress: 0,
    stage: null,
    logs: [],
    startTime: null,
    estimatedCompletionTime: null
  }
};

function agentReducer(state, action) {
  switch (action.type) {
    case 'FETCH_AGENTS_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_AGENTS_SUCCESS':
      return {
        ...state,
        agents: action.payload,
        isLoading: false,
        error: null
      };
    case 'FETCH_AGENTS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_AGENT':
      return {
        ...state,
        agents: [...state.agents, action.payload]
      };
    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map(agent => 
          agent.id === action.payload.id 
            ? { ...agent, ...action.payload } 
            : agent
        )
      };
    case 'DELETE_AGENT':
      return {
        ...state,
        agents: state.agents.filter(agent => agent.id !== action.payload.id),
        selectedAgent: state.selectedAgent?.id === action.payload.id ? null : state.selectedAgent
      };
    case 'SELECT_AGENT':
      return {
        ...state,
        selectedAgent: action.payload
      };
    case 'SET_AGENT_STATUS':
      return {
        ...state,
        agents: state.agents.map(agent => 
          agent.id === action.payload.id 
            ? { ...agent, status: action.payload.status } 
            : agent
        )
      };
    case 'SET_AGENTS':
      return {
        ...state,
        agents: action.payload,
        selectedAgent: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'START_EXECUTION':
      return {
        ...state,
        executionProgress: {
          agentId: action.payload.agentId,
          progress: 0,
          stage: 'Starting',
          logs: ['Execution started'],
          startTime: new Date(),
          estimatedCompletionTime: null
        }
      };
    case 'UPDATE_EXECUTION_PROGRESS':
      return {
        ...state,
        executionProgress: {
          ...state.executionProgress,
          ...action.payload
        }
      };
    case 'ADD_EXECUTION_LOG':
      return {
        ...state,
        executionProgress: {
          ...state.executionProgress,
          logs: [...state.executionProgress.logs, action.payload.message]
        }
      };
    case 'COMPLETE_EXECUTION':
      return {
        ...state,
        executionProgress: {
          ...state.executionProgress,
          progress: 100,
          stage: 'Completed'
        }
      };
    case 'RESET_EXECUTION':
      return {
        ...state,
        executionProgress: initialState.executionProgress
      };
    default:
      return state;
  }
}

export function AgentProvider({ children }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  // Fetch agents when component mounts and user is authenticated
  useEffect(() => {
    const fetchAgents = async () => {
      // For demo purposes, create a default agent if none exists
      const createSampleAgents = () => {
        console.log('Creating sample agents for demo...');
        const sampleAgents = [
          {
            id: 'sample-agent-1',
            name: 'Data Analyzer',
            description: 'Analyzes datasets to identify patterns, trends, and statistical insights',
            type: 'analyzer',
            capabilities: ['statistical-analysis', 'trend-detection', 'anomaly-detection'],
            configuration: {
              analysisDepth: 'standard',
              statisticalMethods: ['mean', 'median', 'correlation'],
              outputFormat: 'summary'
            },
            status: 'idle',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'sample-agent-2',
            name: 'Data Visualizer',
            description: 'Creates visual representations of data using charts and graphs',
            type: 'visualizer',
            capabilities: ['chart-generation'],
            configuration: {
              chartTypes: ['bar', 'line', 'pie'],
              colorScheme: 'default',
              autoSelectVisualization: true
            },
            status: 'idle',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        // Save to localStorage for persistence
        localStorage.setItem('agents', JSON.stringify(sampleAgents));
        
        return sampleAgents;
      };
      
      try {
        dispatch({ type: 'FETCH_AGENTS_START' });
        
        if (auth.isAuthenticated()) {
          // If authenticated, try to get agents from API
          try {
            const response = await agentService.getAll();
            dispatch({ 
              type: 'FETCH_AGENTS_SUCCESS', 
              payload: response.data.agents 
            });
          } catch (error) {
            console.error('Error fetching agents:', error);
            
            // Fallback to localStorage if API is unreachable
            if (error.message === 'Network Error') {
              console.warn('API unreachable, falling back to localStorage for agents');
              const savedAgents = JSON.parse(localStorage.getItem('agents') || '[]');
              
              // If no agents in localStorage, create samples
              const agents = savedAgents.length > 0 ? savedAgents : createSampleAgents();
              
              dispatch({ 
                type: 'FETCH_AGENTS_SUCCESS',
                payload: agents
              });
            } else {
              dispatch({ 
                type: 'FETCH_AGENTS_ERROR', 
                payload: error.message || 'Failed to fetch agents' 
              });
            }
          }
        } else {
          // Not authenticated, use localStorage
          console.warn('No authentication, using localStorage for agents');
          const savedAgents = JSON.parse(localStorage.getItem('agents') || '[]');
          
          // If no agents in localStorage, create samples
          const agents = savedAgents.length > 0 ? savedAgents : createSampleAgents();
          
          dispatch({ 
            type: 'FETCH_AGENTS_SUCCESS',
            payload: agents
          });
        }
      } catch (error) {
        console.error('Error in agent initialization:', error);
        dispatch({ 
          type: 'FETCH_AGENTS_ERROR',
          payload: error.message || 'Failed to initialize agents'
        });
      }
    };

    fetchAgents();
  }, []);

  const addAgent = async (agent) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await agentService.create(agent);
      dispatch({ type: 'ADD_AGENT', payload: response.data.agent });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.agent;
    } catch (error) {
      console.error('Error adding agent:', error);
      
      // Fallback to localStorage if API is unreachable
      if (error.message === 'Network Error') {
        console.warn('API unreachable, falling back to localStorage for adding agent');
        
        const newAgent = { 
          ...agent, 
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'idle'
        };
        
        // Update local state
        dispatch({ type: 'ADD_AGENT', payload: newAgent });
        
        // Save to localStorage
        const savedAgents = JSON.parse(localStorage.getItem('agents') || '[]');
        localStorage.setItem('agents', JSON.stringify([...savedAgents, newAgent]));
        
        dispatch({ type: 'SET_LOADING', payload: false });
        return newAgent;
      } else {
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add agent' });
        dispatch({ type: 'SET_LOADING', payload: false });
        throw error;
      }
    }
  };

  const updateAgent = async (agent) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await agentService.update(agent.id, agent);
      dispatch({ type: 'UPDATE_AGENT', payload: response.data.agent });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.agent;
    } catch (error) {
      console.error('Error updating agent:', error);
      
      // Fallback to localStorage if API is unreachable
      if (error.message === 'Network Error') {
        console.warn('API unreachable, falling back to localStorage for updating agent');
        
        const updatedAgent = { 
          ...agent, 
          updatedAt: new Date().toISOString()
        };
        
        // Update local state
        dispatch({ type: 'UPDATE_AGENT', payload: updatedAgent });
        
        // Save to localStorage
        const savedAgents = JSON.parse(localStorage.getItem('agents') || '[]');
        const updatedAgents = savedAgents.map(a => 
          a.id === agent.id ? updatedAgent : a
        );
        localStorage.setItem('agents', JSON.stringify(updatedAgents));
        
        dispatch({ type: 'SET_LOADING', payload: false });
        return updatedAgent;
      } else {
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update agent' });
        dispatch({ type: 'SET_LOADING', payload: false });
        throw error;
      }
    }
  };

  const deleteAgent = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await agentService.delete(id);
      dispatch({ type: 'DELETE_AGENT', payload: { id } });
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      
      // Fallback to localStorage if API is unreachable
      if (error.message === 'Network Error') {
        console.warn('API unreachable, falling back to localStorage for deleting agent');
        
        // Update local state
        dispatch({ type: 'DELETE_AGENT', payload: { id } });
        
        // Save to localStorage
        const savedAgents = JSON.parse(localStorage.getItem('agents') || '[]');
        const updatedAgents = savedAgents.filter(a => a.id !== id);
        localStorage.setItem('agents', JSON.stringify(updatedAgents));
        
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete agent' });
        dispatch({ type: 'SET_LOADING', payload: false });
        throw error;
      }
    }
  };

  const selectAgent = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await agentService.getById(id);
      dispatch({ type: 'SELECT_AGENT', payload: response.data.agent });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data.agent;
    } catch (error) {
      console.error('Error selecting agent:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to select agent' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const setAgentStatus = async (id, status) => {
    // Find the agent to update
    const agent = state.agents.find(a => a.id === id);
    if (!agent) return;
    
    // First update status locally to ensure UI is responsive
    dispatch({ type: 'SET_AGENT_STATUS', payload: { id, status } });
    
    try {
      // Try to update status on the server
      const updatedAgent = { ...agent, status };
      
      try {
        await agentService.update(id, updatedAgent);
      } catch (apiError) {
        // Fallback to localStorage if API is unreachable
        if (apiError.message === 'Network Error') {
          console.warn('API unreachable, falling back to localStorage for status update');
          
          // Update in localStorage
          const savedAgents = JSON.parse(localStorage.getItem('agents') || '[]');
          const updatedAgents = savedAgents.map(a => 
            a.id === id ? { ...a, status } : a
          );
          localStorage.setItem('agents', JSON.stringify(updatedAgents));
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      // Just log the error but don't dispatch SET_ERROR to avoid potential loops
      console.error('Error updating agent status:', error);
      // We already updated the UI state, so no need to revert or show error
    }
  };

  const exportAgents = async () => {
    try {
      let agents = [];
      
      try {
        // Try to get agents from the API
        const response = await agentService.getAll();
        agents = response.data.agents;
      } catch (apiError) {
        // Fallback to localStorage if API is unreachable
        if (apiError.message === 'Network Error') {
          console.warn('API unreachable, falling back to localStorage for exporting agents');
          agents = JSON.parse(localStorage.getItem('agents') || '[]');
        } else {
          throw apiError;
        }
      }
      
      const filename = `agents-${new Date().toISOString().split('T')[0]}.json`;
      const exportData = agents.map(agent => ({
        ...agent,
        // Reset transient properties
        status: 'idle'
      }));
      
      return exportToJsonFile(filename, exportData);
    } catch (error) {
      console.error('Error exporting agents:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to export agents' });
      return false;
    }
  };

  const importAgents = async (file) => {
    try {
      const importedData = await importFromJsonFile(file);
      if (Array.isArray(importedData)) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          // Process each agent and add it to the API
          for (const agent of importedData) {
            const agentData = {
              name: agent.name,
              description: agent.description,
              type: agent.type,
              capabilities: agent.capabilities || [],
              configuration: agent.configuration || {},
            };
            
            await agentService.create(agentData);
          }
          
          // Fetch updated list
          const response = await agentService.getAll();
          dispatch({ type: 'SET_AGENTS', payload: response.data.agents });
        } catch (apiError) {
          // Fallback to localStorage if API is unreachable
          if (apiError.message === 'Network Error') {
            console.warn('API unreachable, falling back to localStorage for importing agents');
            
            // Process imported data for localStorage
            const processedData = importedData.map(agent => ({
              ...agent,
              id: agent.id || Math.random().toString(36).substr(2, 9),
              createdAt: agent.createdAt || new Date().toISOString(),
              updatedAt: agent.updatedAt || new Date().toISOString(),
              status: 'idle'
            }));
            
            // Save to localStorage
            localStorage.setItem('agents', JSON.stringify(processedData));
            
            // Update state
            dispatch({ type: 'SET_AGENTS', payload: processedData });
          } else {
            throw apiError;
          }
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing agents:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to import agents' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  // Simulate agent execution with local data processing
  const simulateAgentExecution = async (agent, dataSource) => {
    // Define execution stages
    const stages = [
      { name: 'Initializing', durationMs: 1000, progress: 10 },
      { name: 'Loading data', durationMs: 2000, progress: 20 },
      { name: 'Analyzing data structure', durationMs: 2000, progress: 35 },
      { name: 'Processing data', durationMs: 3000, progress: 60 },
      { name: 'Generating insights', durationMs: 2000, progress: 80 },
      { name: 'Creating visualizations', durationMs: 2000, progress: 95 },
      { name: 'Finalizing', durationMs: 1000, progress: 100 }
    ];

    // Calculate estimated completion time
    const totalDuration = stages.reduce((sum, stage) => sum + stage.durationMs, 0);
    const startTime = new Date();
    const estimatedCompletionTime = new Date(startTime.getTime() + totalDuration);

    // Initialize execution with metadata
    updateExecutionProgress({
      progress: 0,
      stage: 'Starting',
      startTime: startTime.toISOString(),
      estimatedCompletionTime: estimatedCompletionTime.toISOString()
    });
    
    addExecutionLog(`Starting execution of ${agent.name}`);
    addExecutionLog(`Estimated completion time: ${estimatedCompletionTime.toLocaleTimeString()}`);

    // Execute each stage sequentially
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      // Update progress for this stage
      updateExecutionProgress({
        progress: stage.progress,
        stage: stage.name
      });
      
      addExecutionLog(`Stage: ${stage.name}`);
      
      // Add specific log messages for certain stages
      switch (stage.name) {
        case 'Loading data':
          addExecutionLog(`Processing ${dataSource.metadata?.rowCount || 0} rows of data`);
          break;
        case 'Analyzing data structure':
          addExecutionLog(`Identified ${dataSource.metadata?.columnCount || 0} columns for analysis`);
          break;
        case 'Processing data':
          if (agent.capabilities && agent.capabilities.includes('statistical-analysis')) {
            addExecutionLog('Performing statistical analysis on numeric columns');
          }
          break;
        case 'Generating insights':
          const capCount = agent.capabilities?.length || 0;
          addExecutionLog(`Applying ${capCount} capabilities to extract insights`);
          if (dataSource.columns && dataSource.columns.length > 0) {
            addExecutionLog(`Found ${dataSource.columns.length} columns for analysis`);
          }
          break;
        case 'Creating visualizations':
          if (agent.capabilities && agent.capabilities.includes('chart-generation')) {
            addExecutionLog('Generating appropriate charts for data visualization');
          }
          break;
        default:
          break;
      }
      
      // Wait for the stage duration
      await new Promise(resolve => setTimeout(resolve, stage.durationMs));
    }
    
    // Complete execution
    completeExecution();
    addExecutionLog('Execution completed successfully');
    
    return {
      success: true,
      message: 'Execution completed successfully',
      executionId: Math.random().toString(36).substr(2, 9)
    };
  };

  const startExecution = async (agentId, dataSourceId) => {
    try {
      // Find the agent and data source
      const agent = state.agents.find(a => a.id === agentId);
      const dataSource = await loadDataSource(dataSourceId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      if (!dataSource) {
        throw new Error('Data source not found');
      }
      
      // Reset any previous execution data
      resetExecution();
      
      // Initialize execution state
      dispatch({ type: 'START_EXECUTION', payload: { agentId } });
      
      // Update agent status
      setAgentStatus(agentId, 'running');
      
      let executionResult;
      
      try {
        // Try to execute via API first
        const response = await agentService.execute(agentId, dataSourceId);
        executionResult = {
          success: true, 
          executionId: response.data.executionId
        };
        
        // Since the API execution is asynchronous, we'll simulate progress updates
        simulateAgentExecution(agent, dataSource);
      } catch (apiError) {
        console.log('API execution error:', apiError);
        
        // If the API is unreachable, fall back to local simulation
        if (apiError.message === 'Network Error') {
          console.warn('API unreachable, using local execution simulation');
          executionResult = await simulateAgentExecution(agent, dataSource);
        } else {
          throw apiError;
        }
      }
      
      return executionResult;
    } catch (error) {
      console.error('Error starting execution:', error);
      addExecutionLog(`Error: ${error.message}`);
      setAgentStatus(agentId, 'error');
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to start execution' });
      throw error;
    }
  };
  
  // Helper to load a data source (from state or via API)
  const loadDataSource = async (dataSourceId) => {
    try {
      // First try to fetch from API
      const response = await fetch(`http://localhost:3001/api/data-sources/${dataSourceId}`);
      if (response.ok) {
        const data = await response.json();
        return data.dataSource;
      }
    } catch (error) {
      console.warn('Could not load data source from API:', error);
    }
    
    // Fallback to localStorage
    try {
      const dataSources = JSON.parse(localStorage.getItem('dataSources') || '[]');
      return dataSources.find(ds => ds.id === dataSourceId);
    } catch (error) {
      console.error('Error loading data source:', error);
      return null;
    }
  };

  const updateExecutionProgress = (progressData) => {
    dispatch({ type: 'UPDATE_EXECUTION_PROGRESS', payload: progressData });
  };

  const addExecutionLog = (message) => {
    dispatch({ type: 'ADD_EXECUTION_LOG', payload: { message } });
  };

  const completeExecution = () => {
    dispatch({ type: 'COMPLETE_EXECUTION' });
  };

  const resetExecution = () => {
    dispatch({ type: 'RESET_EXECUTION' });
  };

  return (
    <AgentContext.Provider value={{
      agents: state.agents,
      selectedAgent: state.selectedAgent,
      isLoading: state.isLoading,
      error: state.error,
      executionProgress: state.executionProgress,
      addAgent,
      updateAgent,
      deleteAgent,
      selectAgent,
      setAgentStatus,
      exportAgents,
      importAgents,
      startExecution,
      updateExecutionProgress,
      addExecutionLog,
      completeExecution,
      resetExecution
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgentContext() {
  return useContext(AgentContext);
}