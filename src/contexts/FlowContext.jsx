
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const STORAGE_KEY = 'flow-editor-state';

// Initial node when creating a new flow
const getInitialNodes = () => [
  {
    id: 'start-node',
    type: 'startNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'Start',
      description: 'Starting point of your flow',
      type: 'start'
    }
  }
];

// Load flow from localStorage if available
const loadPersistedState = () => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        nodes: parsedState.nodes || getInitialNodes(),
        edges: parsedState.edges || []
      };
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
  
  return {
    nodes: getInitialNodes(),
    edges: []
  };
};

const FlowContext = createContext({});

export const FlowProvider = ({ children }) => {
  const initialState = loadPersistedState();
  
  const [nodes, setNodes] = useState(initialState.nodes);
  const [edges, setEdges] = useState(initialState.edges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    nodeId: null,
    edgeId: null
  });

  // Persist state to localStorage whenever nodes or edges change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ nodes, edges })
      );
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }, [nodes, edges]);

  // Node changes handler
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  // Edge changes handler
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  // Connect nodes
  const onConnect = useCallback(
    (connection) => {
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${uuidv4().slice(0, 8)}`,
        animated: false
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add a new node
  const addNode = useCallback(
    (type, position) => {
      const nodeConfig = {
        http: {
          type: 'httpNode',
          data: {
            label: 'HTTP Request',
            type: 'http',
            method: 'GET',
            url: '',
            headers: {},
            queryParams: {},
            body: '',
            formData: {},
            isLoading: false,
            response: null,
            error: null,
            activeTab: 'headers',
            isCollapsed: false
          }
        },
        graphql: {
          type: 'graphqlNode',
          data: {
            label: 'GraphQL Request',
            type: 'graphql',
            endpoint: '',
            query: '',
            variables: '',
            isLoading: false,
            response: null,
            error: null,
            isCollapsed: false
          }
        }
      };
      
      if (!nodeConfig[type]) {
        console.error(`Unknown node type: ${type}`);
        return;
      }
      
      const id = `${type}-${uuidv4().slice(0, 8)}`;
      const newNode = {
        id,
        position,
        ...nodeConfig[type]
      };
      
      setNodes(prevNodes => [...prevNodes, newNode]);
      return id;
    },
    [setNodes]
  );

  // Update node data
  const updateNodeData = useCallback(
    (nodeId, data) => {
      setNodes(prevNodes => prevNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          };
        }
        return node;
      }));
    },
    [setNodes]
  );

  // Delete node
  const deleteNode = useCallback(
    (nodeId) => {
      setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
      setEdges(prevEdges => prevEdges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      ));
    },
    [setNodes, setEdges]
  );

  // Duplicate node
  const duplicateNode = useCallback(
    (nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      const newId = `${node.data.type}-${uuidv4().slice(0, 8)}`;
      const newNode = {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20
        },
        selected: false
      };
      
      setNodes(prevNodes => [...prevNodes, newNode]);
      return newId;
    },
    [nodes, setNodes]
  );

  // Delete edge
  const deleteEdge = useCallback(
    (edgeId) => {
      setEdges(prevEdges => prevEdges.filter(edge => edge.id !== edgeId));
    },
    [setEdges]
  );

  // Context menu handlers
  const showContextMenu = useCallback(
    (position, nodeId = null, edgeId = null) => {
      setContextMenu({
        visible: true,
        position,
        nodeId,
        edgeId
      });
    },
    [setContextMenu]
  );

  const hideContextMenu = useCallback(
    () => {
      setContextMenu({
        visible: false,
        position: { x: 0, y: 0 },
        nodeId: null,
        edgeId: null
      });
    },
    [setContextMenu]
  );

  // Import/Export functions
  const exportFlow = useCallback(
    () => {
      return { nodes, edges };
    },
    [nodes, edges]
  );

  const importFlow = useCallback(
    (flow) => {
      if (!flow || !flow.nodes || !flow.edges) {
        console.error('Invalid flow data');
        return false;
      }
      
      setNodes(flow.nodes);
      setEdges(flow.edges);
      return true;
    },
    [setNodes, setEdges]
  );

  // Reset flow
  const resetFlow = useCallback(
    () => {
      setNodes(getInitialNodes());
      setEdges([]);
    },
    [setNodes, setEdges]
  );

  const value = {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    contextMenu,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    duplicateNode,
    deleteEdge,
    setSelectedNode,
    setSelectedEdge,
    showContextMenu,
    hideContextMenu,
    exportFlow,
    importFlow,
    resetFlow
  };

  return (
    <FlowContext.Provider value={value}>
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => {
  return useContext(FlowContext);
};

export default FlowContext;
