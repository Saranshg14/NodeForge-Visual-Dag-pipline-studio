// submit.js

import { useState } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { simulateExecution } from './execution/runPipeline';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const selector = (s) => ({ nodes: s.nodes, edges: s.edges });

export const SubmitButton = () => {
  const { nodes, edges } = useStore(selector, shallow);
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const handleSubmit = async () => {
    if (nodes.length === 0) {
      alert('Add at least one node before submitting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({ id: n.id })),
          edges: edges.map((e) => ({ source: e.source, target: e.target })),
        }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const { num_nodes, num_edges, is_dag } = await res.json();
      alert(
        `Pipeline Analysis\n\n` +
        `• Nodes: ${num_nodes}\n` +
        `• Edges: ${num_edges}\n` +
        `• Valid DAG: ${is_dag ? 'Yes' : 'No — contains a cycle'}`
      );
    } catch (err) {
      alert(`Could not reach the backend.\n${err.message}\n\nIs uvicorn running on :8000?`);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => {
    if (nodes.length === 0) {
      alert('Add at least one node before running.');
      return;
    }
    setRunResult(simulateExecution(nodes, edges));
  };

  return (
    <div className="vs-submit-bar">
      {runResult && (
        <div className="vs-run-panel">
          <div className="vs-run-panel__head">
            <span>
              {runResult.isDag
                ? 'Simulated Run — deterministic local mock, no external calls'
                : 'Cannot run'}
            </span>
            <button type="button" onClick={() => setRunResult(null)} aria-label="Close run results">×</button>
          </div>
          {!runResult.isDag ? (
            <p className="vs-run-panel__error">The graph contains a cycle and can't be executed in order.</p>
          ) : (
            <ol className="vs-run-panel__list">
              {runResult.steps.map((s) => (
                <li key={s.id}>
                  <span className="vs-run-panel__node">{s.id}</span>
                  <span className="vs-run-panel__summary">{s.result.summary}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      <div className="vs-submit-actions">
        <button type="button" className="vs-submit-btn vs-submit-btn--ghost" onClick={handleRun}>
          Run (Simulated)
        </button>
        <button type="button" className="vs-submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing…' : 'Submit Pipeline'}
        </button>
      </div>
    </div>
  );
};
