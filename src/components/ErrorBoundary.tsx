/**
 * Error Boundary
 *
 * Catches runtime errors in the React tree (e.g. an MDX parse throw)
 * and renders a recoverable fallback instead of a blank page.
 */

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (reset: () => void, error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(this.reset, error);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm tracking-widest uppercase text-muted-foreground mb-2">
          Something went wrong
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Unexpected error</h1>
        <p className="text-muted-foreground mb-6 max-w-lg">
          {error.message || 'An unknown error occurred while rendering this page.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={this.reset}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
