'use client';

import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-red-50/50 border border-red-100 rounded-2xl m-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-red-800 font-bold mb-1">Something went wrong</h3>
          <p className="text-red-600 text-sm mb-4">
            {this.props.fallbackMessage ||
              'This panel encountered an unexpected error.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-colors text-sm font-semibold shadow-sm"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
