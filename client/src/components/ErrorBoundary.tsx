import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, Bug } from "lucide-react";
import { Component, ReactNode } from "react";
import { logError } from "@/lib/error-handler";
import { normalizeError, getUserFriendlyMessage } from "../../../shared/errors";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with context
    const normalizedError = normalizeError(error);
    logError(normalizedError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

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
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      const userMessage = getUserFriendlyMessage(this.state.error);
      const showDetails = import.meta.env.DEV;

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <AlertTriangle
                  size={64}
                  className="text-destructive mb-2 flex-shrink-0"
                />
                <div className="absolute -top-1 -right-1">
                  <Bug size={24} className="text-destructive/50" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Something went wrong</h2>
                <p className="text-muted-foreground">{userMessage}</p>
              </div>
            </div>

            {showDetails && this.state.error && (
              <details className="w-full">
                <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="p-4 w-full rounded bg-muted overflow-auto space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Error Message:
                    </p>
                    <pre className="text-sm text-foreground whitespace-break-spaces">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Stack Trace:
                      </p>
                      <pre className="text-xs text-muted-foreground whitespace-break-spaces overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-muted-foreground whitespace-break-spaces overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home size={16} />
                Go Home
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
