// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

const PERSIST_KEY = 'vs-pipeline';
const HISTORY_LIMIT = 50;

const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
};

let saveTimer = null;
const persistState = (nodes, edges) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify({ nodes, edges }));
    } catch {
      // localStorage unavailable (private mode / quota) — autosave is best-effort
    }
  }, 400);
};

const persisted = loadPersistedState();

const snapshot = (get) => ({ nodes: get().nodes, edges: get().edges });

const pushHistory = (get, set) => {
  const past = [...get().past, snapshot(get)].slice(-HISTORY_LIMIT);
  set({ past, future: [] });
};

export const useStore = create((set, get) => ({
    nodes: persisted?.nodes ?? [],
    edges: persisted?.edges ?? [],
    past: [],
    future: [],

    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        pushHistory(get, set);
        set({
            nodes: [...get().nodes, node]
        });
    },
    deleteNode: (nodeId) => {
      pushHistory(get, set);
      set({
        nodes: get().nodes.filter((n) => n.id !== nodeId),
        edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      });
    },
    clearCanvas: () => {
      pushHistory(get, set);
      set({ nodes: [], edges: [] });
    },
    duplicateSelectedNodes: () => {
      const selected = get().nodes.filter((n) => n.selected);
      if (selected.length === 0) return;
      pushHistory(get, set);
      const newNodes = selected.map((n) => {
        const newId = get().getNodeID(n.type);
        return {
          ...n,
          id: newId,
          selected: true,
          position: { x: n.position.x + 40, y: n.position.y + 40 },
          data: { ...n.data, id: newId },
        };
      });
      set({
        nodes: [
          ...get().nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
          ...newNodes,
        ],
      });
    },
    onNodesChange: (changes) => {
      const structural = changes.some(
        (c) => c.type === 'remove' || (c.type === 'position' && c.dragging === false)
      );
      if (structural) pushHistory(get, set);
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      if (changes.some((c) => c.type === 'remove')) pushHistory(get, set);
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      const edges = get().edges;
      const isDuplicate = edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle
      );
      if (isDuplicate) return;
      pushHistory(get, set);
      set({
        edges: addEdge({...connection, type: 'smoothstep', animated: true, markerEnd: {type: MarkerType.Arrow, height: '20px', width: '20px'}}, edges),
      });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
            : node
        ),
      });
    },
    pruneEdgesForNode: (nodeId, validTargetHandleIds) => {
      const edges = get().edges;
      const next = edges.filter(
        (e) => e.target !== nodeId || validTargetHandleIds.has(e.targetHandle)
      );
      // Guard: only write when an edge was actually removed. An unconditional
      // set() would produce a new array reference on every keystroke and
      // force a canvas-wide re-render for no reason.
      if (next.length !== edges.length) {
        set({ edges: next });
      }
    },
    undo: () => {
      const past = get().past;
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        past: past.slice(0, -1),
        future: [snapshot(get), ...get().future].slice(0, HISTORY_LIMIT),
        nodes: previous.nodes,
        edges: previous.edges,
      });
    },
    redo: () => {
      const future = get().future;
      if (future.length === 0) return;
      const next = future[0];
      set({
        future: future.slice(1),
        past: [...get().past, snapshot(get)].slice(-HISTORY_LIMIT),
        nodes: next.nodes,
        edges: next.edges,
      });
    },
  }));

useStore.subscribe((state) => {
  persistState(state.nodes, state.edges);
});
