// NodeErrorBoundary.js
// A render error inside one node must not take down the whole canvas.
// withNodeErrorBoundary wraps a single node component; CanvasErrorBoundary
// wraps the entire ReactFlow tree as a second line of defense.

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[NodeForge] render error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const withNodeErrorBoundary = (NodeComponent) => (props) => (
  <ErrorBoundary fallback={<div className="vs-node vs-node--error">⚠ Failed to render node</div>}>
    <NodeComponent {...props} />
  </ErrorBoundary>
);

export const CanvasErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="vs-canvas-crash">
        <p>Something went wrong rendering the canvas.</p>
        <p className="vs-canvas-crash__hint">Reload the page to continue. Your last edits may not be saved.</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);
