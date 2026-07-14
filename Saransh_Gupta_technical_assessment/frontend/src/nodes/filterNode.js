// filterNode.js

import { BaseNode } from './BaseNode';

export const getFilterNodeFields = () => [
  { key: 'condition', label: 'Condition', type: 'text', default: 'value > 0' },
];

export const FilterNode = (props) => (
  <BaseNode
    {...props}
    title="Filter"
    category="filter"
    fields={getFilterNodeFields()}
    handles={{ inputs: ['in'], outputs: ['out'] }}
  />
);
