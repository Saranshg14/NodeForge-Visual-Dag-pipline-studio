// apiNode.js

import { BaseNode } from './BaseNode';

export const getApiNodeFields = () => [
  { key: 'url', label: 'URL', type: 'text', default: 'https://' },
  { key: 'method', label: 'Method', type: 'select', default: 'GET', options: ['GET', 'POST', 'PUT', 'DELETE'] },
];

export const ApiNode = (props) => (
  <BaseNode
    {...props}
    title="API"
    category="api"
    fields={getApiNodeFields()}
    handles={{ inputs: ['body'], outputs: ['response'] }}
  />
);
