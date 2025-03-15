import { create } from 'zustand';
import { reports as reportService } from '../services/apiClient';
import { auth } from '../services/apiClient';

// Helper to create a sample reports
const createSampleReports = () => {
  console.log('Creating sample reports for demo...');
  
  return [
    {
      id: 'sample-report-1',
      name: 'Sales Data Analysis',
      description: 'Analysis of sales data for the last month',
      agentId: 'sample-agent-1',
      dataSourceId: 'sample-data-1',
      generatedAt: new Date().toISOString(),
      status: 'completed',
      summary: 'The analysis shows a 15% increase in sales compared to the previous month.',
      insights: [
        'Overall sales increased by 15% compared to last month.',
        'Electronics remains the top-selling category with 45% of total sales.',
        '5 products have critically low inventory levels.'
      ],
      visualizations: [
        { 
          type: 'bar', 
          data: [
            { name: 'Electronics', value: 450 },
            { name: 'Clothing', value: 300 },
            { name: 'Home', value: 150 },
            { name: 'Books', value: 100 }
          ],
          config: {
            title: 'Sales by Category',
            xAxisKey: 'name',
            valueKey: 'value'
          }
        },
        { 
          type: 'line', 
          data: [
            { name: 'Day 1', value: 120 },
            { name: 'Day 2', value: 150 },
            { name: 'Day 3', value: 130 },
            { name: 'Day 4', value: 200 },
            { name: 'Day 5', value: 180 },
            { name: 'Day 6', value: 190 },
            { name: 'Day 7', value: 210 }
          ],
          config: {
            title: 'Daily Sales Trend',
            xAxisKey: 'name',
            valueKey: 'value'
          }
        }
      ],
      metadata: {
        version: '1.0.0',
        processingTime: '3.2s',
        recordsAnalyzed: 100
      }
    },
    {
      id: 'sample-report-2',
      name: 'Inventory Status Alert',
      description: 'Notification of low inventory items',
      agentId: 'sample-agent-2',
      dataSourceId: 'sample-data-1',
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      summary: 'Several products have inventory levels below the threshold.',
      insights: [
        'Product 12 is out of stock and has 5 pending orders.',
        '4 products have inventory levels below 10 units.'
      ],
      visualizations: [],
      metadata: {
        version: '1.0.0',
        processingTime: '1.5s',
        recordsAnalyzed: 100
      }
    }
  ];
};

// Get reports from localStorage on store creation
const getInitialReports = () => {
  try {
    const storedReports = localStorage.getItem('reports');
    if (storedReports) {
      const parsedReports = JSON.parse(storedReports);
      if (Array.isArray(parsedReports) && parsedReports.length > 0) {
        console.log('Loaded initial reports from localStorage:', parsedReports.length);
        return parsedReports;
      }
    }
  } catch (err) {
    console.error('Error loading initial reports from localStorage:', err);
  }
  return [];
};

// Create the store
const useReportStore = create((set, get) => ({
  // State
  reports: getInitialReports(),
  selectedReport: null,
  isLoading: false,
  error: null,
  initialized: true, // Since we loaded from localStorage, we're already initialized
  
  // Selectors
  getReportById: (id) => {
    // Make sure reports is an array before using find
    const reports = get().reports || [];
    return Array.isArray(reports) ? reports.find(report => report && report.id === id) : null;
  },
  
  getReportsByAgentId: (agentId) => {
    // Make sure reports is an array before using filter
    const reports = get().reports || [];
    return Array.isArray(reports) 
      ? reports.filter(report => report && report.agentId === agentId)
      : [];
  },
  
  getReportsByDataSourceId: (dataSourceId) => {
    // Make sure reports is an array before using filter
    const reports = get().reports || [];
    return Array.isArray(reports)
      ? reports.filter(report => 
          report && report.dataSourceIds && report.dataSourceIds.includes(dataSourceId)
        )
      : [];
  },
  
  // Actions
  fetchReports: async () => {
    // Skip if already initialized or loading
    if (get().initialized || get().isLoading) {
      return get().reports;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      // Try to load from localStorage first
      let storedReports = [];
      let usedLocalStorage = false;
      
      try {
        const reportsJson = localStorage.getItem('reports');
        if (reportsJson) {
          storedReports = JSON.parse(reportsJson);
          if (Array.isArray(storedReports) && storedReports.length > 0) {
            console.log('Loaded reports from localStorage:', storedReports.length);
            usedLocalStorage = true;
          }
        }
      } catch (localStorageError) {
        console.warn('Error loading reports from localStorage:', localStorageError);
      }
      
      // If we have reports in localStorage, use those
      if (usedLocalStorage && storedReports.length > 0) {
        set({ 
          reports: storedReports,
          isLoading: false,
          initialized: true
        });
        return storedReports;
      }
      
      // Otherwise try the API or fallback to samples
      if (auth.isAuthenticated()) {
        // If authenticated, try to get reports from API
        try {
          const response = await reportService.getAll();
          const apiReports = response.data.reports;
          
          set({ 
            reports: apiReports,
            isLoading: false,
            initialized: true
          });
          
          // Also save to localStorage
          try {
            localStorage.setItem('reports', JSON.stringify(apiReports));
          } catch (e) {
            console.error('Failed to save reports to localStorage:', e);
          }
          
          return apiReports;
        } catch (error) {
          console.error('Error fetching reports:', error);
          
          // Fallback to samples if API is unreachable
          if (error.message === 'Network Error') {
            console.warn('API unreachable, using sample reports');
            const sampleReports = createSampleReports();
            
            set({ 
              reports: sampleReports,
              isLoading: false,
              initialized: true
            });
            
            // Save sample reports to localStorage
            try {
              localStorage.setItem('reports', JSON.stringify(sampleReports));
            } catch (e) {
              console.error('Failed to save sample reports to localStorage:', e);
            }
            
            return sampleReports;
          } else {
            set({ 
              isLoading: false,
              initialized: true,
              error: error.message || 'Failed to fetch reports'
            });
            return [];
          }
        }
      } else {
        // Not authenticated, use sample reports
        console.warn('No authentication, using sample reports');
        const sampleReports = createSampleReports();
        
        set({ 
          reports: sampleReports,
          isLoading: false,
          initialized: true
        });
        
        // Save sample reports to localStorage
        try {
          localStorage.setItem('reports', JSON.stringify(sampleReports));
        } catch (e) {
          console.error('Failed to save sample reports to localStorage:', e);
        }
        
        return sampleReports;
      }
    } catch (error) {
      console.error('Error in report initialization:', error);
      set({ 
        isLoading: false,
        initialized: true,
        error: error.message || 'Failed to initialize reports'
      });
      return [];
    }
  },
  
  getReport: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Look in current state first
      const existingReport = get().reports.find(r => r.id === id);
      if (existingReport) {
        set({ 
          selectedReport: existingReport,
          isLoading: false
        });
        return existingReport;
      }
      
      // If not in state, try API
      const response = await reportService.getById(id);
      set({ 
        selectedReport: response.data.report,
        isLoading: false
      });
      
      return response.data.report;
    } catch (error) {
      console.error('Error getting report:', error);
      set({ 
        isLoading: false,
        error: error.message || 'Failed to get report'
      });
      throw error;
    }
  },
  
  addReport: async (report) => {
    try {
      // Normalize the report
      const newReport = { 
        ...report,
        id: report.id || Math.random().toString(36).substr(2, 9),
        name: report.name || report.title || `Report ${new Date().toLocaleString()}`,
        generatedAt: report.generatedAt || report.timestamp || report.createdAt || new Date().toISOString(),
        insights: report.insights || [],
        visualizations: report.visualizations || []
      };
      
      // Get current reports and add the new one
      const updatedReports = [...get().reports, newReport];
      
      // Update state
      set({ reports: updatedReports });
      
      // Save to localStorage
      localStorage.setItem('reports', JSON.stringify(updatedReports));
      
      // Try to save to API if available
      try {
        await reportService.create(newReport);
      } catch (apiError) {
        console.warn('API unreachable, saved report to local state only');
      }
      
      return newReport;
    } catch (error) {
      console.error('Error adding report:', error);
      return null;
    }
  },
  
  deleteReport: async (id) => {
    try {
      // Update state to remove the report
      const updatedReports = get().reports.filter(r => r.id !== id);
      
      set({
        reports: updatedReports,
        selectedReport: get().selectedReport?.id === id ? null : get().selectedReport
      });
      
      // Update localStorage
      localStorage.setItem('reports', JSON.stringify(updatedReports));
      
      // Try to delete from API if available
      try {
        await reportService.delete(id);
      } catch (apiError) {
        console.warn('API unreachable, deleted report from local state only');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  },
  
  clearSelectedReport: () => {
    set({ selectedReport: null });
  }
}));

export default useReportStore;