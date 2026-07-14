// outputNode.js

import { BaseNode } from './BaseNode';

export const getOutputNodeFields = (id) => [
  {
    key: 'outputName',
    label: 'Name',
    type: 'text',
    default: id.replace('customOutput-', 'output_'),
  },
  {
    key: 'outputType',
    label: 'Type',
    type: 'select',
    default: 'Text',
    options: ['Text', 'Image'],
  },
];

export const OutputNode = (props) => (
  <BaseNode
    {...props}
    title="Output"
    category="output"
    fields={getOutputNodeFields(props.id)}
    handles={{ inputs: ['value'] }}
  />
);
