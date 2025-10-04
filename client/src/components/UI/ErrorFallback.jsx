import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-error-600 dark:text-error-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Something went wrong
          </h1>
          
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-secondary-500 dark:text-secondary-400 mb-2">
                Error details (development only)
              </summary>
              <pre className="text-xs bg-secondary-100 dark:bg-secondary-800 p-3 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetErrorBoundary}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="btn btn-outline flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback; 