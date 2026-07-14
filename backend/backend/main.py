from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from collections import deque, defaultdict

app = FastAPI()

# Regex covers localhost on any port (3000, 3001, ...) without hardcoding one.
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
        if e.source in ids and e.target in ids:
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

    return visited == len(ids)


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
