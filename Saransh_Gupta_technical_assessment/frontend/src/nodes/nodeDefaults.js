// nodeDefaults.js
// Single source of truth for a freshly-created node's data payload.
// Each node file exports its own field config; we derive `{ key: default }`
// from it here so defaults are computed once, at creation, and land in the
// store immediately — not lazily on first edit.

import { getInputNodeFields } from './inputNode';
import { getOutputNodeFields } from './outputNode';
import { getLLMNodeFields } from './llmNode';
import { getApiNodeFields } from './apiNode';
import { getMathNodeFields } from './mathNode';
import { getFilterNodeFields } from './filterNode';
import { getNoteNodeFields } from './noteNode';
import { getDelayNodeFields } from './delayNode';

const FIELD_GETTERS = {
  customInput: getInputNodeFields,
  customOutput: getOutputNodeFields,
  llm: getLLMNodeFields,
  api: getApiNodeFields,
  math: getMathNodeFields,
  filter: getFilterNodeFields,
  note: getNoteNodeFields,
  delay: getDelayNodeFields,
};

const defaultsFromFields = (fields = []) =>
  Object.fromEntries(fields.map((f) => [f.key, f.default ?? '']));

export const getDefaultNodeData = (type, id) => {
  if (type === 'text') {
    return { id, nodeType: type, text: '{{input}}' };
  }
  const getter = FIELD_GETTERS[type];
  const fieldDefaults = getter ? defaultsFromFields(getter(id)) : {};
  return { id, nodeType: type, ...fieldDefaults };
};
