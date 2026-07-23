// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { ApiNode } from './nodes/apiNode';
import { MathNode } from './nodes/mathNode';
import { FilterNode } from './nodes/filterNode';
import { NoteNode } from './nodes/noteNode';
import { DelayNode } from './nodes/delayNode';
import { getDefaultNodeData } from './nodes/nodeDefaults';
import { withNodeErrorBoundary, CanvasErrorBoundary } from './NodeErrorBoundary';
import { CanvasActions } from './CanvasActions';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  customInput: withNodeErrorBoundary(InputNode),
  llm: withNodeErrorBoundary(LLMNode),
  customOutput: withNodeErrorBoundary(OutputNode),
  text: withNodeErrorBoundary(TextNode),
  api: withNodeErrorBoundary(ApiNode),
  math: withNodeErrorBoundary(MathNode),
  filter: withNodeErrorBoundary(FilterNode),
  note: withNodeErrorBoundary(NoteNode),
  delay: withNodeErrorBoundary(DelayNode),
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

// Reject self-loops (a node connecting to itself). ReactFlow's default
// strict connection mode already prevents source-to-source/target-to-target
// drags, so a same-node check is the remaining structural guard needed here.
const isValidConnection = (connection) => connection.source !== connection.target;

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const {
      nodes,
      edges,
      getNodeID,
      addNode,
      onNodesChange,
      onEdgesChange,
      onConnect
    } = useStore(selector, shallow);

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();

          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          if (event?.dataTransfer?.getData('application/reactflow')) {
            const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
            const type = appData?.nodeType;

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
              return;
            }

            const position = reactFlowInstance.project({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            });

            const nodeID = getNodeID(type);
            const newNode = {
              id: nodeID,
              type,
              position,
              data: getDefaultNodeData(type, nodeID),
            };

            addNode(newNode);
          }
        },
        [reactFlowInstance, getNodeID, addNode]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    return (
        <>
        <div ref={reactFlowWrapper} className="vs-canvas-wrapper" style={{width: '100%', height: '70vh', position: 'relative'}}>
            {nodes.length === 0 && (
              <div className="vs-canvas-empty">
                <span>Drag a node from the toolbar to begin</span>
              </div>
            )}
            <CanvasActions />
            <CanvasErrorBoundary>
              <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onInit={setReactFlowInstance}
                  nodeTypes={nodeTypes}
                  proOptions={proOptions}
                  snapGrid={[gridSize, gridSize]}
                  connectionLineType='smoothstep'
                  className="vs-canvas"
                  isValidConnection={isValidConnection}
                  fitView
                  deleteKeyCode={['Backspace', 'Delete']}
                  connectionRadius={30}
              >
                  <Background color="#d8cfba" gap={gridSize} />
                  <Controls />
                  <MiniMap />
              </ReactFlow>
            </CanvasErrorBoundary>
        </div>
        </>
    )
}
