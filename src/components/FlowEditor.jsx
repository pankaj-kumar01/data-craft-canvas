
import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlow } from '../contexts/FlowContext';
import Toolbar from './Toolbar';
import ContextMenu from './ContextMenu';

import StartNode from './nodes/StartNode';
import HttpNode from './nodes/HttpNode';
import GraphqlNode from './nodes/GraphqlNode';

// Node types registration
const nodeTypes = {
  startNode: StartNode,
  httpNode: HttpNode,
  graphqlNode: GraphqlNode
};

const FlowEditor = () => {
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useReactFlow();
  
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
  
  const onAddNode = useCallback(
    (type) => {
      if (!reactFlowWrapper.current || !reactFlowInstance) return;
      
      // Get the center position of the viewport
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: (reactFlowBounds.width / 2) - 140,
        y: (reactFlowBounds.height / 2) - 100
      });
      
      // Add the node with the calculated position
      addNode(type, position);
    },
    [reactFlowInstance, addNode]
  );
  
  const onNodeContextMenu = useCallback(
    (event, node) => {
      // Prevent native context menu from showing
      event.preventDefault();
      
      const pane = reactFlowWrapper.current.querySelector('.react-flow__pane');
      const { top, left } = pane.getBoundingClientRect();
      
      showContextMenu(
        {
          x: event.clientX - left,
          y: event.clientY - top
        },
        node.id
      );
    },
    [showContextMenu]
  );
  
  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      
      const pane = reactFlowWrapper.current.querySelector('.react-flow__pane');
      const { top, left } = pane.getBoundingClientRect();
      
      showContextMenu(
        {
          x: event.clientX - left,
          y: event.clientY - top
        },
        null,
        edge.id
      );
    },
    [showContextMenu]
  );
  
  const onPaneClick = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);
  
  return (
    <div className="flow-editor w-full h-screen" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={1.5}
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 }
        }}
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
