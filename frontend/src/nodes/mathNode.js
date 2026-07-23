// mathNode.js

import { BaseNode } from './BaseNode';

export const getMathNodeFields = () => [
  { key: 'operation', label: 'Operation', type: 'select', default: 'Add', options: ['Add', 'Subtract', 'Multiply', 'Divide'] },
];

export const MathNode = (props) => (
  <BaseNode
    {...props}
    title="Math"
    category="math"
    fields={getMathNodeFields()}
    handles={{ inputs: ['a', 'b'], outputs: ['result'] }}
  />
);
