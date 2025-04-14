
import { create } from 'zustand';
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

const persistState = (state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nodes: state.nodes,
        edges: state.edges
      })
    );
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
};

const useFlowStore = create((set, get) => {
  const initialState = loadPersistedState();
  
  return {
    // Flow state
    nodes: initialState.nodes,
    edges: initialState.edges,
    selectedNode: null,
    selectedEdge: null,
    contextMenu: {
      visible: false,
      position: { x: 0, y: 0 },
      nodeId: null,
      edgeId: null
    },
    
    // Flow actions
    onNodesChange: (changes) => {
      set((state) => {
        const updatedNodes = applyNodeChanges(changes, state.nodes);
        const newState = { ...state, nodes: updatedNodes };
        persistState(newState);
        return newState;
      });
    },
    
    onEdgesChange: (changes) => {
      set((state) => {
        const updatedEdges = applyEdgeChanges(changes, state.edges);
        const newState = { ...state, edges: updatedEdges };
        persistState(newState);
        return newState;
      });
    },
    
    onConnect: (connection) => {
      set((state) => {
        const newEdge = {
          ...connection,
          id: `edge-${connection.source}-${connection.target}-${uuidv4().slice(0, 8)}`,
          animated: false
        };
        const updatedEdges = addEdge(newEdge, state.edges);
        const newState = { ...state, edges: updatedEdges };
        persistState(newState);
        return newState;
      });
    },
    
    // Node actions
    addNode: (type, position) => {
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
      
      set((state) => {
        const updatedNodes = [...state.nodes, newNode];
        const newState = { ...state, nodes: updatedNodes };
        persistState(newState);
        return newState;
      });
      
      return id;
    },
    
    updateNodeData: (nodeId, data) => {
      set((state) => {
        const updatedNodes = state.nodes.map((node) => {
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
        });
        
        const newState = { ...state, nodes: updatedNodes };
        persistState(newState);
        return newState;
      });
    },
    
    deleteNode: (nodeId) => {
      set((state) => {
        // Remove the node
        const updatedNodes = state.nodes.filter((node) => node.id !== nodeId);
        
        // Remove all connected edges
        const updatedEdges = state.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        );
        
        const newState = {
          ...state,
          nodes: updatedNodes,
          edges: updatedEdges
        };
        
        persistState(newState);
        return newState;
      });
    },
    
    duplicateNode: (nodeId) => {
      const node = get().nodes.find((n) => n.id === nodeId);
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
      
      set((state) => {
        const updatedNodes = [...state.nodes, newNode];
        const newState = { ...state, nodes: updatedNodes };
        persistState(newState);
        return newState;
      });
      
      return newId;
    },
    
    // Edge actions
    deleteEdge: (edgeId) => {
      set((state) => {
        const updatedEdges = state.edges.filter((edge) => edge.id !== edgeId);
        const newState = { ...state, edges: updatedEdges };
        persistState(newState);
        return newState;
      });
    },
    
    // UI state
    setSelectedNode: (nodeId) => {
      set({ selectedNode: nodeId });
    },
    
    setSelectedEdge: (edgeId) => {
      set({ selectedEdge: edgeId });
    },
    
    // Context menu
    showContextMenu: (position, nodeId = null, edgeId = null) => {
      set({
        contextMenu: {
          visible: true,
          position,
          nodeId,
          edgeId
        }
      });
    },
    
    hideContextMenu: () => {
      set({
        contextMenu: {
          visible: false,
          position: { x: 0, y: 0 },
          nodeId: null,
          edgeId: null
        }
      });
    },
    
    // Import/Export
    exportFlow: () => {
      const state = get();
      return {
        nodes: state.nodes,
        edges: state.edges
      };
    },
    
    importFlow: (flow) => {
      if (!flow || !flow.nodes || !flow.edges) {
        console.error('Invalid flow data');
        return false;
      }
      
      set({ nodes: flow.nodes, edges: flow.edges });
      persistState({ nodes: flow.nodes, edges: flow.edges });
      return true;
    },
    
    // Reset flow
    resetFlow: () => {
      const initialState = {
        nodes: getInitialNodes(),
        edges: []
      };
      set(initialState);
      persistState(initialState);
    }
  };
});

export default useFlowStore;
