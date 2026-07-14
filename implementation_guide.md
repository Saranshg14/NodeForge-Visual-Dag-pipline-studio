# VectorShift Frontend Assessment — Implementation Guide

## Context

This is the **VectorShift Frontend Technical Assessment**: a React (Create React App + ReactFlow + Zustand) visual pipeline builder with a FastAPI backend. The scaffold provides 4 duplicated node components, near-zero styling, a dead Submit button, and a stub backend endpoint. The assessment has four parts: (1) node abstraction, (2) styling, (3) text-node logic, (4) backend integration.

**Deliverable for this task:** a written, step-by-step implementation guide only — no changes to the actual source files. This document *is* that guide. Styling uses **plain CSS with custom properties** (no new dependencies, no build changes — the right call for an assessment graded on clarity and speed).

**Verified current state (read from source, not just the analysis docs):**
- All 4 nodes duplicate `<div style={{width:200,height:80,border:'1px solid black'}}>` + title + handles. No shared component.
- `inputNode`/`outputNode`/`textNode` keep field values in **local `useState` and never call `store.updateNodeField`** → node data is not persisted to the store. Not fatal for Part 4 (backend needs only ids/source/target) but a real correctness gap the abstraction should fix.
- [ui.js:93](frontend/frontend/src/ui.js#L93): typo `width: '100wv'` → should be `100vw`.
- Frontend runs on **port 3001** in this environment (`$env:PORT=3001; npm start`), default CRA is 3000. CORS must cover both.
- Stack: React 18.2, reactflow 11.8.3, zustand (available directly), react-scripts 5. Backend: FastAPI (needs `uvicorn`, CORS middleware).

**Recommended build order:** Part 1 (abstraction) → Part 3 (text node, exercises the abstraction) → Part 4 (backend, testable in isolation) → Part 2 (styling, done last so you style final components).

---

## Part 1 — Node Abstraction

### Goal
One `BaseNode` component driven by a declarative config; each concrete node becomes a ~5–10 line wrapper. Fixes the state-sync gap so all fields persist to the store.

### Step 1.1 — Create `src/nodes/BaseNode.js`
A config-driven shell that renders title, fields, and handles, and writes every field change to the Zustand store.

```jsx
// src/nodes/BaseNode.js
import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import './BaseNode.css';

/**
 * @param {{
 *   id: string,
 *   data: object,
 *   title: string,
 *   category?: string,          // drives the accent color (Part 2)
 *   fields?: Array<{ key:string, label:string, type:'text'|'select'|'textarea',
 *                    default?:any, options?:string[] }>,
 *   handles?: { inputs?: Array<string|{id:string}>, outputs?: Array<string|{id:string}> },
 *   children?: React.ReactNode  // escape hatch for bespoke nodes (e.g. Text node)
 * }} props
 */
export const BaseNode = ({ id, data, title, category = 'default', fields = [], handles = {}, children }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  const onFieldChange = useCallback(
    (key) => (e) => updateNodeField(id, key, e.target.value),
    [id, updateNodeField]
  );

  const inputs = normalizeHandles(handles.inputs);
  const outputs = normalizeHandles(handles.outputs);

  return (
    <div className={`vs-node vs-node--${category}`}>
      {inputs.map((h, i) => (
        <Handle key={h.id} type="target" position={Position.Left}
          id={`${id}-${h.id}`} style={{ top: verticalPct(i, inputs.length) }} />
      ))}

      <div className="vs-node__header">{title}</div>

      <div className="vs-node__body">
        {fields.map((f) => (
          <label key={f.key} className="vs-node__field">
            <span className="vs-node__field-label">{f.label}</span>
            {renderControl(f, data, onFieldChange)}
          </label>
        ))}
        {children}
      </div>

      {outputs.map((h, i) => (
        <Handle key={h.id} type="source" position={Position.Right}
          id={`${id}-${h.id}`} style={{ top: verticalPct(i, outputs.length) }} />
      ))}
    </div>
  );
};

// --- helpers ---
const normalizeHandles = (arr = []) => arr.map((h) => (typeof h === 'string' ? { id: h } : h));
const verticalPct = (i, n) => `${((i + 1) / (n + 1)) * 100}%`;

const renderControl = (f, data, onFieldChange) => {
  const value = data?.[f.key] ?? f.default ?? '';
  if (f.type === 'select') {
    return (
      <select className="vs-input" value={value} onChange={onFieldChange(f.key)}>
        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === 'textarea') {
    return <textarea className="vs-input" value={value} onChange={onFieldChange(f.key)} />;
  }
  return <input className="vs-input" type="text" value={value} onChange={onFieldChange(f.key)} />;
};
```

**Key decisions & rationale**
- **Config over inheritance.** Nodes describe *what* they contain (fields/handles); `BaseNode` owns *how* it renders. Adding a node = writing config, not JSX.
- **Store as source of truth.** Reading `value` from `data` and writing via `updateNodeField` fixes the local-`useState` gap — every field is serialized on submit and survives node moves/re-renders.
- **`children` escape hatch.** The Text node (Part 3) needs custom behavior; passing `children` lets it reuse the shell without forcing everything through config.
- **Even handle spacing** via `verticalPct((i+1)/(n+1))` — matches the existing LLM node's `100/3`, `200/3` pattern generically.

**Pitfalls**
- Selecting the whole store object causes re-renders on every change. Select **one action** (`useStore((s)=>s.updateNodeField)`) — a stable function reference, no `shallow` needed.
- `updateNodeField` in the current store **mutates `node.data` in place** ([store.js:47](frontend/frontend/src/store.js#L47)) before spreading. It works because a new `nodes` array is returned, but for cleanliness prefer `return {...node, data:{...node.data,[fieldName]:fieldValue}}`. Note this as a one-line store improvement.

### Step 1.2 — Refactor the 4 existing nodes
Each becomes a thin config wrapper. Example:

```jsx
// src/nodes/inputNode.js
import { BaseNode } from './BaseNode';
export const InputNode = (props) => (
  <BaseNode {...props} title="Input" category="input"
    fields={[
      { key: 'inputName', label: 'Name', type: 'text',
        default: props.id.replace('customInput-', 'input_') },
      { key: 'inputType', label: 'Type', type: 'select', default: 'Text', options: ['Text', 'File'] },
    ]}
    handles={{ outputs: ['value'] }} />
);
```

```jsx
// src/nodes/llmNode.js
import { BaseNode } from './BaseNode';
export const LLMNode = (props) => (
  <BaseNode {...props} title="LLM" category="llm"
    handles={{ inputs: ['system', 'prompt'], outputs: ['response'] }}>
    <p className="vs-node__note">This is a LLM.</p>
  </BaseNode>
);
```
`outputNode.js` mirrors input (`title="Output"`, `outputName`/`outputType`, `handles={{inputs:['value']}}`). Handle IDs stay `${id}-value`, `${id}-system`, etc. — **preserving existing edge-ID conventions so no connections break.**

### Step 1.3 — Create 5 new nodes (demonstrate flexibility)
Each is 5–10 lines, proving the abstraction:

```jsx
// src/nodes/apiNode.js
export const ApiNode = (p) => (<BaseNode {...p} title="API" category="api"
  fields={[{key:'url',label:'URL',type:'text',default:'https://'},
           {key:'method',label:'Method',type:'select',default:'GET',options:['GET','POST','PUT','DELETE']}]}
  handles={{ inputs:['body'], outputs:['response'] }} />);
```
Plus **Math** (fields: operation select; inputs a,b; output result), **Filter** (field: condition text; input in; output out), **Note** (field: textarea note; no handles), **Delay** (field: seconds text; input trigger; output done). Each ~1 config block — this is the point the assessment wants you to showcase.

### Step 1.4 — Register everything
```js
// ui.js — nodeTypes
const nodeTypes = {
  customInput: InputNode, llm: LLMNode, customOutput: OutputNode, text: TextNode,
  api: ApiNode, math: MathNode, filter: FilterNode, note: NoteNode, delay: DelayNode,
};
```
```jsx
// toolbar.js — add a DraggableNode per new type (type must match nodeTypes key)
<DraggableNode type='api' label='API' />   {/* …math, filter, note, delay */}
```

### Verification (Part 1)
- Drag each of the 9 chips → node renders with correct title, fields, handles.
- Type in a field, drag the node elsewhere, type again → value persists (proves store sync).
- Connect handles between old and new nodes → edges form (proves handle IDs intact).
- Console clean (F12).

---

## Part 3 — Text Node Logic

### Goal
(A) Text node grows with content. (B) `{{ validVar }}` in the text spawns a left-side target Handle per unique variable; removed variables drop their handles **and** their dangling edges.

### Step 3.1 — Auto-resize + variable extraction
Use the `BaseNode` shell via `children`, manage text locally *and* mirror to the store, auto-grow the textarea, and derive handles from the text.

```jsx
// src/nodes/textNode.js
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { BaseNode } from './BaseNode';

const VAR_RE = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

const extractVariables = (text) => {
  const vars = new Set();
  let m;
  while ((m = VAR_RE.exec(text)) !== null) vars.add(m[1]);
  return [...vars];
};

export const TextNode = ({ id, data }) => {
  const currText = data?.text ?? '{{input}}';
  const updateNodeField = useStore((s) => s.updateNodeField);
  const pruneEdgesForNode = useStore((s) => s.pruneEdgesForNode); // added in 3.2
  const taRef = useRef(null);

  const variables = useMemo(() => extractVariables(currText), [currText]);

  const onChange = useCallback((e) => {
    updateNodeField(id, 'text', e.target.value);
  }, [id, updateNodeField]);

  // Auto-grow height; width handled by CSS (see below)
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [currText]);

  // Clean up edges whose target handle no longer exists (namespaced ids — see below)
  useEffect(() => {
    const valid = new Set(variables.map((v) => `${id}-var-${v}`));
    pruneEdgesForNode(id, valid);
  }, [id, variables, pruneEdgesForNode]);

  return (
    <BaseNode id={id} data={data} title="Text" category="text"
      handles={{ outputs: ['output'] }}>
      <textarea ref={taRef} className="vs-input vs-textarea"
        value={currText} onChange={onChange} rows={1} spellCheck={false} />
      {variables.map((v, i) => (
        <Handle key={v} type="target" position={Position.Left}
          id={`${id}-var-${v}`}   /* namespaced so it can never collide with a fixed handle */
          style={{ top: `${((i + 1) / (variables.length + 1)) * 100}%` }} />
      ))}
    </BaseNode>
  );
};
```

Width growth via CSS on the node (content-driven, capped):
```css
/* BaseNode.css */
.vs-node--text { width: max-content; min-width: 220px; max-width: 420px; }
.vs-textarea  { width: 100%; min-height: 60px; resize: none; overflow: hidden;
                white-space: pre-wrap; word-break: break-word; font-family: inherit; }
```

**Key decisions & rationale**
- **`scrollHeight` auto-grow** is the standard, jank-free height technique: reset to `auto`, then set to `scrollHeight`. Runs in `useEffect` after paint so measurement is correct.
- **Width via CSS `max-content` + `max-width`** instead of `text.length * 8px` math (which breaks on multi-line and wide glyphs). Let the browser measure.
- **Text mirrored to the store** (not local `useState`) so variable-derived handles and the pipeline payload stay consistent.
- **`useMemo` on extraction** avoids re-parsing on unrelated renders; the shared `VAR_RE` is reset by `.exec` looping to completion each call (always run the loop to exhaustion — see pitfall).

**Pitfalls**
- **Stateful regex.** A `/g` regex retains `lastIndex`. Only safe if every use runs the `while` loop to completion (it does here). Never `VAR_RE.test()` it midway.
- **Duplicate variables** (`{{x}} … {{x}}`) must yield **one** handle → `Set` dedups.
- **Invalid names** (`{{ 1x }}`, `{{ a-b }}`) must be ignored → the identifier regex already excludes them.
- **Handle removal orphans edges.** ReactFlow does not auto-delete an edge when its handle disappears; the edge points at a non-existent handle and renders oddly. Hence `pruneEdgesForNode` (3.2).
- **Handle-id collision (critical).** The node's fixed output uses id `${id}-output`. A user typing `{{ output }}` would generate a variable handle with the *same* id, corrupting ReactFlow's handle routing. **Namespace variable handles as `${id}-var-${v}`** (done above) so the variable space can never intersect fixed handles. The prune effect's `valid` set must use the same `-var-` prefix.
- Editing default `{{input}}` should immediately reflect a handle named `input` on first render — with namespacing its id is `${id}-var-input`. Initializing `data.text` to `{{input}}` covers first render.

### Step 3.2 — Store: edge pruning (with no-op guard)
```js
// store.js — add to the store object
pruneEdgesForNode: (nodeId, validTargetHandleIds) => {
  const edges = get().edges;
  const next = edges.filter(
    (e) => e.target !== nodeId || validTargetHandleIds.has(e.targetHandle)
  );
  // Guard: only write when an edge was actually removed. A new array reference
  // would otherwise re-render the whole canvas on every keystroke.
  if (next.length !== edges.length) set({ edges: next });
},
```

**Why this instead of debouncing.** The per-keystroke cost is not the O(E) filter (pipelines are small); it's that an unconditional `set({edges})` produces a *new array reference every keystroke*, forcing ReactFlow and every `edges` subscriber to re-render. The length guard makes typing plain text a true no-op (no `set()`, no re-render) while still removing edges the instant a variable's handle disappears — **dependency-free and faster than a `lodash.debounce` wrapper**, which would only delay the same wasteful writes and add a package.

### Verification (Part 3)
- Type multiple lines → node height grows; long line → width grows to the 420px cap then wraps.
- Type `{{ a }} {{ b }}` → two left handles appear, evenly spaced; `{{a}}{{a}}` → one handle.
- Connect an edge into `{{a}}`, then delete `a` from the text → handle disappears **and** the edge is removed (check store/canvas).
- `{{ 1bad }}` produces no handle.

---

## Part 4 — Backend Integration

### Goal
Submit serializes nodes+edges → `POST /pipelines/parse` → backend returns `{num_nodes, num_edges, is_dag}` → user-friendly alert.

### Step 4.1 — Backend `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from collections import deque, defaultdict

app = FastAPI()

# Regex covers localhost:3000 AND 3001 (this env) without listing each port.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
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
    ids = {n.id for n in nodes}
    graph = defaultdict(list)
    indegree = {nid: 0 for nid in ids}
    for e in edges:
        if e.source in ids and e.target in ids:   # ignore edges to unknown nodes
            graph[e.source].append(e.target)
            indegree[e.target] += 1
    queue = deque([nid for nid in ids if indegree[nid] == 0])
    visited = 0
    while queue:
        cur = queue.popleft()
        visited += 1
        for nxt in graph[cur]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return visited == len(ids)  # all visited ⇒ no cycle ⇒ DAG

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

@app.post('/pipelines/parse')
def parse_pipeline(pipeline: Pipeline):
    return {
        'num_nodes': len(pipeline.nodes),
        'num_edges': len(pipeline.edges),
        'is_dag': is_dag(pipeline.nodes, pipeline.edges),
    }
```

**Key decisions & rationale**
- **GET→POST + Pydantic body** replaces the broken `Form(...)` GET. Pydantic validates the JSON shape and returns 422 on malformed input automatically.
- **Kahn's algorithm** (BFS topological sort). O(V+E), no recursion depth limit (DFS could hit Python's recursion cap on large graphs). `visited == len(ids)` is the cycle test.
- **`allow_origin_regex`** solves the 3000-vs-3001 mismatch in one line — no hardcoded port drift.
- **Empty graph is a DAG** (0 nodes, 0 edges → `visited==0==len` → `True`), which is correct and avoids a special case.

**Pitfalls**
- **Missing CORS = silent failure**: the browser blocks the response and `fetch` throws a generic `TypeError`. This is the #1 gotcha — add the middleware first.
- **Self-loop** (`source==target`) is a cycle: indegree of that node never hits 0 → correctly reported non-DAG.
- Don't count only reachable nodes — indegree map is keyed on **all** node ids so isolated nodes still count and still make `visited==len(ids)` meaningful.
- **Node count vs. unique ids.** `num_nodes = len(pipeline.nodes)` is the literal node count, while `is_dag` dedupes via `ids = {n.id for n in nodes}`. These could diverge only if the payload contained duplicate ids — which cannot happen because the frontend's `getNodeID` ([store.js:14](frontend/frontend/src/store.js#L14)) issues collision-free `${type}-${n}` ids. Left as-is intentionally; no defensive branch for an unreachable state.

### Step 4.2 — Frontend `submit.js`
```jsx
// src/submit.js
import { useState } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const SubmitButton = () => {
  const { nodes, edges } = useStore(
    (s) => ({ nodes: s.nodes, edges: s.edges }), shallow
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (nodes.length === 0) { alert('Add at least one node before submitting.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({ id: n.id })),
          edges: edges.map((e) => ({ source: e.source, target: e.target })),
        }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const { num_nodes, num_edges, is_dag } = await res.json();
      alert(
        `Pipeline Analysis\n\n` +
        `• Nodes: ${num_nodes}\n` +
        `• Edges: ${num_edges}\n` +
        `• Valid DAG: ${is_dag ? 'Yes ✅' : 'No — contains a cycle ❌'}`
      );
    } catch (err) {
      alert(`Could not reach the backend.\n${err.message}\n\nIs uvicorn running on :8000?`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vs-submit-bar">
      <button className="vs-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Analyzing…' : 'Submit Pipeline'}
      </button>
    </div>
  );
};
```

**Key decisions & rationale**
- **`type="submit"` removed** — it was pointless with no `<form>`; an explicit `onClick` is correct.
- **Loading + disabled state** prevents double-submits and gives feedback (production nicety).
- **`res.ok` check** distinguishes network failure from 4xx/5xx; the `catch` message names the most likely cause (backend down / CORS).
- **`REACT_APP_API_URL` env override** so the URL isn't hardcoded for deployment.
- **Send only `{id}` / `{source,target}`** — the minimal contract the backend validates; smaller payload, no leaking of UI state.

**Pitfalls**
- Selecting `{nodes, edges}` as an object **requires `shallow`**, or the component re-renders every store tick.
- Backend must be running *before* clicking; the catch message says so.

### Verification (Part 4)
- Backend: open `http://localhost:8000/docs`, POST a sample body to `/pipelines/parse`, confirm the shape.
- Frontend: build Input→LLM→Output, Submit → alert shows 3 nodes / 2 edges / DAG ✅.
- Draw a cycle (A→B→A) → alert shows DAG ❌.
- Stop uvicorn, Submit → friendly error alert (no console crash).

---

## Part 2 — Styling (last)

### Goal
Cohesive dark design system in plain CSS variables; category-accented node cards; styled toolbar, canvas, handles, and submit button. Zero new dependencies.

### Step 2.1 — Design tokens in `src/index.css`
```css
:root {
  --bg-canvas:#0f1117; --bg-panel:#161a24; --node-bg:#1e2233;
  --border:#2b3145; --text:#e6e9f0; --text-dim:#9aa3b8;
  --accent:#6d5efc;
  --c-input:#4c8dff; --c-llm:#a855f7; --c-output:#22c55e;
  --c-text:#f59e0b; --c-api:#06b6d4; --c-default:#64748b;
  --radius:10px; --shadow:0 4px 14px rgba(0,0,0,.35);
}
body { background:var(--bg-canvas); color:var(--text); }
```

### Step 2.2 — `src/nodes/BaseNode.css`
```css
.vs-node { width:220px; background:var(--node-bg); border:1px solid var(--border);
  border-radius:var(--radius); box-shadow:var(--shadow); font-size:13px; overflow:hidden; }
.vs-node__header { padding:8px 12px; font-weight:600; color:#fff;
  background:var(--accent); border-bottom:1px solid var(--border); }
.vs-node--input  .vs-node__header{ background:var(--c-input); }
.vs-node--llm    .vs-node__header{ background:var(--c-llm); }
.vs-node--output .vs-node__header{ background:var(--c-output); }
.vs-node--text   .vs-node__header{ background:var(--c-text); }
.vs-node--api    .vs-node__header{ background:var(--c-api); }
.vs-node__body { padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
.vs-node__field { display:flex; flex-direction:column; gap:3px; }
.vs-node__field-label { color:var(--text-dim); font-size:11px; text-transform:uppercase; letter-spacing:.4px; }
.vs-input { background:#0f1320; color:var(--text); border:1px solid var(--border);
  border-radius:6px; padding:6px 8px; font-size:13px; outline:none; }
.vs-input:focus { border-color:var(--accent); box-shadow:0 0 0 2px rgba(109,94,252,.25); }
.react-flow__handle { width:10px; height:10px; background:var(--accent); border:2px solid var(--node-bg); }
```
Map `category` → CSS class via the `vs-node--${category}` already emitted by `BaseNode`.

### Step 2.3 — Toolbar, canvas, submit
- **`toolbar.js`**: give the outer `div` `className="vs-toolbar"`; style as a sticky panel (`background:var(--bg-panel)`, `border-bottom`, padding). Color each chip by node type via the existing `className={type}` on `DraggableNode` (e.g. `.customInput{background:var(--c-input)}`). Add hover lift `transform:translateY(-1px)`.
- **`ui.js`**: fix `100wv`→`100vw`; set `<ReactFlow className="vs-canvas">`, style `Background`/`MiniMap`/`Controls` dark (`.react-flow__minimap{background:var(--bg-panel)}`, `.react-flow__controls-button{...}`).
- **`submit.js`**: `.vs-submit-bar` centers; `.vs-submit-btn` = gradient pill (`background:linear-gradient(...)`), hover scale, `:disabled{opacity:.6;cursor:not-allowed}`.

**Key decisions & rationale**
- **CSS custom properties** = one place to retheme; category colors reused by both nodes and toolbar chips → visual consistency for free.
- **Class-based, not inline styles** → separation of concerns, hover/focus states possible, no re-render cost.
- Reuse ReactFlow's own class names (`.react-flow__handle`, `__minimap`) to theme the library without forking it.

**Pitfalls**
- `import './BaseNode.css'` inside `BaseNode.js` (CRA supports it) — don't forget or nodes render unstyled.
- Keep node `overflow:hidden` off the Text node’s auto-grow (it already uses `--text` width rules); use `.vs-node--text{overflow:visible}` if the cap clips handles.
- Test light-vs-dark contrast; all tokens here assume dark canvas.

### Verification (Part 2)
- Every node type shows its accent header; fields are dark, focus ring appears.
- Toolbar chips color-coded, hover animates; canvas/minimap/controls dark; submit button is a gradient pill with disabled state during load.
- Full flow still works end-to-end after styling (styling is presentation-only).

---

## Cross-Cutting: Setup, Dependencies, Run

**Dependencies to add:** none for frontend (plain CSS, zustand already present). Backend: ensure `fastapi`, `uvicorn` installed (`pip install fastapi uvicorn`). CORS middleware ships with FastAPI.

**Run (two terminals):**
```powershell
# Frontend
cd "C:\Users\saran\OneDrive\Desktop\Vertor shift\frontend\frontend"; $env:PORT=3001; npm start
# Backend
cd "C:\Users\saran\OneDrive\Desktop\Vertor shift\backend\backend"; python -m uvicorn main:app --reload
```

**Final end-to-end verification (all parts cohesive):**
1. App loads styled at `http://localhost:3001`; 9 toolbar chips.
2. Drag Input, Text, LLM, Output; type `{{prompt}}` in Text → left handle appears, node grew.
3. Connect Text.output → LLM.prompt → Output.value; edit fields (persist on move).
4. Submit → alert: correct node/edge counts, DAG ✅. Add a back-edge → DAG ❌.
5. F12 console clean; stop backend → friendly error alert.

**Optional production hardening to mention:** `PropTypes` on `BaseNode`, a `.env` for `REACT_APP_API_URL`, memoizing `nodeTypes` outside render (already module-scoped), and a store selector for `updateNodeField` to avoid whole-store subscriptions.

---

## Technical Review Response

This guide was independently reviewed (`technical_review.md`). Triage of the recommendations:

**Accepted (folded into the guide above):**
- **Handle namespace isolation** *(was CRITICAL)* → variable handles are now `${id}-var-${v}` (Part 3, Step 3.1), eliminating the `{{output}}`-vs-fixed-output collision.
- **Prune performance** *(was HIGH — suggested debounce)* → implemented as a **no-op guard** in `pruneEdgesForNode` (Part 3, Step 3.2) instead of a `lodash.debounce`. It stops per-keystroke canvas re-renders at the source, dependency-free.

**Rejected, with rationale:**
- **Composition over config** *(MEDIUM)* → the assessment explicitly rewards the *efficiency* of the abstraction (5–10-line nodes). Config-driven `BaseNode` is exactly that; the `children` escape hatch already covers bespoke nodes (Text). Switching to `<BaseNode><Field/>…</BaseNode>` would make every node longer and weaken the graded property. Kept config-driven.
- **Toast instead of `alert()`** *(LOW)* → the spec literally requires *"create an alert… display num_nodes, num_edges, and is_dag"*. `alert()` satisfies the graded behavior with zero dependencies. A toast (`sonner`/`react-hot-toast`) is noted as optional polish only, not adopted.
- **Strict backend 400 on unknown edge endpoints** *(LOW)* → silently ignoring edges whose source/target aren't in `nodes` (already in `is_dag`) is *more* robust: during handle removal an edge can momentarily reference a gone handle, and a 400 would fail an otherwise-valid pipeline. Kept the permissive guard.
- **Duplicate node-id count discrepancy** → unreachable given `getNodeID`'s collision-free ids; documented in Part 4 pitfalls rather than guarded against.

Everything else in the review was a confirmation, not a change request: Kahn's algorithm, POST + Pydantic, CORS regex, `scrollHeight` auto-resize, store-as-source-of-truth, single-action Zustand selectors, and the plain-CSS design system all stand as written.

---

## Files this guide touches (for the implementer)
- **New:** `src/nodes/BaseNode.js`, `src/nodes/BaseNode.css`, 5 new node files (`apiNode.js`, `mathNode.js`, `filterNode.js`, `noteNode.js`, `delayNode.js`).
- **Edit:** `src/nodes/{input,output,llm,text}Node.js`, `src/store.js` (add `pruneEdgesForNode`, cleaner `updateNodeField`), `src/ui.js` (register types, fix `100wv`), `src/toolbar.js`, `src/draggableNode.js`, `src/submit.js`, `src/index.css`, `backend/backend/main.py`.
