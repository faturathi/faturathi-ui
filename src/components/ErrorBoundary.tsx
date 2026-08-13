import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort safety net: catches any render-time exception anywhere below it (e.g. the
 * unguarded-null-field crashes that used to blank the whole app, see TddMlsView.tsx) and shows
 * a recoverable screen instead of an unmounted white page. Does NOT catch errors from async
 * code / event handlers — those are surfaced separately via lib/api.ts's error listener.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className={`${this.props.compact ? 'min-h-[420px]' : 'min-h-screen'} flex items-center justify-center bg-slate-50 px-4`}>
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-2xl" aria-hidden="true">!</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-500 mb-6">
            This screen hit an unexpected error and couldn't continue. Your data is safe — try
            reopening this screen. Your login session and current work have been preserved.
          </p>
          <button
            onClick={this.reset}
            className="w-full bg-[#004494] hover:bg-[#003370] text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            Try this screen again
          </button>
        </div>
      </div>
    );
  }
}
