'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try reloading the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center"
          >
            <RefreshCw size={20} className="mr-2" />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
