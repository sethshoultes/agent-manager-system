import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { auth as authService } from '../services/apiClient';

const AuthContext = createContext();

// For testing purposes, let's start already authenticated
const initialState = {
  user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
  isAuthenticated: true,
  isLoading: false,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'AUTH_CHECK_COMPLETE':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Skip auth check for testing
  useEffect(() => {
    console.log('Skipping auth check for testing - using mock user');
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const { user, token } = await authService.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return { user, token };
    } catch (error) {
      // If the error is a network error, try to use test credentials for development
      if (error.message === 'Network Error' && 
          email === 'test@example.com' && 
          password === 'password123') {
        console.warn('API server unreachable, using fallback auth for development');
        
        // Create a mock user and token
        const mockUser = {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin'
        };
        const mockToken = 'mock-jwt-token-for-development';
        
        // Store in localStorage
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
        return { user: mockUser, token: mockToken };
      }
      
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.response?.data?.message || 'Login failed. Please check your credentials.'
      });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'REGISTER_START' });
      const { user, token } = await authService.register(userData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: user });
      return { user, token };
    } catch (error) {
      dispatch({ 
        type: 'REGISTER_FAILURE', 
        payload: error.response?.data?.message || 'Registration failed. Please try again.'
      });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      login,
      register,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}