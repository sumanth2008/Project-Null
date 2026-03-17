import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100 p-4 font-mono">
          <div className="max-w-md w-full bg-zinc-900 border border-red-200 border-red-900/50 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-red-500 text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-xl font-bold">System Error</h1>
            </div>
            <p className="text-sm text-zinc-600 text-zinc-400 mb-4">
              An unexpected error occurred in the NullMatrix platform.
            </p>
            <div className="bg-zinc-900 bg-black p-4 rounded-xl overflow-x-auto text-xs text-red-600 text-red-400 border border-red-100 border-red-900/30">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-2 bg-red-500/10 text-red-600 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-colors"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
