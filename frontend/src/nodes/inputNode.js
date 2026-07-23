// inputNode.js

import { BaseNode } from './BaseNode';

export const getInputNodeFields = (id) => [
  {
    key: 'inputName',
    label: 'Name',
    type: 'text',
    default: id.replace('customInput-', 'input_'),
  },
  {
    key: 'inputType',
    label: 'Type',
    type: 'select',
    default: 'Text',
    options: ['Text', 'File'],
  },
];

export const InputNode = (props) => (
  <BaseNode
    {...props}
    title="Input"
    category="input"
    fields={getInputNodeFields(props.id)}
    handles={{ outputs: ['value'] }}
  />
);
