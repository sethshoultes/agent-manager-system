import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, error: authError, isAuthenticated, isLoading, clearError } = useAuth();
  const navigate = useNavigate();

  // Clear any auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');

    try {
      await login(email, password);
      // Navigation happens in the useEffect when isAuthenticated changes
    } catch (err) {
      console.error('Login error:', err);
      setLocalError('Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Agent Manager</h1>
        <h2>Login</h2>
        
        {(localError || authError) && (
          <div className="error-message">{localError || authError}</div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn login-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Demo credentials:</p>
          <p>Email: test@example.com</p>
          <p>Password: password123</p>
          <p className="mt-3">Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;