
import React, { useCallback, useRef, useState, useEffect } from 'react';
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

// Node types registration
const nodeTypes = {
  startNode: StartNode,
  httpNode: HttpNode,
  graphqlNode: GraphqlNode
};

const FlowEditor = () => {
  const reactFlowWrapper = useRef(null);
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
  
  // Log the values for debugging
  useEffect(() => {
    console.log('FlowEditor - Current state:', { 
      nodesCount: nodes.length,
      edgesCount: edges.length,
      rfInstanceExists: !!rfInstance,
      wrapperExists: !!reactFlowWrapper.current
    });
  }, [nodes, edges, rfInstance]);
  
  const onAddNode = useCallback(
    (type) => {
      console.log('onAddNode called with type:', type);
      console.log('RF instance exists:', !!rfInstance);
      console.log('Wrapper exists:', !!reactFlowWrapper.current);
      
      if (!reactFlowWrapper.current) {
        console.error('Cannot add node: reactFlowWrapper not available');
        return;
      }
      
      if (!rfInstance) {
        console.error('Cannot add node: RF instance not available');
        return;
      }
      
      try {
        // Get the center position of the viewport
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        console.log('Flow bounds:', reactFlowBounds);
        
        const position = rfInstance.project({
          x: (reactFlowBounds.width / 2) - 140,
          y: (reactFlowBounds.height / 2) - 100
        });
        
        console.log('Calculated position:', position);
        
        // Add the node with the calculated position
        addNode(type, position);
      } catch (error) {
        console.error('Error adding node:', error);
      }
    },
    [rfInstance, addNode]
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

  const onInit = useCallback((reactFlowInstance) => {
    console.log('Flow initialized with instance:', reactFlowInstance);
    setRfInstance(reactFlowInstance);
  }, []);
  
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
        onInit={onInit}
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
