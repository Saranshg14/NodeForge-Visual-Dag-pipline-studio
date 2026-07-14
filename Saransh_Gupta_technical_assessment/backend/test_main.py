from fastapi.testclient import TestClient
from main import app, is_dag, Node, Edge

client = TestClient(app)


def n(*ids):
    return [Node(id=i) for i in ids]


def e(*pairs):
    return [Edge(source=s, target=t) for s, t in pairs]


def test_empty_graph_is_dag():
    assert is_dag([], []) is True


def test_single_node_no_edges_is_dag():
    assert is_dag(n("a"), []) is True


def test_linear_chain_is_dag():
    assert is_dag(n("a", "b", "c"), e(("a", "b"), ("b", "c"))) is True


def test_disconnected_components_is_dag():
    assert is_dag(n("a", "b", "c", "d"), e(("a", "b"), ("c", "d"))) is True


def test_two_node_cycle_is_not_dag():
    assert is_dag(n("a", "b"), e(("a", "b"), ("b", "a"))) is False


def test_three_node_cycle_is_not_dag():
    assert is_dag(n("a", "b", "c"), e(("a", "b"), ("b", "c"), ("c", "a"))) is False


def test_self_loop_is_not_dag():
    assert is_dag(n("a"), e(("a", "a"))) is False


def test_cycle_with_extra_acyclic_branch_is_not_dag():
    # a->b->c->a is a cycle; d hanging off b is irrelevant to the cycle check
    assert is_dag(n("a", "b", "c", "d"), e(("a", "b"), ("b", "c"), ("c", "a"), ("b", "d"))) is False


def test_edge_referencing_unknown_node_is_ignored():
    # target 'z' isn't in the node list — should not crash and should not
    # affect the acyclic verdict of the known nodes
    assert is_dag(n("a", "b"), e(("a", "b"), ("b", "z"))) is True


def test_endpoint_returns_expected_shape():
    response = client.post(
        "/pipelines/parse",
        json={
            "nodes": [{"id": "a"}, {"id": "b"}, {"id": "c"}],
            "edges": [{"source": "a", "target": "b"}, {"source": "b", "target": "c"}],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body == {"num_nodes": 3, "num_edges": 2, "is_dag": True}


def test_endpoint_detects_cycle():
    response = client.post(
        "/pipelines/parse",
        json={
            "nodes": [{"id": "a"}, {"id": "b"}],
            "edges": [{"source": "a", "target": "b"}, {"source": "b", "target": "a"}],
        },
    )
    assert response.status_code == 200
    assert response.json()["is_dag"] is False


def test_endpoint_rejects_malformed_body():
    response = client.post("/pipelines/parse", json={"nodes": "not-a-list", "edges": []})
    assert response.status_code == 422
