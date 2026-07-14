# VectorShift Assessment — Exact Task Breakdown

> Comparison of assessment requirements vs. current codebase state across all 4 parts.

---

## Part 1 — Node Abstraction

### What the Assessment Says
> Create an abstraction for nodes that speeds up creating new nodes and applying styles. Then make **5 new nodes** of your choosing to demonstrate how it works.

### What the Codebase Currently Has
Each of the 4 existing nodes is a completely standalone React component that **repeats the same boilerplate**:

| Repeated Element | In Which Files |
|---|---|
| `import { useState } from 'react'` | inputNode, outputNode, textNode |
| `import { Handle, Position } from 'reactflow'` | ALL 4 nodes |
| `<div style={{width: 200, height: 80, border: '1px solid black'}}>` | ALL 4 nodes |
| Node title `<span>` label block | ALL 4 nodes |
| Handle placement logic | ALL 4 nodes |

The only differences between nodes are:
- The **title label** (Input / Output / LLM / Text)
- The **internal fields** (name input, type select, textarea, static label)
- The **number and type of Handles** (source/target) and their IDs and positions

There is **no shared base component, no abstraction layer, no factory function, no HOC**.

### What Needs to Be Built

#### Step A — Create a `BaseNode` component (`src/nodes/BaseNode.js`)
A reusable wrapper that accepts props and renders:
```
BaseNode({
  id,            // node id from ReactFlow
  label,         // e.g. "LLM"
  fields,        // array of { type: 'text'|'select'|'textarea', name, label, options }
  handles: {
    inputs: [{ id: 'system', position: '33%' }, { id: 'prompt', position: '67%' }],
    outputs: [{ id: 'response' }]
  }
})
```
Responsibilities of `BaseNode`:
- Renders the node shell (border, title, styling)
- Renders all input fields (using `store.updateNodeField` on change)
- Renders all Handles at the correct positions
- Applies consistent styling across all nodes

#### Step B — Refactor all 4 existing nodes to use `BaseNode`
Each existing node becomes a thin config wrapper:
```js
// llmNode.js  — after refactoring
import { BaseNode } from './BaseNode';
export const LLMNode = (props) => (
  <BaseNode
    {...props}
    label="LLM"
    handles={{ inputs: ['system', 'prompt'], outputs: ['response'] }}
  />
);
```

#### Step C — Create 5 new nodes using the abstraction
Examples of what 5 new nodes could be (you choose):

| Node | Inputs | Outputs | Fields |
|---|---|---|---|
| `API` | prompt | response | URL, method (GET/POST) |
| `Conditional` | value | true, false | condition expression |
| `Note` | — | — | read-only text label |
| `Transform` | input | output | transformation script |
| `FileLoader` | — | content | file path input |

Each new node should be ~5-10 lines using `BaseNode`.

#### Step D — Register new node types
In `ui.js`, add new types to the `nodeTypes` map:
```js
const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  // NEW:
  apiCall: APINode,
  conditional: ConditionalNode,
  note: NoteNode,
  transform: TransformNode,
  fileLoader: FileLoaderNode,
};
```
And in `toolbar.js`, add `DraggableNode` entries for each.

---

## Part 2 — Styling

### What the Assessment Says
> Style the various components into an **appealing, unified design**. You are free to create your own design. Use whatever React packages/libraries you like.

### What the Codebase Currently Has
The codebase has essentially **zero styling**:

| Component | Current Style |
|---|---|
| All 4 nodes | `border: '1px solid black'`, fixed `200×80px`, no theming |
| Toolbar | `padding: '10px'`, plain `flexWrap` |
| DraggableNode chips | `backgroundColor: '#1C2536'` with white text — the only real styling |
| Canvas | Default ReactFlow light theme |
| SubmitButton | Browser-default `<button>` |
| `index.css` | Only sets font family, nothing else |

### What Needs to Be Built

#### Global Design System (`index.css` or a new `theme.css`)
- Define CSS variables: `--bg-primary`, `--node-bg`, `--accent`, `--border-color`, `--text-primary`
- Dark theme base (matches VectorShift's dark UI or custom dark palette)
- Typography: import a Google Font (e.g., Inter)

#### Toolbar (`toolbar.js`)
- Styled toolbar bar with background, padding, border-bottom
- DraggableNode chips: icon + label, color-coded per node type, hover/active states

#### Node Components (via `BaseNode`)
- Styled card: rounded corners, drop shadow, gradient header strip per node type
- Color-coded accent per category:
  - Input → blue
  - Output → green
  - LLM → purple
  - Text → orange
- Styled form fields inside nodes (no raw browser inputs)
- Handle dots: colored, with hover tooltip

#### Canvas
- Dark background on `<ReactFlow>` via `className` or prop
- Styled `<Background>` (dots/lines on dark)
- Styled MiniMap (dark theme)
- Custom `<Controls>` button styles

#### Submit Button
- Centered, pill-shaped button with gradient, hover animation
- Loading state while waiting for backend response

---

## Part 3 — Text Node Logic

### What the Assessment Says
> **Sub-task A:** Width and height of the Text node should change as the user types more text.  
> **Sub-task B:** When a user types `{{ variableName }}` (a valid JS identifier inside double curly braces), create a new **Handle on the left side** of the Text node for that variable.

### What the Codebase Currently Has

`textNode.js` currently:
```js
const [currText, setCurrText] = useState(data?.text || '{{input}}');
// Single <input type="text"> — fixed width, no resize logic
// One fixed <Handle type="source" position={Position.Right} id={`${id}-output`} />
// No variable parsing whatsoever
```

**Both sub-tasks are completely missing.**

### What Needs to Be Built

#### Sub-task A — Dynamic Resize

Change the `<input type="text">` to a `<textarea>`:
```js
<textarea
  value={currText}
  onChange={handleTextChange}
  style={{
    width: `${Math.max(200, currText.length * 8)}px`,  // grows with content
    minHeight: '80px',
    resize: 'none',  // disable manual resize; we control it
  }}
  rows={currText.split('\n').length}
/>
```
And make the outer node `<div>` width/height dynamic (or use `width: 'fit-content'`).

The node container width must also be updated in Zustand via `updateNodeField` so ReactFlow knows the true dimensions.

#### Sub-task B — Variable Handle Extraction

Regex to detect variables: `/\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g`

When `currText` changes:
1. Run regex → extract all unique variable names
2. `useState` to track `variables: string[]`
3. For each unique variable, render a `<Handle type="target" position={Position.Left} id={`${id}-${varName}`} />`
4. Handles should be **evenly spaced vertically** on the left side

```js
const extractVariables = (text) => {
  const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
  const vars = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) vars.add(match[1]);
  return [...vars];
};

// In the component:
const [variables, setVariables] = useState(extractVariables(currText));

const handleTextChange = (e) => {
  const newText = e.target.value;
  setCurrText(newText);
  setVariables(extractVariables(newText));
};

// In JSX:
{variables.map((v, i) => (
  <Handle
    key={v}
    type="target"
    position={Position.Left}
    id={`${id}-${v}`}
    style={{ top: `${((i + 1) / (variables.length + 1)) * 100}%` }}
  />
))}
```

**Edge case to handle:** If a variable is removed from the text, its Handle disappears — any edges connected to it in ReactFlow must be cleaned up from the store.

---

## Part 4 — Backend Integration

### What the Assessment Says
> - **Frontend:** `submit.js` sends `nodes` + `edges` to `POST /pipelines/parse` when clicked
> - **Backend:** Endpoint returns `{ num_nodes: int, num_edges: int, is_dag: bool }`
> - **Frontend:** Show an alert with those values in a user-friendly way

### What the Codebase Currently Has

**Frontend — `submit.js`:**
```js
// Currently: a plain <button> with NO onClick, NO store connection
export const SubmitButton = () => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <button type="submit">Submit</button>
  </div>
);
```

**Backend — `main.py`:**
```python
# Currently: a GET route (wrong method), Form parameter (wrong for a GET),
# returns a hardcoded stub
@app.get('/pipelines/parse')
def parse_pipeline(pipeline: str = Form(...)):
    return {'status': 'parsed'}
```

**Both sides are stubs. Nothing works.**

### What Needs to Be Built

#### Backend (`main.py`) — Full Implementation

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# CORS is required — frontend (localhost:3000) calls backend (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Node(BaseModel):
    id: str

class Edge(BaseModel):
    source: str
    target: str

class Pipeline(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    # Build adjacency list and in-degree map
    graph = {n.id: [] for n in nodes}
    in_degree = {n.id: 0 for n in nodes}
    for edge in edges:
        if edge.source in graph and edge.target in graph:
            graph[edge.source].append(edge.target)
            in_degree[edge.target] += 1
    # Kahn's Algorithm (topological sort via BFS)
    queue = [n for n in in_degree if in_degree[n] == 0]
    visited = 0
    while queue:
        node = queue.pop(0)
        visited += 1
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return visited == len(nodes)  # True if no cycle

@app.post('/pipelines/parse')
def parse_pipeline(pipeline: Pipeline):
    return {
        'num_nodes': len(pipeline.nodes),
        'num_edges': len(pipeline.edges),
        'is_dag': is_dag(pipeline.nodes, pipeline.edges),
    }
```

**Key fix:** Change from `GET` → `POST`, remove `Form`, add CORS middleware, implement real DAG detection.

#### Frontend (`submit.js`) — Full Implementation

```js
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

export const SubmitButton = () => {
  const { nodes, edges } = useStore(
    (state) => ({ nodes: state.nodes, edges: state.edges }),
    shallow
  );

  const handleSubmit = async () => {
    const payload = {
      nodes: nodes.map((n) => ({ id: n.id })),
      edges: edges.map((e) => ({ source: e.source, target: e.target })),
    };

    try {
      const response = await fetch('http://localhost:8000/pipelines/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      alert(
        `Pipeline Analysis\n\n` +
        `Nodes: ${result.num_nodes}\n` +
        `Edges: ${result.num_edges}\n` +
        `Is DAG: ${result.is_dag ? 'Yes ✅' : 'No ❌'}`
      );
    } catch (err) {
      alert('Failed to connect to backend.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

---

## Summary Table

| Part | Current State | Gap | Effort |
|---|---|---|---|
| **1 — Node Abstraction** | 4 isolated components, 100% code duplication | Create `BaseNode`, refactor 4 nodes, add 5 new nodes | 🟡 Medium |
| **2 — Styling** | Zero styling on canvas/nodes/toolbar/button | Full design system from scratch | 🔴 High |
| **3 — Text Node Logic** | Fixed-size input, no variable parsing | Dynamic resize + regex variable extraction + dynamic Handles | 🟡 Medium |
| **4 — Backend Integration** | Both frontend and backend are dead stubs | Wire frontend fetch, fix backend route, add CORS, implement DAG | 🟢 Straightforward |

## Recommended Build Order

```
Part 1 (BaseNode)  →  Part 3 (Text Node)  →  Part 4 (Backend)  →  Part 2 (Styling)
```
