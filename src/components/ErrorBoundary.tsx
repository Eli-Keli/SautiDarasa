import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Error Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-600/20 mb-4">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
              <p className="text-gray-400 text-lg">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {/* Error Details (Collapsible) */}
            {this.state.error && (
              <details className="mb-8 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <summary className="px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors text-sm font-medium">
                  Show error details
                </summary>
                <div className="p-4 border-t border-gray-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-2">Error Message:</h3>
                    <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto text-gray-300">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-400 mb-2">Stack Trace:</h3>
                      <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto text-gray-300 max-h-48 overflow-y-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-400 mb-2">Component Stack:</h3>
                      <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto text-gray-300 max-h-48 overflow-y-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-[#3B82F6] hover:bg-blue-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go Home
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#3B82F6]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                What happened?
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                The application encountered an unexpected error and couldn't continue. This could be due to a
                network issue, browser compatibility, or a temporary glitch. Try reloading the page or returning
                to the home page to start fresh.
              </p>
            </div>

            {/* Support Info */}
            <div className="mt-4 text-center text-sm text-gray-500">
              If the problem persists, please contact support with the error details above.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
