import { useEffect, useState, useRef } from 'react';
import useDataStore from '../stores/dataStore';
import useAgentStore from '../stores/agentStore';
import useReportStore from '../stores/reportStore';

/**
 * Hook to initialize all stores when the application starts
 */
const useInitialize = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [counts, setCounts] = useState({ dataSources: 0, agents: 0, reports: 0 });
  
  // Use refs to avoid re-renders triggering useEffects
  const initialized = useRef(false);
  
  // Get raw state access to avoid subscriptions
  const getDataSources = useDataStore(state => state.dataSources || []);
  const getAgents = useAgentStore(state => state.agents || []);
  const getReports = useReportStore(state => state.reports || []);
  
  // Get loading states
  const dataLoading = useDataStore(state => state.isLoading);
  const agentLoading = useAgentStore(state => state.isLoading);
  const reportLoading = useReportStore(state => state.isLoading);
  
  // Initialize all stores on mount - run only once
  useEffect(() => {
    // Skip if already initialized
    if (initialized.current) return;
    
    console.log('Initializing application data...');
    
    const initializeStores = async () => {
      try {
        setIsInitializing(true);
        
        // Use zustand's getState() to avoid triggering subscriptions
        const dataStoreState = useDataStore.getState();
        const agentStoreState = useAgentStore.getState();
        const reportStoreState = useReportStore.getState();
        
        // Fetch data if needed
        if (dataStoreState.fetchDataSources) {
          try {
            await dataStoreState.fetchDataSources();
            console.log('Data sources fetched successfully');
          } catch (error) {
            console.error('Error fetching data sources:', error);
          }
        }
        
        if (agentStoreState.fetchAgents) {
          try {
            await agentStoreState.fetchAgents();
            console.log('Agents fetched successfully');
          } catch (error) {
            console.error('Error fetching agents:', error);
          }
        }
        
        if (reportStoreState.fetchReports) {
          try {
            await reportStoreState.fetchReports();
            console.log('Reports fetched successfully');
          } catch (error) {
            console.error('Error fetching reports:', error);
          }
        }
        
        // Mark as initialized
        initialized.current = true;
        
        // Update counts after initialization
        setCounts({
          dataSources: getDataSources.length,
          agents: getAgents.length,
          reports: getReports.length
        });
        
        console.log('Stores initialized successfully');
      } catch (error) {
        console.error('Error initializing stores:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeStores();
    
    // Empty dependency array ensures this only runs once on mount
  }, []);
  
  // Update counts when data changes, but only if we're initialized
  useEffect(() => {
    if (!initialized.current) return;
    
    setCounts({
      dataSources: getDataSources.length,
      agents: getAgents.length,
      reports: getReports.length
    });
  }, [getDataSources, getAgents, getReports]);
  
  return {
    isLoading: isInitializing || dataLoading || agentLoading || reportLoading,
    counts
  };
};

export default useInitialize;