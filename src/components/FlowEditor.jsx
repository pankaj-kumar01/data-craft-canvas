// src/components/FlowEditor.jsx
import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlow } from '../contexts/FlowContext';
import Toolbar from './Toolbar';
import ContextMenu from './ContextMenu';

import StartNode from './nodes/StartNode';
import HttpNode from './nodes/HttpNode';
import GraphqlNode from './nodes/GraphqlNode';

const nodeTypes = {
  startNode: StartNode,
  httpNode: HttpNode,
  graphqlNode: GraphqlNode
};

const FlowEditor = () => {
  const wrapperRef = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    showContextMenu,
    hideContextMenu
  } = useFlow();

  // Capture the ReactFlow instance
  const onInit = useCallback((instance) => {
    console.log('Captured ReactFlow instance:', instance);
    setRfInstance(instance);
  }, []);

  // Add node at center using screenToFlowPosition
  const onAddNode = useCallback((type) => {
    if (!wrapperRef.current || !rfInstance) {
      console.error('Add Node: wrapper or rfInstance missing');
      return;
    }

    // Use screenToFlowPosition instead of project
    const bounds = wrapperRef.current.getBoundingClientRect();
    const flowPosition = rfInstance.screenToFlowPosition({
      x: bounds.width / 2,
      y: bounds.height / 2
    });

    // Offset so node appears centered
    const position = {
      x: flowPosition.x - 140,
      y: flowPosition.y - 100
    };

    addNode(type, position);
  }, [rfInstance, addNode]);

  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault();
    const pane = wrapperRef.current.querySelector('.react-flow__pane');
    const { top, left } = pane.getBoundingClientRect();
    showContextMenu({ x: e.clientX - left, y: e.clientY - top }, node.id);
  }, [showContextMenu]);

  const onEdgeContextMenu = useCallback((e, edge) => {
    e.preventDefault();
    const pane = wrapperRef.current.querySelector('.react-flow__pane');
    const { top, left } = pane.getBoundingClientRect();
    showContextMenu({ x: e.clientX - left, y: e.clientY - top }, null, edge.id);
  }, [showContextMenu]);

  const onPaneClick = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);

  return (
    <div className="flow-editor w-full h-screen" ref={wrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={onInit}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{ animated: false, style: { strokeWidth: 2 } }}
      >
        <Background color="#aaa" gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'startNode') return '#FF8A65';
            if (n.type === 'httpNode') return '#42A5F5';
            if (n.type === 'graphqlNode') return '#AB47BC';
            return '#eee';
          }}
          nodeColor={(n) => {
            if (n.type === 'startNode') return '#FFCCBC';
            if (n.type === 'httpNode') return '#BBDEFB';
            if (n.type === 'graphqlNode') return '#E1BEE7';
            return '#fff';
          }}
          nodeBorderRadius={3}
        />
        <Panel position="top-center">
          <Toolbar onAddNode={onAddNode} />
        </Panel>
      </ReactFlow>
      <ContextMenu />
    </div>
  );
};

export default FlowEditor;
