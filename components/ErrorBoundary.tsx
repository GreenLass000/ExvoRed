import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-100 text-red-800 rounded-lg">
          <h1 className="text-2xl font-bold">¡Oops! Algo salió mal.</h1>
          <p className="mt-2">Se ha producido un error en la aplicación. Por favor, intenta recargar la página.</p>
          {this.state.error && (
            <pre className="mt-4 text-left text-sm bg-red-50 p-4 rounded-md overflow-x-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;