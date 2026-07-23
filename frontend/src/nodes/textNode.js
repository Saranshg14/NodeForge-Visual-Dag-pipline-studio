// textNode.js

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { BaseNode } from './BaseNode';

const VAR_RE = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

const extractVariables = (text) => {
  const vars = new Set();
  let m;
  while ((m = VAR_RE.exec(text)) !== null) vars.add(m[1]);
  return [...vars];
};

export const TextNode = ({ id, data }) => {
  const currText = data?.text ?? '{{input}}';
  const updateNodeField = useStore((s) => s.updateNodeField);
  const pruneEdgesForNode = useStore((s) => s.pruneEdgesForNode);
  const taRef = useRef(null);

  const variables = useMemo(() => extractVariables(currText), [currText]);

  const onChange = useCallback(
    (e) => updateNodeField(id, 'text', e.target.value),
    [id, updateNodeField]
  );

  // Auto-grow height to fit content
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [currText]);

  // Drop edges whose target handle no longer corresponds to a variable in the text
  useEffect(() => {
    const valid = new Set(variables.map((v) => `${id}-var-${v}`));
    pruneEdgesForNode(id, valid);
  }, [id, variables, pruneEdgesForNode]);

  return (
    <BaseNode id={id} data={data} title="Text" category="text" handles={{ outputs: ['output'] }}>
      <textarea
        ref={taRef}
        className="vs-input vs-textarea"
        value={currText}
        onChange={onChange}
        rows={1}
        spellCheck={false}
      />
      {variables.map((v, i) => (
        <Handle
          key={v}
          type="target"
          position={Position.Left}
          id={`${id}-var-${v}`}
          title={v}
          style={{ top: `${((i + 1) / (variables.length + 1)) * 100}%` }}
        />
      ))}
    </BaseNode>
  );
};
