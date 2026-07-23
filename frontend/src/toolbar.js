// toolbar.js

import { useState, useMemo } from 'react';
import { DraggableNode } from './draggableNode';

const NODE_TYPES = [
  { type: 'customInput', label: 'Input' },
  { type: 'llm', label: 'LLM' },
  { type: 'customOutput', label: 'Output' },
  { type: 'text', label: 'Text' },
  { type: 'api', label: 'API' },
  { type: 'math', label: 'Math' },
  { type: 'filter', label: 'Filter' },
  { type: 'note', label: 'Note' },
  { type: 'delay', label: 'Delay' },
];

export const PipelineToolbar = () => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return NODE_TYPES;
      return NODE_TYPES.filter((n) => n.label.toLowerCase().includes(q));
    }, [query]);

    return (
        <div className="vs-toolbar">
            <div className="vs-toolbar__eyebrow">Node Library</div>
            <div className="vs-toolbar__search">
              <input
                type="text"
                className="vs-toolbar__search-input"
                placeholder="Search nodes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search node types"
              />
            </div>
            <div className="vs-toolbar__row">
                {filtered.map((n) => (
                  <DraggableNode key={n.type} type={n.type} label={n.label} />
                ))}
                {filtered.length === 0 && (
                  <span className="vs-toolbar__no-results">No nodes match "{query}"</span>
                )}
            </div>
        </div>
    );
};
