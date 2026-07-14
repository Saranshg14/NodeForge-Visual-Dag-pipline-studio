// runPipeline.js
// A deterministic, local simulation of pipeline execution. There are no
// external network calls and no API keys involved — LLM/API nodes return a
// clearly-labeled mock result, while Math actually computes and Text
// actually resolves connected variables. This exists to demonstrate
// topological execution order and per-node data flow, not to replace a real
// execution backend (which would need provider credentials and is out of
// scope here).

const topologicalOrder = (nodes, edges) => {
  const ids = nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const graph = new Map(ids.map((id) => [id, []]));
  const indegree = new Map(ids.map((id) => [id, 0]));

  edges.forEach((e) => {
    if (idSet.has(e.source) && idSet.has(e.target)) {
      graph.get(e.source).push(e);
      indegree.set(e.target, (indegree.get(e.target) || 0) + 1);
    }
  });

  const queue = ids.filter((id) => indegree.get(id) === 0);
  const order = [];
  while (queue.length) {
    const cur = queue.shift();
    order.push(cur);
    (graph.get(cur) || []).forEach((e) => {
      indegree.set(e.target, indegree.get(e.target) - 1);
      if (indegree.get(e.target) === 0) queue.push(e.target);
    });
  }

  return { order, isDag: order.length === ids.length };
};

const resolveUpstream = (nodeId, handleId, edges, results) => {
  const edge = edges.find(
    (e) => e.target === nodeId && e.targetHandle === `${nodeId}-${handleId}`
  );
  if (!edge) return undefined;
  return results.get(edge.source);
};

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

const runNode = (node, edges, results) => {
  const { type, data, id } = node;

  switch (type) {
    case 'customInput':
      return { summary: `${data.inputName} (${data.inputType})`, value: data.inputName };

    case 'text': {
      const varRe = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
      const resolved = (data.text || '').replace(varRe, (match, varName) => {
        const upstream = resolveUpstream(id, `var-${varName}`, edges, results);
        return upstream !== undefined ? String(upstream.value ?? upstream.summary ?? '') : match;
      });
      return { summary: resolved, value: resolved };
    }

    case 'llm': {
      const prompt = resolveUpstream(id, 'prompt', edges, results);
      const promptText = prompt?.value ?? prompt?.summary ?? '(no prompt connected)';
      return {
        summary: `[simulated ${data.model || 'gpt-4o'} @ T=${data.temperature ?? '0.7'}] → "${String(promptText).slice(0, 60)}"`,
        value: `Simulated response for: ${promptText}`,
      };
    }

    case 'math': {
      const a = toNumber(resolveUpstream(id, 'a', edges, results)?.value);
      const b = toNumber(resolveUpstream(id, 'b', edges, results)?.value);
      if (a === null || b === null) {
        return { summary: 'waiting on numeric inputs a & b', value: null };
      }
      const ops = { Add: a + b, Subtract: a - b, Multiply: a * b, Divide: b !== 0 ? a / b : NaN };
      const result = ops[data.operation] ?? NaN;
      return { summary: `${a} ${data.operation} ${b} = ${result}`, value: result };
    }

    case 'filter': {
      const input = resolveUpstream(id, 'in', edges, results);
      return { summary: `condition "${data.condition}" checked against upstream value`, value: input?.value };
    }

    case 'api':
      return { summary: `[simulated] ${data.method} ${data.url}`, value: { status: 200, mocked: true } };

    case 'delay':
      return {
        summary: `waits ${data.seconds}s, then passes its input through`,
        value: resolveUpstream(id, 'trigger', edges, results)?.value,
      };

    case 'note':
      return { summary: '(note — not part of execution)', value: null };

    case 'customOutput': {
      const input = resolveUpstream(id, 'value', edges, results);
      return { summary: `received: ${JSON.stringify(input?.value ?? null)}`, value: input?.value };
    }

    default:
      return { summary: '(unhandled node type)', value: null };
  }
};

export const simulateExecution = (nodes, edges) => {
  const { order, isDag } = topologicalOrder(nodes, edges);
  if (!isDag) {
    return { isDag: false, steps: [] };
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const results = new Map();

  const steps = order.map((id) => {
    const node = nodeById.get(id);
    const result = runNode(node, edges, results);
    results.set(id, result);
    return { id, type: node.type, result };
  });

  return { isDag: true, steps };
};
