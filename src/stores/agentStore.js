import { create } from 'zustand';
import { agents as agentService } from '../services/apiClient';
import { auth } from '../services/apiClient';

// Helper to create a sample agent
const createSampleAgents = () => {
  console.log('Creating sample agents for demo...');
  
  return [
    {
      id: 'sample-agent-1',
      name: 'Data Analyzer',
      description: 'Analyzes data sources and creates reports',
      type: 'analyzer',
      status: 'active',
      configuration: {
        dataSourceIds: ['sample-data-1'],
        refreshInterval: 60,
        analysisType: 'comprehensive'
      },
      createdAt: new Date().toISOString(),
      lastRun: new Date().toISOString(),
      metadata: {
        version: '1.0.0',
        capabilities: ['data-processing', 'report-generation']
      }
    },
    {
      id: 'sample-agent-2',
      name: 'Notification Agent',
      description: 'Sends notifications based on data thresholds',
      type: 'notifier',
      status: 'idle',
      configuration: {
        dataSourceIds: ['sample-data-1'],
        thresholds: {
          value: 800,
          operator: 'gt'
        },
        notificationChannels: ['email']
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        version: '1.0.0',
        capabilities: ['notifications', 'threshold-monitoring']
      }
    }
  ];
};

// Create the store
const useAgentStore = create((set, get) => ({
  // State
  agents: [],
  selectedAgent: null,
  isLoading: false,
  error: null,
  initialized: false, // Track initialization
  
  // Selectors
  getAgentById: (id) => {
    return get().agents.find(agent => agent.id === id);
  },
  
  // Actions
  fetchAgents: async () => {
    // Skip if already initialized or loading
    if (get().initialized || get().isLoading) {
      return get().agents;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      // Try to load from localStorage first
      let storedAgents = [];
      let usedLocalStorage = false;
      
      try {
        const agentsJson = localStorage.getItem('agents');
        if (agentsJson) {
          storedAgents = JSON.parse(agentsJson);
          if (Array.isArray(storedAgents) && storedAgents.length > 0) {
            console.log('Loaded agents from localStorage:', storedAgents.length);
            usedLocalStorage = true;
          }
        }
      } catch (localStorageError) {
        console.warn('Error loading agents from localStorage:', localStorageError);
      }
      
      // If we have agents in localStorage, use those
      if (usedLocalStorage && storedAgents.length > 0) {
        set({ 
          agents: storedAgents,
          isLoading: false,
          initialized: true
        });
        return storedAgents;
      }
      
      // Otherwise try the API or fallback to samples
      if (auth.isAuthenticated()) {
        // If authenticated, try to get agents from API
        try {
          const response = await agentService.getAll();
          const apiAgents = response.data.agents;
          
          set({ 
            agents: apiAgents,
            isLoading: false,
            initialized: true
          });
          
          // Also save to localStorage
          try {
            localStorage.setItem('agents', JSON.stringify(apiAgents));
            console.log('Saved agents to localStorage, count:', apiAgents.length);
          } catch (e) {
            console.error('Failed to save agents to localStorage:', e);
          }
          
          return apiAgents;
        } catch (error) {
          console.error('Error fetching agents:', error);
          
          // Fallback to samples if API is unreachable
          if (error.message === 'Network Error') {
            console.warn('API unreachable, using sample agents');
            const sampleAgents = createSampleAgents();
            
            set({ 
              agents: sampleAgents,
              isLoading: false,
              initialized: true
            });
            
            // Save sample agents to localStorage
            try {
              localStorage.setItem('agents', JSON.stringify(sampleAgents));
              console.log('Saved sample agents to localStorage, count:', sampleAgents.length);
            } catch (e) {
              console.error('Failed to save sample agents to localStorage:', e);
            }
            
            return sampleAgents;
          } else {
            set({ 
              isLoading: false,
              initialized: true,
              error: error.message || 'Failed to fetch agents'
            });
            return [];
          }
        }
      } else {
        // Not authenticated, use sample agents
        console.warn('No authentication, using sample agents');
        const sampleAgents = createSampleAgents();
        
        set({ 
          agents: sampleAgents,
          isLoading: false,
          initialized: true
        });
        
        // Save sample agents to localStorage
        try {
          localStorage.setItem('agents', JSON.stringify(sampleAgents));
          console.log('Saved sample agents to localStorage, count:', sampleAgents.length);
        } catch (e) {
          console.error('Failed to save sample agents to localStorage:', e);
        }
        
        return sampleAgents;
      }
    } catch (error) {
      console.error('Error in agent initialization:', error);
      set({ 
        isLoading: false,
        initialized: true,
        error: error.message || 'Failed to initialize agents'
      });
      return [];
    }
  },
  
  addAgent: async (agent) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await agentService.create(agent);
      
      set(state => ({
        agents: [...state.agents, response.data.agent],
        isLoading: false
      }));
      
      return response.data.agent;
    } catch (error) {
      // For offline mode, add locally
      if (error.message === 'Network Error') {
        console.warn('API unreachable, adding agent to local state only');
        
        const newAgent = { 
          ...agent, 
          id: agent.id || Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          status: agent.status || 'idle'
        };
        
        set(state => ({
          agents: [...state.agents, newAgent],
          isLoading: false
        }));
        
        return newAgent;
      } else {
        console.error('Error adding agent:', error);
        set({ 
          isLoading: false,
          error: error.message || 'Failed to add agent'
        });
        throw error;
      }
    }
  },
  
  updateAgent: async (agent) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await agentService.update(agent.id, agent);
      
      set(state => ({
        agents: state.agents.map(a => 
          a.id === agent.id ? { ...a, ...response.data.agent } : a
        ),
        selectedAgent: state.selectedAgent?.id === agent.id 
          ? { ...state.selectedAgent, ...response.data.agent } 
          : state.selectedAgent,
        isLoading: false
      }));
      
      return response.data.agent;
    } catch (error) {
      // For offline mode, update locally
      if (error.message === 'Network Error') {
        console.warn('API unreachable, updating agent in local state only');
        
        set(state => ({
          agents: state.agents.map(a => 
            a.id === agent.id ? { ...a, ...agent } : a
          ),
          selectedAgent: state.selectedAgent?.id === agent.id 
            ? { ...state.selectedAgent, ...agent } 
            : state.selectedAgent,
          isLoading: false
        }));
        
        return agent;
      } else {
        console.error('Error updating agent:', error);
        set({ 
          isLoading: false,
          error: error.message || 'Failed to update agent'
        });
        throw error;
      }
    }
  },
  
  deleteAgent: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await agentService.delete(id);
      
      set(state => ({
        agents: state.agents.filter(a => a.id !== id),
        selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      // For offline mode, delete locally
      if (error.message === 'Network Error') {
        console.warn('API unreachable, deleting agent from local state only');
        
        set(state => ({
          agents: state.agents.filter(a => a.id !== id),
          selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
          isLoading: false
        }));
        
        return true;
      } else {
        console.error('Error deleting agent:', error);
        set({ 
          isLoading: false,
          error: error.message || 'Failed to delete agent'
        });
        throw error;
      }
    }
  },
  
  selectAgent: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Find in current state first (to avoid unnecessary API calls)
      const existingAgent = get().agents.find(a => a.id === id);
      
      if (existingAgent) {
        set({ 
          selectedAgent: existingAgent,
          isLoading: false 
        });
        return existingAgent;
      }
      
      // If not in state, try to get from API
      const response = await agentService.getById(id);
      set({ 
        selectedAgent: response.data.agent,
        isLoading: false
      });
      
      return response.data.agent;
    } catch (error) {
      console.error('Error selecting agent:', error);
      set({ 
        isLoading: false,
        error: error.message || 'Failed to select agent'
      });
      throw error;
    }
  },
  
  clearSelectedAgent: () => {
    set({ selectedAgent: null });
  },
  
  startAgent: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await agentService.start(id);
      
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === id ? { ...agent, status: 'active', lastRun: new Date().toISOString() } : agent
        ),
        selectedAgent: state.selectedAgent?.id === id 
          ? { ...state.selectedAgent, status: 'active', lastRun: new Date().toISOString() } 
          : state.selectedAgent,
        isLoading: false
      }));
      
      return response.data;
    } catch (error) {
      // For offline mode, update locally
      if (error.message === 'Network Error') {
        console.warn('API unreachable, starting agent in local state only');
        
        set(state => ({
          agents: state.agents.map(agent => 
            agent.id === id ? { ...agent, status: 'active', lastRun: new Date().toISOString() } : agent
          ),
          selectedAgent: state.selectedAgent?.id === id 
            ? { ...state.selectedAgent, status: 'active', lastRun: new Date().toISOString() } 
            : state.selectedAgent,
          isLoading: false
        }));
        
        return { success: true, message: 'Agent started in offline mode' };
      } else {
        console.error('Error starting agent:', error);
        set({ 
          isLoading: false,
          error: error.message || 'Failed to start agent'
        });
        throw error;
      }
    }
  },
  
  stopAgent: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await agentService.stop(id);
      
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === id ? { ...agent, status: 'idle' } : agent
        ),
        selectedAgent: state.selectedAgent?.id === id 
          ? { ...state.selectedAgent, status: 'idle' } 
          : state.selectedAgent,
        isLoading: false
      }));
      
      return response.data;
    } catch (error) {
      // For offline mode, update locally
      if (error.message === 'Network Error') {
        console.warn('API unreachable, stopping agent in local state only');
        
        set(state => ({
          agents: state.agents.map(agent => 
            agent.id === id ? { ...agent, status: 'idle' } : agent
          ),
          selectedAgent: state.selectedAgent?.id === id 
            ? { ...state.selectedAgent, status: 'idle' } 
            : state.selectedAgent,
          isLoading: false
        }));
        
        return { success: true, message: 'Agent stopped in offline mode' };
      } else {
        console.error('Error stopping agent:', error);
        set({ 
          isLoading: false,
          error: error.message || 'Failed to stop agent'
        });
        throw error;
      }
    }
  }
}));

export default useAgentStore;