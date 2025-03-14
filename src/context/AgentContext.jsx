import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  saveToLocalStorage, 
  loadFromLocalStorage,
  exportToJsonFile,
  importFromJsonFile
} from '../services/fileStorageService';

const AgentContext = createContext();

// Load agents from local storage or use empty array as default
const loadAgents = () => {
  const savedAgents = loadFromLocalStorage('agents', []);
  return savedAgents;
};

const initialState = {
  agents: loadAgents(),
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
    case 'ADD_AGENT':
      return {
        ...state,
        agents: [...state.agents, { ...action.payload, id: uuidv4(), createdAt: new Date(), updatedAt: new Date(), status: 'idle' }]
      };
    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map(agent => 
          agent.id === action.payload.id 
            ? { ...agent, ...action.payload, updatedAt: new Date() } 
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
            ? { ...agent, status: action.payload.status, updatedAt: new Date() } 
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

  // Save agents to local storage whenever they change
  useEffect(() => {
    saveToLocalStorage('agents', state.agents);
  }, [state.agents]);

  const addAgent = (agent) => {
    dispatch({ type: 'ADD_AGENT', payload: agent });
  };

  const updateAgent = (agent) => {
    dispatch({ type: 'UPDATE_AGENT', payload: agent });
  };

  const deleteAgent = (id) => {
    dispatch({ type: 'DELETE_AGENT', payload: { id } });
  };

  const selectAgent = (agent) => {
    dispatch({ type: 'SELECT_AGENT', payload: agent });
  };

  const setAgentStatus = (id, status) => {
    dispatch({ type: 'SET_AGENT_STATUS', payload: { id, status } });
  };

  const exportAgents = () => {
    const filename = `agents-${new Date().toISOString().split('T')[0]}.json`;
    const exportData = state.agents.map(agent => ({
      ...agent,
      // Reset transient properties
      status: 'idle'
    }));
    return exportToJsonFile(filename, exportData);
  };

  const importAgents = async (file) => {
    try {
      const importedData = await importFromJsonFile(file);
      if (Array.isArray(importedData)) {
        // Process each agent and add to state
        importedData.forEach(agent => {
          if (!agent.id) {
            agent.id = uuidv4();
          }
          agent.status = 'idle';
          agent.createdAt = new Date().toISOString();
          agent.updatedAt = new Date().toISOString();
        });
        
        // Replace all agents or merge?
        dispatch({ type: 'SET_AGENTS', payload: importedData });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing agents:', error);
      return false;
    }
  };

  const startExecution = (agentId) => {
    dispatch({ type: 'START_EXECUTION', payload: { agentId } });
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