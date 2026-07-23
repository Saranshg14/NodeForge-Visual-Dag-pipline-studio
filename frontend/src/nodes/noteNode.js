// noteNode.js

import { BaseNode } from './BaseNode';

export const getNoteNodeFields = () => [
  { key: 'note', label: 'Note', type: 'textarea', default: 'Leave a note...', rows: 3 },
];

export const NoteNode = (props) => (
  <BaseNode
    {...props}
    title="Note"
    category="note"
    fields={getNoteNodeFields()}
  />
);
