// llmNode.js

import { BaseNode } from './BaseNode';

export const getLLMNodeFields = () => [
  {
    key: 'model',
    label: 'Model',
    type: 'select',
    default: 'gpt-4o',
    options: ['gpt-4o', 'gpt-4o-mini', 'claude-opus', 'claude-sonnet'],
  },
  {
    key: 'temperature',
    label: 'Temperature',
    type: 'text',
    default: '0.7',
  },
];

export const LLMNode = (props) => (
  <BaseNode
    {...props}
    title="LLM"
    category="llm"
    fields={getLLMNodeFields()}
    handles={{ inputs: ['system', 'prompt'], outputs: ['response'] }}
  />
);
