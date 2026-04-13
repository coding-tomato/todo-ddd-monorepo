import React from 'react';

interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error(error, info); }
  render() {
    if (this.state.hasError) {
      return <div className="error-boundary__fallback">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
