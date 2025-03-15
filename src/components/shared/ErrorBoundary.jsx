import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Component Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback(this.state.error, this.state.errorInfo);
      }
      
      // Default error UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', cursor: 'pointer' }}>
            <summary>Show details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p className="error-stack">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </p>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="btn btn-primary mt-3"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;