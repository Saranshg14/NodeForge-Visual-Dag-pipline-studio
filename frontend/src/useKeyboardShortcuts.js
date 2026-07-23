// useKeyboardShortcuts.js
// Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redo, Ctrl/Cmd+D duplicate
// selected node(s). Disabled while focus is inside an editable field so it
// never fights the browser's native text-undo.

import { useEffect } from 'react';
import { useStore } from './store';

const isEditableTarget = () => {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handler = (e) => {
      if (isEditableTarget()) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useStore.getState().undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        useStore.getState().redo();
      } else if (key === 'd') {
        e.preventDefault();
        useStore.getState().duplicateSelectedNodes();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
};
