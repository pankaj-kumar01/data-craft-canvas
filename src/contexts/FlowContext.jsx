import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const STORAGE_KEY = 'flow-editor-state';

const generateNodeId = (type) => `${type}-${Date.now()}`;
const generateEdgeId = (source, target) => `edge-${source}-${target}-${Date.now()}`;

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
  const [contextMenu, setContextMenu] = useState({ visible: false, position: { x: 0, y: 0 }, nodeId: null, edgeId: null });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }, [nodes, edges]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: generateEdgeId(connection.source, connection.target),
      animated: false
    };
    setEdges((eds) => addEdge(newEdge, eds));

    // 🧠 Patch: trigger update in target node to refresh useFlowData
    setNodes((prev) => prev.map((n) =>
      n.id === connection.target ? { ...n, data: { ...n.data, triggerUpdate: Date.now() } } : n
    ));
  }, []);

  const addNode = useCallback((type, position) => {
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
          label: 'Graph',
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

    const id = generateNodeId(type);
    const newNode = {
      id,
      position,
      ...nodeConfig[type]
    };

    setNodes(prevNodes => [...prevNodes, newNode]);
    return id;
  }, []);

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes(prevNodes => prevNodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
    setEdges(prevEdges => prevEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
  }, []);

  const duplicateNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newId = generateNodeId(node.data.type);
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
    return newId;
  }, [nodes]);

  const deleteEdge = useCallback((edgeId) => {
    setEdges(prevEdges => prevEdges.filter(edge => edge.id !== edgeId));
  }, []);

  const showContextMenu = useCallback((position, nodeId = null, edgeId = null) => {
    setContextMenu({ visible: true, position, nodeId, edgeId });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu({ visible: false, position: { x: 0, y: 0 }, nodeId: null, edgeId: null });
  }, []);

  const exportFlow = useCallback(() => ({ nodes, edges }), [nodes, edges]);

  const importFlow = useCallback((flow) => {
    if (!flow?.nodes || !flow?.edges) {
      console.error('Invalid flow data');
      return false;
    }
    setNodes(flow.nodes);
    setEdges(flow.edges);
    return true;
  }, []);

  const resetFlow = useCallback(() => {
    setNodes(getInitialNodes());
    setEdges([]);
  }, []);

  return (
    <FlowContext.Provider
      value={{
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
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => useContext(FlowContext);
export default FlowContext;
