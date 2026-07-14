// CanvasActions.js
// Undo / redo / clear controls, overlaid on the canvas top-right corner.

import { useStore } from './store';

export const CanvasActions = () => {
  const past = useStore((s) => s.past);
  const future = useStore((s) => s.future);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const clearCanvas = useStore((s) => s.clearCanvas);
  const nodeCount = useStore((s) => s.nodes.length);

  const onClear = () => {
    if (nodeCount === 0) return;
    if (window.confirm('Clear the entire canvas? You can Undo (Ctrl+Z) right after if this was a mistake.')) {
      clearCanvas();
    }
  };

  return (
    <div className="vs-canvas-actions">
      <button type="button" onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">
        ↶ Undo
      </button>
      <button type="button" onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Shift+Z)">
        ↷ Redo
      </button>
      <button type="button" onClick={onClear} disabled={nodeCount === 0} title="Clear canvas">
        Clear
      </button>
    </div>
  );
};
