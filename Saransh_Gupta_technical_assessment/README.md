<div align="center">

![NodeForge Banner](./banner.png)

# ⚡ NodeForge

### *Visual DAG Pipeline Orchestration Studio*

**Build, connect, and validate intelligent data pipelines through a drag-and-drop canvas — powered by a graph-theory backend that catches cycles before they catch you.**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![ReactFlow](https://img.shields.io/badge/ReactFlow-11.8-FF0072?style=flat-square&logo=reactflow&logoColor=white)](https://reactflow.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Zustand](https://img.shields.io/badge/Zustand-4.x-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)

> *Drag. Connect. Validate. Execute.*

</div>

---

## 🧠 What Is NodeForge?

**NodeForge** is a full-stack visual pipeline editor — think a developer-friendly, low-code version of n8n or LangGraph, where you construct AI/data workflows by wiring nodes on an infinite canvas. The backend validates your graph in real-time, telling you whether your pipeline is a valid **Directed Acyclic Graph (DAG)** — the foundational guarantee any workflow executor needs before it can safely run.

This project was built to demonstrate deep competency across four engineering disciplines simultaneously:

| # | Challenge | Core Concept |
|---|---|---|
| 1 | **Node Abstraction System** | Component architecture, DRY principle, Config-driven UI |
| 2 | **Unified Design System** | CSS custom properties, design tokens, micro-animations |
| 3 | **Dynamic Text Node Logic** | Regex parsing, React state derivation, live ReactFlow handles |
| 4 | **Full-Stack Backend Integration** | REST API, Graph Theory (Kahn's Algorithm), CORS, Pydantic |

---

## ✨ Feature Highlights

- 🎨 **9 draggable node types** — Input, Output, LLM, Text, API, Math, Filter, Note, Delay
- 🏗️ **Config-driven `BaseNode` architecture** — add a new node in ~8 lines of code, zero boilerplate
- 📐 **Smart Text Node** — auto-resizing textarea that parses `{{variable}}` template literals into live connection handles dynamically
- ✅ **Pipeline DAG Validation** — FastAPI backend uses **Kahn's Algorithm** to detect cycles in O(V+E)
- 🔄 **50-step Undo / Redo** — full history managed in Zustand
- 💾 **Auto-persist to `localStorage`** — your canvas survives page refresh
- 🧪 **Simulated local execution** — step-by-step topological walkthrough without any external calls
- 🚫 **Self-loop prevention** + duplicate edge guard built into the connection layer
- 🔍 **Searchable node library** in the toolbar
- ⌨️ **Keyboard shortcuts** — `Backspace`/`Delete` to remove selected nodes
- 🛡️ **Per-node `ErrorBoundary`** — one broken node cannot crash the entire canvas

---

## 🗂️ Project Structure

```
NodeForge/
├── frontend/                     # React (CRA) application
│   └── src/
│       ├── nodes/
│       │   ├── BaseNode.js       ← ★ The core abstraction layer
│       │   ├── BaseNode.css      ← Shared node card styles + design tokens
│       │   ├── textNode.js       ← Dynamic handles via regex variable extraction
│       │   ├── llmNode.js        ← 8-line thin config wrapper
│       │   ├── apiNode.js        ← 8-line thin config wrapper
│       │   ├── mathNode.js       ← 8-line thin config wrapper
│       │   ├── filterNode.js     ← 8-line thin config wrapper
│       │   ├── noteNode.js       ← 8-line thin config wrapper
│       │   ├── delayNode.js      ← 8-line thin config wrapper
│       │   ├── inputNode.js      ← Core input node
│       │   ├── outputNode.js     ← Core output node
│       │   └── nodeDefaults.js   ← Single source of truth for initial node data
│       ├── store.js              ← Zustand store (state + undo/redo + persistence)
│       ├── ui.js                 ← ReactFlow canvas + drag-drop wiring
│       ├── toolbar.js            ← Searchable node library panel
│       ├── submit.js             ← API call + simulated execution UI
│       ├── CanvasActions.js      ← Undo, redo, clear, duplicate actions
│       ├── draggableNode.js      ← Drag-source chip component
│       ├── NodeErrorBoundary.js  ← Per-node crash isolation
│       ├── execution/
│       │   └── runPipeline.js    ← Local topological simulation engine
│       └── index.css             ← Global design system (CSS variables)
└── backend/
    ├── main.py                   ← FastAPI server + Kahn's DAG algorithm
    └── test_main.py              ← Pytest test suite
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 16 |
| npm | ≥ 8 |
| Python | ≥ 3.8 |

### 1. Start the Backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv .venv

# Activate it
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install fastapi "uvicorn[standard]" pydantic pytest httpx

# Run the development server
uvicorn main:app --reload --port 8000
```

> The API is live at `http://localhost:8000`
> Interactive Swagger docs at `http://localhost:8000/docs`

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm start
```

> Open [http://localhost:3000](http://localhost:3000) and start building pipelines!

---

## 🏗️ Architecture Deep Dive

### 1 — The `BaseNode` Abstraction (Config-Driven Components)

The original scaffold had 4 isolated node components duplicating 100% of the boilerplate — same `<Handle>` placements, same border styles, same `useState` patterns. Every new node type would multiply this tech debt.

**The key insight:** a node's entire identity is captured by just three things — its `title`, its `fields` (what controls it renders), and its `handles` (where connections attach). Everything else is shared infrastructure.

```js
// ❌ BEFORE — every node repeated ~40 lines of boilerplate
export const LLMNode = ({ id, data }) => {
  const [model, setModel] = useState('gpt-4o');
  // ... 40+ repetitive lines of JSX identical to every other node
};

// ✅ AFTER — a declarative 8-line config wrapper
export const LLMNode = (props) => (
  <BaseNode
    {...props}
    title="LLM"
    category="llm"
    fields={[
      { key: 'model',       label: 'Model',       type: 'select', default: 'gpt-4o',
        options: ['gpt-4o', 'gpt-4o-mini', 'claude-opus', 'claude-sonnet'] },
      { key: 'temperature', label: 'Temperature', type: 'text',   default: '0.7' },
    ]}
    handles={{ inputs: ['system', 'prompt'], outputs: ['response'] }}
  />
);
```

`BaseNode` takes this config and:
- Renders the styled card shell with category-color accent border
- Maps each `field` → the correct HTML control (`input`, `select`, or `textarea`)
- Wires every change to `store.updateNodeField()` automatically — zero manual state
- Spaces handles evenly using `((i + 1) / (n + 1)) * 100%` — elegant and self-correcting
- Provides a delete button that cascades edge cleanup through the Zustand store

This is the **Open/Closed Principle** made concrete: open for extension (drop in a new node), closed for modification (never touch `BaseNode` to do it).

---

### 2 — Design System (CSS Custom Properties as Design Tokens)

Rather than scattering raw hex values across component files, the entire visual language is declared once in **CSS custom properties** at `:root`:

```css
:root {
  --bg-page:    #f7f4ec;   /* warm cream canvas */
  --bg-surface: #fffefa;   /* node cards — slightly brighter */
  --gold:       #a8763e;   /* single brand accent */
  --ink:        #17181a;   /* near-black primary text */
  --ink-dim:    #5b5b58;   /* secondary / muted text */

  /* Per-category color palette */
  --c-input:  #3d5a80;   /* muted steel blue */
  --c-llm:    #6b4c8a;   /* soft purple */
  --c-output: #3f6b4f;   /* forest green */
  --c-api:    #1f6f78;   /* teal */
  --c-math:   #8a4a63;   /* mauve */
  --c-filter: #5f7a2f;   /* olive */
  --c-note:   #8a6d1f;   /* amber */
  --c-delay:  #55565c;   /* slate */
}
```

Every `vs-node--{category}` class overrides a single `border-left-color`. Color-coding 9 node types costs 9 × 1 CSS line — not 9 × 40 lines. Swap the entire theme by changing one `:root` block.

---

### 3 — Dynamic Text Node (Live Template Variable Parsing)

The Text Node solves two problems that look trivial but have real engineering depth.

**Auto-resize:**

The trick is a `useEffect` that first collapses the textarea height to `auto`, *then* expands to `scrollHeight`. The collapse step is non-obvious — without it, the element can only grow, never shrink when text is deleted.

```js
useEffect(() => {
  const ta = taRef.current;
  if (!ta) return;
  ta.style.height = 'auto';                    // collapse first (mandatory!)
  ta.style.height = `${ta.scrollHeight}px`;    // then expand to fit content
}, [currText]);
```

**Live template variable extraction:**

When you type `{{userName}}` in the text, a new input handle appears on the left side of the node — live, as you type. This mirrors how tools like Zapier or LangChain handle prompt templating.

```js
// This regex is the exact definition of a valid JavaScript identifier
const VAR_RE = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

const extractVariables = (text) => {
  const vars = new Set();  // Set auto-deduplicates: {{name}} {{name}} → one handle
  let m;
  while ((m = VAR_RE.exec(text)) !== null) vars.add(m[1]);
  return [...vars];
};
```

**The edge-cleanup problem:** If a user removes `{{name}}` from the text, the handle disappears — but any edge connected to that handle becomes a dangling reference. The Zustand store's `pruneEdgesForNode` filters edges on every text change, but only writes to the store when an edge was *actually* removed — preventing unnecessary full-canvas re-renders on every keystroke.

---

### 4 — Backend: DAG Detection with Kahn's Algorithm

The `POST /pipelines/parse` endpoint answers one structural question: **does this graph contain a cycle?**

Why does it matter? Any workflow executor (Airflow, Prefect, LangGraph) requires a DAG. A cycle means Task A waits for Task B, which waits for Task A — a deadlock. Catching this upfront prevents silent runtime failures.

**Kahn's Algorithm** (BFS-based topological sort, O(V+E)):

```python
def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    ids = {n.id for n in nodes}
    graph = defaultdict(list)
    indegree = {nid: 0 for nid in ids}

    for e in edges:
        if e.source in ids and e.target in ids:
            graph[e.source].append(e.target)
            indegree[e.target] += 1

    # Begin with every node that has no dependencies
    queue = deque([nid for nid in ids if indegree[nid] == 0])
    visited = 0

    while queue:
        cur = queue.popleft()
        visited += 1
        for nxt in graph[cur]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:   # all dependencies satisfied
                queue.append(nxt)

    # If visited == total nodes, every node was reachable without a cycle
    return visited == len(ids)
```

**The key insight:** a DAG can always be *fully consumed* by a BFS that only processes nodes with `indegree == 0`. If the BFS ends and we haven't visited all nodes, the remaining ones are locked in a cycle — their in-degree never hit zero because they depend on each other circularly.

---

## 🧪 Running Tests

```bash
cd backend
pytest test_main.py -v
```

The test suite covers:
- `GET /` health check (ping/pong)
- `POST /pipelines/parse` with a valid linear graph → `is_dag: true`
- `POST /pipelines/parse` with a cyclic graph → `is_dag: false`
- Node and edge count validation

---

## 🎯 Technical Decisions & Trade-offs

| Decision | Rationale |
|---|---|
| **Zustand** over Redux | Zero boilerplate, built-in selector memoization, 1/10th the ceremony for the same power |
| **CSS Custom Properties** over Tailwind | Full design token control, no build step dependency, trivial to theme-swap |
| **`deque` in Kahn's** over `list.pop(0)` | `deque.popleft()` is O(1); `list.pop(0)` shifts the entire array — O(n) |
| **`Set` for variable deduplication** | Deduplication is implicit — no extra filter pass needed |
| **`pruneEdgesForNode` guard** | Only writes to store when an edge was actually removed; prevents re-renders on every keystroke |
| **`allow_origin_regex` in CORS** | Matches any localhost port — dev works on 3000, 3001, etc. without hardcoding |
| **Per-node `ErrorBoundary`** | One broken node component cannot crash the entire canvas |
| **`useCallback` on field handlers** | Stable function references prevent unnecessary child re-renders inside `BaseNode` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18 (Create React App) |
| **Graph Canvas** | ReactFlow 11 |
| **State Management** | Zustand 4 |
| **Backend Framework** | FastAPI |
| **Data Validation** | Pydantic v2 |
| **ASGI Server** | Uvicorn |
| **Testing** | Pytest + HTTPX |
| **Styling** | Vanilla CSS + CSS Custom Properties |
| **Fonts** | Inter, Instrument Serif, JetBrains Mono |

---

## 👤 Author

**Saransh Gupta**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/saransh-gupta-2a9383219/)

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

*Built with ☕, graph theory, and a healthy obsession with clean abstractions.*

**⭐ Star this repo if it helped you think differently about component architecture!**

</div>
