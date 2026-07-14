# NodeForge — Visual DAG Pipeline Studio

> A full-stack visual pipeline builder built as a technical assessment for VectorShift.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![ReactFlow](https://img.shields.io/badge/ReactFlow-11-FF0072?style=flat)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)

---

## Overview

**NodeForge** lets users construct, style, and validate directed acyclic graphs (DAGs) of AI pipeline nodes entirely in the browser — with live structural feedback from a FastAPI backend. Nodes are drag-and-dropped onto an infinite canvas, connected with edges, and then submitted for real-time DAG analysis.

---

## ✨ Features

### 🧩 Part 1 — Node Abstraction System
- Designed a reusable **`BaseNode`** component that eliminates boilerplate — each new node is a thin config wrapper (~5–10 lines).
- Refactored all 4 original nodes (`Input`, `Output`, `LLM`, `Text`) to use the abstraction.
- Added **5 new node types** demonstrating the abstraction:

| Node | Inputs | Outputs | Purpose |
|---|---|---|---|
| `API` | prompt | response | Configurable URL + HTTP method |
| `Filter` | input | output | Conditional data filtering |
| `Math` | a, b | result | Arithmetic operations |
| `Delay` | input | output | Time-delay step |
| `Note` | — | — | Read-only annotation label |

### 🎨 Part 2 — Unified Design System
- Dark-mode design system with CSS custom properties (color tokens, spacing, shadows).
- **Color-coded nodes** by category: blue → Input, green → Output, purple → LLM, orange → Text.
- Styled toolbar with hover/active drag chips, dark canvas with dot grid, and a pill-shaped Submit button with gradient animation.

### 📝 Part 3 — Smart Text Node
- **Dynamic resize** — the textarea grows in width and height as you type.
- **Variable handle extraction** — typing `{{ variableName }}` auto-creates an input Handle on the left side of the node, spaced evenly.
- Handles are removed automatically when a variable is deleted, with edges cleaned up from the Zustand store.

### ⚡ Part 4 — Backend Integration
- **FastAPI** `POST /pipelines/parse` receives nodes + edges and returns:
  - `num_nodes`, `num_edges`, `is_dag`
- Cycle detection via **Kahn's algorithm** (BFS topological sort) in O(V + E).
- Flexible CORS accepts any `localhost` port — no config needed during development.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, ReactFlow, Zustand |
| Backend | Python 3, FastAPI, Uvicorn, Pydantic |
| Styling | Vanilla CSS with CSS custom properties (dark theme) |
| DAG Detection | Kahn's Algorithm (BFS topological sort) |

---

## 🚀 Getting Started

### Backend

```bash
cd backend/backend

# (Recommended) Create a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install fastapi uvicorn pydantic
uvicorn main:app --reload --port 8000
```

Backend runs at → `http://localhost:8000`

### Frontend

```bash
cd frontend/frontend
npm install
npm start
```

Frontend runs at → `http://localhost:3000`

---

## 📁 Project Structure

```
├── backend/
│   └── backend/
│       └── main.py              # FastAPI app — pipeline parse + DAG detection
└── frontend/
    └── frontend/
        └── src/
            ├── nodes/
            │   ├── BaseNode.js      # Reusable node abstraction
            │   ├── BaseNode.css     # Node design system styles
            │   ├── inputNode.js
            │   ├── outputNode.js
            │   ├── llmNode.js
            │   ├── textNode.js      # Dynamic resize + variable handles
            │   ├── apiNode.js
            │   ├── filterNode.js
            │   ├── mathNode.js
            │   ├── delayNode.js
            │   └── noteNode.js
            ├── store.js             # Zustand global state
            ├── ui.js                # Main canvas + ReactFlow config
            ├── toolbar.js           # Draggable node palette
            ├── submit.js            # Pipeline submit + backend call
            └── index.css            # Global dark-theme design system
```

---

## 🔑 Key Design Decisions

- **`BaseNode` abstraction** — a single source of truth for node rendering. Adding a new node type requires only declaring its `label`, `handles`, and `fields` — zero repeated JSX.
- **Regex-driven handles** — the Text node uses `/\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g` to parse variable names live, keeping the UI reactive to user input with no external dependencies.
- **Kahn's algorithm** — chosen over DFS cycle detection for clarity and correctness on disconnected graphs; it naturally detects cycles in O(V + E).
- **Flexible CORS** — backend uses `allow_origin_regex` to match any `localhost` port, so frontend hot-reload port changes never break the connection.

---

## 👤 Author

**Saransh Gupta** — [github.com/Saranshg14](https://github.com/Saranshg14)
