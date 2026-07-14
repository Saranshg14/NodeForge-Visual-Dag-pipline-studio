// BaseNode.js
// Config-driven shell shared by every node type. Renders the card, title,
// fields (synced to the Zustand store), and Handles from a declarative config.

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import './BaseNode.css';

const normalizeHandles = (arr = []) => arr.map((h) => (typeof h === 'string' ? { id: h } : h));
const verticalPct = (i, n) => `${((i + 1) / (n + 1)) * 100}%`;

const renderControl = (field, data, onFieldChange) => {
  const value = data?.[field.key] ?? field.default ?? '';
  if (field.type === 'select') {
    return (
      <select className="vs-input" value={value} onChange={onFieldChange(field.key)}>
        {(field.options || []).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        className="vs-input"
        value={value}
        onChange={onFieldChange(field.key)}
        rows={field.rows || 2}
      />
    );
  }
  return (
    <input
      className="vs-input"
      type="text"
      value={value}
      onChange={onFieldChange(field.key)}
    />
  );
};

export const BaseNode = ({
  id,
  data,
  title,
  category,
  fields,
  handles,
  children,
}) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const deleteNode = useStore((s) => s.deleteNode);

  const onFieldChange = useCallback(
    (key) => (e) => updateNodeField(id, key, e.target.value),
    [id, updateNodeField]
  );

  const onDelete = useCallback(
    (e) => {
      e.stopPropagation();
      deleteNode(id);
    },
    [id, deleteNode]
  );

  const inputs = normalizeHandles(handles.inputs);
  const outputs = normalizeHandles(handles.outputs);

  return (
    <div className={`vs-node vs-node--${category}`}>
      {inputs.map((h, i) => (
        <Handle
          key={h.id}
          type="target"
          position={Position.Left}
          id={`${id}-${h.id}`}
          title={h.id}
          style={{ top: verticalPct(i, inputs.length) }}
        />
      ))}

      <div className="vs-node__header">
        <span>{title}</span>
        <button
          type="button"
          className="vs-node__delete"
          onClick={onDelete}
          title="Delete node"
          aria-label={`Delete ${title} node`}
        >
          ×
        </button>
      </div>

      <div className="vs-node__body">
        {fields.map((f) => (
          <label key={f.key} className="vs-node__field">
            <span className="vs-node__field-label">{f.label}</span>
            {renderControl(f, data, onFieldChange)}
          </label>
        ))}
        {children}
      </div>

      {outputs.map((h, i) => (
        <Handle
          key={h.id}
          type="source"
          position={Position.Right}
          id={`${id}-${h.id}`}
          title={h.id}
          style={{ top: verticalPct(i, outputs.length) }}
        />
      ))}
    </div>
  );
};

BaseNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  title: PropTypes.string.isRequired,
  category: PropTypes.string,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['text', 'select', 'textarea']),
      default: PropTypes.any,
      options: PropTypes.arrayOf(PropTypes.string),
      rows: PropTypes.number,
    })
  ),
  handles: PropTypes.shape({
    inputs: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    outputs: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
  }),
  children: PropTypes.node,
};

BaseNode.defaultProps = {
  data: {},
  category: 'default',
  fields: [],
  handles: {},
  children: null,
};
