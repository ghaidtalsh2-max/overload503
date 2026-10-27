import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Ops Room Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#05070a',
          color: '#f87171',
          padding: '2rem',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(234, 67, 53, 0.1)',
            border: '1px solid #ea4335',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>⚠️ Ops Console Diagnostics</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '1rem' }}>
              An unexpected error occurred during interface initialization.
            </p>
            <pre style={{
              background: '#000',
              padding: '1rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '1rem',
              color: '#fca5a5'
            }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#4285f4',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              🔄 RESET STORAGE & RELOAD OPS ROOM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
