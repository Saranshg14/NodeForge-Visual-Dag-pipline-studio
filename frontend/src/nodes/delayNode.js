// delayNode.js

import { BaseNode } from './BaseNode';

export const getDelayNodeFields = () => [
  { key: 'seconds', label: 'Seconds', type: 'text', default: '1' },
];

export const DelayNode = (props) => (
  <BaseNode
    {...props}
    title="Delay"
    category="delay"
    fields={getDelayNodeFields()}
    handles={{ inputs: ['trigger'], outputs: ['done'] }}
  />
);
