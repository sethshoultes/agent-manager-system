import axios from 'axios';

// Create an Axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add a request timestamp for debugging
    config.metadata = { startTime: new Date().getTime() };
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle API errors (could add custom error handling/logging here)
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error('API Error:', error.response.data);
      
      // Handle 401 Unauthorized (token expired, etc.)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Could redirect to login page here
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Something else happened while setting up the request
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Authentication (mocked for testing)
export const auth = {
  login: async (email, password) => {
    // Always succeed for testing purposes
    const mockUser = { id: '1', name: 'Test User', email, role: 'admin' };
    const mockToken = 'mock-token-for-testing';
    
    // Save mock token and user info
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    return { user: mockUser, token: mockToken };
  },
  
  register: async (userData) => {
    // Mock successful registration
    const mockUser = { 
      id: '1', 
      name: userData.name || 'Test User', 
      email: userData.email, 
      role: 'admin' 
    };
    const mockToken = 'mock-token-for-testing';
    
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    return { data: { user: mockUser, token: mockToken } };
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    return { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' };
  },
  
  isAuthenticated: () => {
    // Always return true for testing
    return true;
  }
};

// Agents API
export const agents = {
  getAll: () => apiClient.get('/agents'),
  
  getById: (id) => apiClient.get(`/agents/${id}`),
  
  create: (agentData) => apiClient.post('/agents', agentData),
  
  update: (id, agentData) => apiClient.put(`/agents/${id}`, agentData),
  
  delete: (id) => apiClient.delete(`/agents/${id}`),
  
  execute: (id, dataSourceId) => apiClient.post(`/agents/${id}/execute`, { dataSourceId })
};

// Data Sources API
export const dataSources = {
  getAll: () => apiClient.get('/data-sources'),
  
  getById: (id) => apiClient.get(`/data-sources/${id}`),
  
  create: (dataSourceData) => apiClient.post('/data-sources', dataSourceData),
  
  update: (id, dataSourceData) => apiClient.put(`/data-sources/${id}`, dataSourceData),
  
  delete: (id) => apiClient.delete(`/data-sources/${id}`),
  
  upload: (formData) => apiClient.post('/data-sources/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Reports API
export const reports = {
  getAll: () => apiClient.get('/reports'),
  
  getById: (id) => apiClient.get(`/reports/${id}`),
  
  create: (reportData) => apiClient.post('/reports', reportData),
  
  update: (id, reportData) => apiClient.put(`/reports/${id}`, reportData),
  
  delete: (id) => apiClient.delete(`/reports/${id}`),
  
  export: (id, format) => apiClient.get(`/reports/${id}/export/${format}`, {
    responseType: 'blob' // Important for file downloads
  })
};

export default {
  auth,
  agents,
  dataSources,
  reports
};