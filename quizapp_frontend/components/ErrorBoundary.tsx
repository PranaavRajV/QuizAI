'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui-components';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'var(--bg-app)',
          fontFamily: 'var(--font-body)',
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertCircle size={32} color="#ef4444" />
            </div>
            
            <h1 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              fontSize: '15px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}>
              An unexpected error occurred. Don't worry, your data is safe. You can try refreshing the page or returning home.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <pre style={{
                textAlign: 'left',
                padding: '16px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                color: '#ef4444',
                overflow: 'auto',
                marginBottom: '32px',
                maxHeight: '200px',
              }}>
                {this.state.error?.message}
              </pre>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button onClick={this.handleReset} style={{ width: '100%', gap: '8px' }}>
                <RefreshCcw size={16} /> Try Refreshing
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} style={{ width: '100%', gap: '8px' }}>
                <Home size={16} /> Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;
